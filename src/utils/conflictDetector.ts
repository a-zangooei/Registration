import { Course, TimeSlot, ConflictReason, StudentSelections } from '../types';
import { COURSES_DATA, EXTERNAL_PASSED_COURSES } from '../data/courses';

/**
 * Converts "HH:MM" string to minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Checks if two time intervals on the same day overlap.
 */
export function doSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) return false;
  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);

  return start1 < end2 && start2 < end1;
}

/**
 * Extracts all active weekly time slots for a course based on student gender and chosen practical group.
 * If no specific group is chosen (or 'ALL_TENTATIVE'), all practical groups are included as tentative slots.
 */
export function getActiveSlotsForCourse(
  course: Course,
  gender: 'male' | 'female',
  selectedPracticalGroupId?: string
): TimeSlot[] {
  const slots: TimeSlot[] = course.theorySchedule.map((s) => ({
    ...s,
    isTentative: false,
  }));

  // Gender-specific theory schedules (for general courses)
  if (course.genderSchedules) {
    const genderSlots = course.genderSchedules[gender] || [];
    slots.push(
      ...genderSlots.map((s) => ({
        ...s,
        isTentative: false,
      }))
    );
  }

  // Practical lab groups
  if (course.practicalGroups && course.practicalGroups.length > 0) {
    const isSpecificSelected =
      selectedPracticalGroupId &&
      selectedPracticalGroupId !== 'ALL_TENTATIVE';

    if (isSpecificSelected) {
      const targetGroup = course.practicalGroups.find(
        (g) => g.id === selectedPracticalGroupId
      );
      if (targetGroup) {
        slots.push(
          ...targetGroup.slots.map((s) => ({
            ...s,
            isTentative: false,
            groupId: targetGroup.id,
            groupName: targetGroup.name,
          }))
        );
      }
    } else {
      // Default: Include all practical groups as tentative / hatched slots
      for (const grp of course.practicalGroups) {
        slots.push(
          ...grp.slots.map((s) => ({
            ...s,
            isTentative: true,
            groupId: grp.id,
            groupName: grp.name,
            label: `عملی (شناور): ${grp.name}`,
          }))
        );
      }
    }
  }

  return slots;
}

/**
 * Checks all conflicts between two courses A and B.
 */
export function checkTwoCoursesConflict(
  courseA: Course,
  courseB: Course,
  selections: StudentSelections
): ConflictReason[] {
  const reasons: ConflictReason[] = [];

  // 1. Class time conflict
  const slotsA = getActiveSlotsForCourse(
    courseA,
    selections.gender,
    selections.selectedPracticalGroups[courseA.id]
  );
  const slotsB = getActiveSlotsForCourse(
    courseB,
    selections.gender,
    selections.selectedPracticalGroups[courseB.id]
  );

  for (const slotA of slotsA) {
    for (const slotB of slotsB) {
      if (doSlotsOverlap(slotA, slotB)) {
        // Tentative practical slots are NOT conflicts (they are chosen later by student)
        if (slotA.isTentative || slotB.isTentative) {
          continue;
        }

        reasons.push({
          type: 'class_time',
          severity: 'error',
          title: `تداخل زمانی قطعی کلاس در ${slotA.day}`,
          description: `تداخل ساعت ${slotA.startTime} تا ${slotA.endTime} درس «${courseA.name}» با ساعت ${slotB.startTime} تا ${slotB.endTime} درس «${courseB.name}»`,
          conflictingWithCourseId: courseB.id,
          conflictingWithCourseName: courseB.name,
          details: `${slotA.day}: ${slotA.startTime}-${slotA.endTime}`,
        });
      }
    }
  }

  // 2. Final Exam conflict
  if (
    courseA.finalExam &&
    courseB.finalExam &&
    courseA.finalExam.date === courseB.finalExam.date
  ) {
    reasons.push({
      type: 'exam_date',
      title: 'تداخل تاریخ آزمون پایان‌ترم',
      description: `هر دو درس «${courseA.name}» و «${courseB.name}» در تاریخ ${courseA.finalExam.date} امتحان پایان‌ترم دارند.`,
      conflictingWithCourseId: courseB.id,
      conflictingWithCourseName: courseB.name,
      details: `تاریخ پایان‌ترم: ${courseA.finalExam.date}`,
    });
  }

  // 3. Midterm Exam conflict
  if (
    courseA.midtermExam &&
    courseB.midtermExam &&
    courseA.midtermExam.date === courseB.midtermExam.date
  ) {
    reasons.push({
      type: 'exam_date',
      title: 'تداخل تاریخ آزمون حذفی / میان‌ترم',
      description: `هر دو درس «${courseA.name}» و «${courseB.name}» در تاریخ ${courseA.midtermExam.date} امتحان حذفی/میان‌ترم دارند.`,
      conflictingWithCourseId: courseB.id,
      conflictingWithCourseName: courseB.name,
      details: `تاریخ میان‌ترم: ${courseA.midtermExam.date}`,
    });
  }

  return reasons;
}

/**
 * Checks prerequisite and corequisite rules for a given course in context of current selections.
 */
export function checkCoursePrerequisites(
  course: Course,
  selectedCourseIds: string[]
): ConflictReason[] {
  const reasons: ConflictReason[] = [];

  // Rule from prompt: "تمام دروس ارایه شده در فایل گزارش مارکدون، پاس نشده‌اند و سایرین پاس شده‌اند که نیامده."
  // If prerequisite code is in the report, it is NOT passed!
  for (const prereqCode of course.prerequisites) {
    // Is it in the report?
    const reportCourse = COURSES_DATA.find((c) => c.code === prereqCode);
    if (reportCourse) {
      // It exists in the report, meaning the student hasn't passed it!
      reasons.push({
        type: 'prerequisite',
        title: 'عدم رعایت پیش‌نیاز الزامی',
        description: `درس «${course.name}» نیاز به پیش‌نیاز «${reportCourse.name}» (${prereqCode}) دارد که هنوز پاس نشده است.`,
        conflictingWithCourseId: reportCourse.id,
        conflictingWithCourseName: reportCourse.name,
        details: `کد پیش‌نیاز: ${prereqCode}`,
      });
    } else if (!EXTERNAL_PASSED_COURSES.has(prereqCode)) {
      // Unknown prerequisite
      reasons.push({
        type: 'prerequisite',
        title: 'عدم احراز پیش‌نیاز',
        description: `پیش‌نیاز با کد ${prereqCode} برای این درس احراز نشده است.`,
      });
    }
  }

  // Corequisites: Must be selected together
  if (course.corequisites) {
    for (const coreqCode of course.corequisites) {
      const coreqCourse = COURSES_DATA.find((c) => c.code === coreqCode);
      if (coreqCourse && !selectedCourseIds.includes(coreqCourse.id)) {
        reasons.push({
          type: 'corequisite',
          title: 'عدم اخذ درس هم‌نیاز',
          description: `درس «${course.name}» هم‌نیاز درس «${coreqCourse.name}» (${coreqCode}) است و باید هر دو همزمان انتخاب شوند.`,
          conflictingWithCourseId: coreqCourse.id,
          conflictingWithCourseName: coreqCourse.name,
          details: `کد هم‌نیاز: ${coreqCode}`,
        });
      }
    }
  }

  return reasons;
}

/**
 * Evaluates the full conflict status for all selected courses.
 * Returns a map of courseId -> array of ConflictReasons.
 */
export function evaluateAllConflicts(
  selections: StudentSelections
): Record<string, ConflictReason[]> {
  const conflictMap: Record<string, ConflictReason[]> = {};
  const selectedCourses = COURSES_DATA.filter((c) =>
    selections.selectedCourseIds.includes(c.id)
  );

  // Initialize empty arrays
  for (const c of COURSES_DATA) {
    conflictMap[c.id] = [];
  }

  // 1. Check prerequisite & corequisite violations for selected courses
  for (const course of selectedCourses) {
    const reqConflicts = checkCoursePrerequisites(course, selections.selectedCourseIds);
    if (reqConflicts.length > 0) {
      conflictMap[course.id].push(...reqConflicts);
    }
  }

  // 2. Pairwise check between all selected courses
  for (let i = 0; i < selectedCourses.length; i++) {
    for (let j = i + 1; j < selectedCourses.length; j++) {
      const cA = selectedCourses[i];
      const cB = selectedCourses[j];

      const pairwise = checkTwoCoursesConflict(cA, cB, selections);
      if (pairwise.length > 0) {
        conflictMap[cA.id].push(...pairwise);
        // mirror conflicts for cB with adjusted wording if needed
        for (const p of pairwise) {
          conflictMap[cB.id].push({
            ...p,
            conflictingWithCourseId: cA.id,
            conflictingWithCourseName: cA.name,
          });
        }
      }
    }
  }

  return conflictMap;
}

/**
 * When hovering over ANY course (selected or not),
 * returns all conflicting course IDs and explanations relative to the currently selected courses.
 */
export function getHoverConflicts(
  hoveredCourseId: string,
  selections: StudentSelections
): {
  conflictingCourseIds: Set<string>;
  reasons: ConflictReason[];
} {
  const conflictingCourseIds = new Set<string>();
  const reasons: ConflictReason[] = [];

  const hoveredCourse = COURSES_DATA.find((c) => c.id === hoveredCourseId);
  if (!hoveredCourse) return { conflictingCourseIds, reasons };

  // Prereq/coreq of hovered course
  const reqConflicts = checkCoursePrerequisites(
    hoveredCourse,
    selections.selectedCourseIds
  );
  reasons.push(...reqConflicts);
  for (const r of reqConflicts) {
    if (r.conflictingWithCourseId) {
      conflictingCourseIds.add(r.conflictingWithCourseId);
    }
  }

  // Check against all selected courses
  for (const selectedId of selections.selectedCourseIds) {
    if (selectedId === hoveredCourseId) continue;
    const selectedCourse = COURSES_DATA.find((c) => c.id === selectedId);
    if (!selectedCourse) continue;

    const pairwise = checkTwoCoursesConflict(hoveredCourse, selectedCourse, selections);
    if (pairwise.length > 0) {
      conflictingCourseIds.add(selectedId);
      reasons.push(...pairwise);
    }
  }

  return { conflictingCourseIds, reasons };
}

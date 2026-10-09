import { Course, TimeSlot, ConflictReason, StudentSelections, ConflictStats } from '../types';
import { COURSES_DATA, EXTERNAL_PASSED_COURSES } from '../data/courses';

/**
 * Normalizes Persian/Arabic digits to English digits and trims whitespace.
 */
export function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

/**
 * Normalizes Jalali date string (e.g. "1405/8/30", "1405-08-30") into canonical "YYYY/MM/DD".
 */
export function normalizeJalaliDate(dateStr: string): string {
  if (!dateStr) return '';
  const clean = toEnglishDigits(dateStr.trim());
  const parts = clean.split(/[\/\-]/).map((p) => p.trim());
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${y}/${m}/${d}`;
  }
  return clean;
}

export interface ParsedExamTime {
  hasValidTime: boolean;
  hasEndTime: boolean;
  startMinutes?: number;
  endMinutes?: number;
  rawDisplay: string;
}

/**
 * Parses exam time information from an ExamDetail object.
 * Supports:
 * - startTime and endTime properties (e.g., startTime: "10:00", endTime: "12:00")
 * - range strings (e.g., "10:00-12:00", "10:00 - 12:00", "10:00 تا 12:00")
 * - single start time strings (e.g., "08:30")
 */
export function parseExamTime(exam: { time?: string; startTime?: string; endTime?: string }): ParsedExamTime {
  const rawDisplay = (exam.time || exam.startTime || '').trim();
  const startTimeStr = (exam.startTime || '').trim();
  const endTimeStr = (exam.endTime || '').trim();

  // If explicit startTime and endTime are provided
  if (startTimeStr && endTimeStr) {
    const start = timeToMinutes(startTimeStr);
    const end = timeToMinutes(endTimeStr);
    if (!isNaN(start) && !isNaN(end)) {
      return {
        hasValidTime: true,
        hasEndTime: true,
        startMinutes: start,
        endMinutes: end,
        rawDisplay: `${startTimeStr} تا ${endTimeStr}`,
      };
    }
  }

  if (!rawDisplay) {
    return {
      hasValidTime: false,
      hasEndTime: false,
      rawDisplay: 'نامشخص',
    };
  }

  const cleanTime = toEnglishDigits(rawDisplay);

  // Check if range with delimiter (- or تا or _ or ..)
  const rangeMatch = cleanTime.match(/^(\d{1,2}:\d{2})\s*(?:-|تا|_|\.\.)\s*(\d{1,2}:\d{2})$/);
  if (rangeMatch) {
    const start = timeToMinutes(rangeMatch[1]);
    const end = timeToMinutes(rangeMatch[2]);
    if (!isNaN(start) && !isNaN(end)) {
      return {
        hasValidTime: true,
        hasEndTime: true,
        startMinutes: start,
        endMinutes: end,
        rawDisplay: cleanTime,
      };
    }
  }

  // Check single time e.g. "08:30"
  const singleMatch = cleanTime.match(/^(\d{1,2}:\d{2})$/);
  if (singleMatch) {
    const start = timeToMinutes(singleMatch[1]);
    if (!isNaN(start)) {
      if (endTimeStr) {
        const end = timeToMinutes(endTimeStr);
        if (!isNaN(end)) {
          return {
            hasValidTime: true,
            hasEndTime: true,
            startMinutes: start,
            endMinutes: end,
            rawDisplay: `${cleanTime} تا ${endTimeStr}`,
          };
        }
      }

      return {
        hasValidTime: true,
        hasEndTime: false,
        startMinutes: start,
        rawDisplay: cleanTime,
      };
    }
  }

  return {
    hasValidTime: false,
    hasEndTime: false,
    rawDisplay,
  };
}

/**
 * Checks all exam conflicts between two courses in a unified framework (midterm and final exams).
 */
export function checkExamConflicts(courseA: Course, courseB: Course): ConflictReason[] {
  const reasons: ConflictReason[] = [];

  type ExamWithContext = {
    date: string;
    time?: string;
    startTime?: string;
    endTime?: string;
    category: 'final' | 'midterm';
    label: string;
  };

  const examsA: ExamWithContext[] = [];
  if (courseA.finalExam && courseA.finalExam.date) {
    examsA.push({ ...courseA.finalExam, category: 'final', label: 'پایان‌ترم' });
  }
  if (courseA.midtermExam && courseA.midtermExam.date) {
    examsA.push({ ...courseA.midtermExam, category: 'midterm', label: 'میان‌ترم/حذفی' });
  }

  const examsB: ExamWithContext[] = [];
  if (courseB.finalExam && courseB.finalExam.date) {
    examsB.push({ ...courseB.finalExam, category: 'final', label: 'پایان‌ترم' });
  }
  if (courseB.midtermExam && courseB.midtermExam.date) {
    examsB.push({ ...courseB.midtermExam, category: 'midterm', label: 'میان‌ترم/حذفی' });
  }

  for (const exA of examsA) {
    for (const exB of examsB) {
      const dateA = normalizeJalaliDate(exA.date);
      const dateB = normalizeJalaliDate(exB.date);

      // Different dates -> no conflict
      if (dateA !== dateB) {
        continue;
      }

      const timeA = parseExamTime(exA);
      const timeB = parseExamTime(exB);

      const titleType =
        exA.category === 'final' && exB.category === 'final'
          ? 'تداخل آزمون پایان‌ترم'
          : exA.category === 'midterm' && exB.category === 'midterm'
          ? 'تداخل آزمون میان‌ترم'
          : 'تداخل همزمان آزمون پایان‌ترم و میان‌ترم';

      const pairIds = [courseA.id, courseB.id].sort().join('|');
      const intervalKey = `${pairIds}::exam_date::${dateA}`;

      // Case 1: Either exam lacks a valid time format
      if (!timeA.hasValidTime || !timeB.hasValidTime) {
        reasons.push({
          type: 'exam_date',
          severity: 'warning',
          title: `اطلاعات ناکافی: احتمال ${titleType}`,
          description: `هر دو درس «${courseA.name}» (${exA.label}) و «${courseB.name}» (${exB.label}) در تاریخ ${dateA} امتحان دارند، اما به دلیل نامشخص بودن ساعت دقیق امتحان، امکان تعیین قطعی تداخل زمانی وجود ندارد.`,
          conflictingWithCourseId: courseB.id,
          conflictingWithCourseName: courseB.name,
          details: `تاریخ: ${dateA} | ساعت درس اول: ${timeA.rawDisplay} | ساعت درس دوم: ${timeB.rawDisplay}`,
          intervalKey,
        });
        continue;
      }

      // Case 2: Both have exact start and end times
      if (timeA.hasEndTime && timeB.hasEndTime) {
        const startA = timeA.startMinutes!;
        const endA = timeA.endMinutes!;
        const startB = timeB.startMinutes!;
        const endB = timeB.endMinutes!;

        // Overlap condition: startA < endB && endA > startB
        if (startA < endB && endA > startB) {
          reasons.push({
            type: 'exam_date',
            severity: 'error',
            title: `تداخل زمانی قطعی ${titleType}`,
            description: `تداخل ساعت ${timeA.rawDisplay} آزمون ${exA.label} درس «${courseA.name}» با ساعت ${timeB.rawDisplay} آزمون ${exB.label} درس «${courseB.name}» در تاریخ ${dateA}`,
            conflictingWithCourseId: courseB.id,
            conflictingWithCourseName: courseB.name,
            details: `تاریخ: ${dateA} | زمان: ${timeA.rawDisplay} همپوشان با ${timeB.rawDisplay}`,
            intervalKey,
          });
        }
        // If not overlapping (e.g. 10-12 and 12-14), no conflict!
        continue;
      }

      // Case 3: Both have the exact same start time (e.g. both start at 08:30 or 10:00)
      if (timeA.startMinutes === timeB.startMinutes) {
        reasons.push({
          type: 'exam_date',
          severity: 'error',
          title: `تداخل همزمان ${titleType}`,
          description: `هر دو آزمون ${exA.label} درس «${courseA.name}» و ${exB.label} درس «${courseB.name}» در تاریخ ${dateA} رأس ساعت ${timeA.rawDisplay} آغاز می‌شوند.`,
          conflictingWithCourseId: courseB.id,
          conflictingWithCourseName: courseB.name,
          details: `تاریخ: ${dateA} | ساعت شروع یکسان: ${timeA.rawDisplay}`,
          intervalKey,
        });
        continue;
      }

      // Case 4: Different start times, but missing end time for one or both
      reasons.push({
        type: 'exam_date',
        severity: 'warning',
        title: `اطلاعات ناکافی: احتمال ${titleType}`,
        description: `هر دو درس «${courseA.name}» (${exA.label}، ساعت ${timeA.rawDisplay}) و «${courseB.name}» (${exB.label}، ساعت ${timeB.rawDisplay}) در تاریخ ${dateA} امتحان دارند، اما به دلیل نامشخص بودن ساعت پایان امتحان، امکان تعیین قطعی تداخل زمانی وجود ندارد.`,
        conflictingWithCourseId: courseB.id,
        conflictingWithCourseName: courseB.name,
        details: `تاریخ: ${dateA} | ساعت‌ها: ${timeA.rawDisplay} و ${timeB.rawDisplay}`,
        intervalKey,
      });
    }
  }

  return reasons;
}

/**
 * Converts "HH:MM" string to minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return NaN;
  const clean = toEnglishDigits(timeStr.trim());
  const [hours, minutes] = clean.split(':').map(Number);
  if (isNaN(hours)) return NaN;
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

        const sortedIds = [courseA.id, courseB.id].sort().join('|');
        const intervalKey = `${sortedIds}::class_time::${slotA.day}`;

        reasons.push({
          type: 'class_time',
          severity: 'error',
          title: `تداخل زمانی قطعی کلاس در ${slotA.day}`,
          description: `تداخل ساعت ${slotA.startTime} تا ${slotA.endTime} درس «${courseA.name}» با ساعت ${slotB.startTime} تا ${slotB.endTime} درس «${courseB.name}»`,
          conflictingWithCourseId: courseB.id,
          conflictingWithCourseName: courseB.name,
          details: `${slotA.day}: ${slotA.startTime}-${slotA.endTime}`,
          intervalKey,
        });
      }
    }
  }

  // 2. Exam conflicts (Midterm and Final unified framework based on real time intervals)
  reasons.push(...checkExamConflicts(courseA, courseB));

  return reasons;
}

/**
 * Checks prerequisite and corequisite rules for a given course in context of current selections.
 */
export function checkCoursePrerequisites(
  course: Course,
  selectedCourseIds: string[],
  allCourses: Course[] = COURSES_DATA,
  externalPassedCourses: Set<string> | string[] = EXTERNAL_PASSED_COURSES
): ConflictReason[] {
  const reasons: ConflictReason[] = [];
  const passedSet =
    externalPassedCourses instanceof Set
      ? externalPassedCourses
      : new Set(externalPassedCourses || []);

  // Rule from prompt: "تمام دروس ارایه شده در فایل گزارش مارکدون، پاس نشده‌اند و سایرین پاس شده‌اند که نیامده."
  // If prerequisite code is in the report/dataset, it is NOT passed!
  for (const prereqCode of course.prerequisites) {
    // Is it in the dataset?
    const reportCourse = allCourses.find((c) => c.code === prereqCode);
    if (reportCourse) {
      // It exists in the dataset, meaning the student hasn't passed it!
      reasons.push({
        type: 'prerequisite',
        title: 'عدم رعایت پیش‌نیاز الزامی',
        description: `درس «${course.name}» نیاز به پیش‌نیاز «${reportCourse.name}» (${prereqCode}) دارد که هنوز پاس نشده است.`,
        conflictingWithCourseId: reportCourse.id,
        conflictingWithCourseName: reportCourse.name,
        details: `کد پیش‌نیاز: ${prereqCode}`,
      });
    } else if (!passedSet.has(prereqCode)) {
      // Unknown prerequisite not in external passed courses
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
      const coreqCourse = allCourses.find((c) => c.code === coreqCode);
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
  selections: StudentSelections,
  allCourses: Course[] = COURSES_DATA,
  externalPassedCourses: Set<string> | string[] = EXTERNAL_PASSED_COURSES
): Record<string, ConflictReason[]> {
  const conflictMap: Record<string, ConflictReason[]> = {};
  const selectedCourses = allCourses.filter((c) =>
    selections.selectedCourseIds.includes(c.id)
  );

  // Initialize empty arrays
  for (const c of allCourses) {
    conflictMap[c.id] = [];
  }

  // 1. Check prerequisite & corequisite violations for selected courses
  for (const course of selectedCourses) {
    const reqConflicts = checkCoursePrerequisites(
      course,
      selections.selectedCourseIds,
      allCourses,
      externalPassedCourses
    );
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
 * Calculates distinct conflict statistics without duplicate counting:
 * 1. uniquePairCount: تعداد جفت‌درس‌های یکتای دارای تداخل (تداخل A با B و B با A یک بار شمرده می‌شود)
 * 2. overlappingTimeSlotCount: تعداد بازه‌های زمانی متداخل (شامل جلسات هم‌پوشان هفتگی یا امتحانات)
 * 3. affectedCourseCount: تعداد درس‌هایی که دست‌کم یک تداخل دارند
 * 4. totalReasonCount: تعداد کل دلایل و علل تداخل ثبت‌شده
 */
export function calculateConflictStats(
  selectedCourseIds: string[],
  conflictMap: Record<string, ConflictReason[]>
): ConflictStats {
  const uniquePairs = new Set<string>();
  const affectedCourses = new Set<string>();
  let totalReasonCount = 0;
  let overlappingTimeSlotCount = 0;

  for (const courseId of selectedCourseIds) {
    const reasons = conflictMap[courseId] || [];
    if (reasons.length > 0) {
      affectedCourses.add(courseId);
    }
    totalReasonCount += reasons.length;

    for (const r of reasons) {
      if (r.conflictingWithCourseId) {
        // Build stable unordered pair key e.g. "c1|c2" using course IDs
        const pairKey = [courseId, r.conflictingWithCourseId].sort().join('|');
        uniquePairs.add(pairKey);
      }
    }
  }

  // Count distinct time slot / exam overlapping intervals to avoid double counting symmetric entries
  const uniqueTimeSlotConflicts = new Set<string>();
  for (const courseId of selectedCourseIds) {
    const reasons = conflictMap[courseId] || [];
    for (const r of reasons) {
      if (r.type === 'class_time' || r.type === 'exam_date') {
        if (r.intervalKey) {
          uniqueTimeSlotConflicts.add(r.intervalKey);
        } else {
          const otherId = r.conflictingWithCourseId || 'unknown';
          const pairKey = [courseId, otherId].sort().join('|');
          // Fallback to type and normalized details
          const slotKey = `${pairKey}::${r.type}::${(r.details || r.title || '').trim()}`;
          uniqueTimeSlotConflicts.add(slotKey);
        }
      }
    }
  }
  overlappingTimeSlotCount = uniqueTimeSlotConflicts.size;

  return {
    uniquePairCount: uniquePairs.size,
    overlappingTimeSlotCount,
    affectedCourseCount: affectedCourses.size,
    totalReasonCount,
  };
}

/**
 * When hovering over ANY course (selected or not),
 * returns all conflicting course IDs and explanations relative to the currently selected courses.
 */
export function getHoverConflicts(
  hoveredCourseId: string,
  selections: StudentSelections,
  allCourses: Course[] = COURSES_DATA,
  externalPassedCourses: Set<string> | string[] = EXTERNAL_PASSED_COURSES
): {
  conflictingCourseIds: Set<string>;
  reasons: ConflictReason[];
} {
  const conflictingCourseIds = new Set<string>();
  const reasons: ConflictReason[] = [];

  const hoveredCourse = allCourses.find((c) => c.id === hoveredCourseId);
  if (!hoveredCourse) return { conflictingCourseIds, reasons };

  // Prereq/coreq of hovered course
  const reqConflicts = checkCoursePrerequisites(
    hoveredCourse,
    selections.selectedCourseIds,
    allCourses,
    externalPassedCourses
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
    const selectedCourse = allCourses.find((c) => c.id === selectedId);
    if (!selectedCourse) continue;

    const pairwise = checkTwoCoursesConflict(hoveredCourse, selectedCourse, selections);
    if (pairwise.length > 0) {
      conflictingCourseIds.add(selectedId);
      reasons.push(...pairwise);
    }
  }

  return { conflictingCourseIds, reasons };
}

/**
 * Calculates instant conflict status for ALL unselected courses against currently selected courses.
 * This eliminates the need for long-press or hovering on mobile devices.
 */
export function getInstantUnselectedConflicts(
  selections: StudentSelections,
  allCourses: Course[] = COURSES_DATA,
  externalPassedCourses: Set<string> | string[] = EXTERNAL_PASSED_COURSES
): Record<string, ConflictReason[]> {
  const map: Record<string, ConflictReason[]> = {};

  for (const course of allCourses) {
    // If already selected, it is handled by evaluateAllConflicts
    if (selections.selectedCourseIds.includes(course.id)) {
      continue;
    }

    const reasons: ConflictReason[] = [];

    // 1. Prerequisite / Corequisite violations
    const reqConflicts = checkCoursePrerequisites(
      course,
      selections.selectedCourseIds,
      allCourses,
      externalPassedCourses
    );
    reasons.push(...reqConflicts);

    // 2. Check pairwise against each currently selected course
    for (const selectedId of selections.selectedCourseIds) {
      const selectedCourse = allCourses.find((c) => c.id === selectedId);
      if (!selectedCourse) continue;

      const pairwise = checkTwoCoursesConflict(course, selectedCourse, selections);
      if (pairwise.length > 0) {
        reasons.push(...pairwise);
      }
    }

    map[course.id] = reasons;
  }

  return map;
}

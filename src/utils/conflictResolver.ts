import { Course, TimeSlot, ConflictReason, StudentSelections } from '../types';
import {
  evaluateAllConflicts,
  calculateConflictStats,
  checkCoursePrerequisites,
  parseExamTime,
} from './conflictDetector';
import { COURSES_DATA, EXTERNAL_PASSED_COURSES } from '../data/courses';

export interface GroupAlternativeSuggestion {
  id: string;
  courseId: string;
  courseName: string;
  currentGroupId?: string;
  currentGroupName?: string;
  suggestedGroupId: string;
  suggestedGroupName: string;
  suggestedGroupSlots: TimeSlot[];
  
  // Conflicting counterpart info
  counterpartCourseId: string;
  counterpartCourseName: string;
  originalConflictType: 'class_time' | 'exam_date' | 'prerequisite' | 'corequisite';
  originalConflictDescription: string;
  
  // Secondary change if 2-group coordination is needed
  secondaryChange?: {
    courseId: string;
    courseName: string;
    currentGroupId?: string;
    currentGroupName?: string;
    suggestedGroupId: string;
    suggestedGroupName: string;
    suggestedGroupSlots: TimeSlot[];
  };
  
  // Impact metrics
  changeCount: number; // 1 or 2
  initialConflictCount: number;
  remainingConflictCount: number;
  resolvedConflictCount: number;
  isCompleteResolution: boolean;
  
  // Verification flags
  hasExamConflict: boolean;
  hasPrerequisiteViolation: boolean;
  isWithinUnitLimits: boolean;
  totalUnits: number;
  
  // Information completeness warnings (Requirement 4)
  missingInfoWarnings: string[];
  
  // Persian description
  explanation: string;
}

export interface UnresolvableCourseConflict {
  courseId: string;
  courseName: string;
  conflictingWithCourseId?: string;
  conflictingWithCourseName?: string;
  conflictType: 'class_time' | 'exam_date' | 'prerequisite' | 'corequisite';
  title: string;
  description: string;
  reasonCategory:
    | 'theory_fixed_schedule'
    | 'all_practical_groups_conflict'
    | 'no_practical_groups'
    | 'identical_exam_date'
    | 'prerequisite_unfulfilled';
  explanation: string;
}

export interface ConflictResolutionReport {
  suggestions: GroupAlternativeSuggestion[];
  unresolvable: UnresolvableCourseConflict[];
  totalSuggestionsCount: number;
  resolvableCount: number;
  unresolvableCount: number;
}

/**
 * Formats a Persian summary of slots for display in recommendations.
 */
export function formatSlotsSummary(slots: TimeSlot[]): string {
  if (!slots || slots.length === 0) return 'زمان مشخص نیست';
  return slots.map((s) => `${s.day} ${s.startTime} تا ${s.endTime}`).join('، ');
}

/**
 * Checks for missing or ambiguous exam schedule information for involved courses.
 */
function detectMissingExamInformation(courses: Course[]): string[] {
  const warnings: string[] = [];
  for (const c of courses) {
    if (c.finalExam) {
      const parsed = parseExamTime(c.finalExam);
      if (!parsed.hasValidTime) {
        warnings.push(`ساعت امتحان پایان‌ترم درس «${c.name}» در سامانه مشخص نشده است.`);
      }
    }
    if (c.midtermExam) {
      const parsed = parseExamTime(c.midtermExam);
      if (!parsed.hasValidTime) {
        warnings.push(`ساعت امتحان میان‌ترم درس «${c.name}» در سامانه مشخص نشده است.`);
      }
    }
  }
  return Array.from(new Set(warnings));
}

/**
 * Generates ranked, validated group alternative suggestions to resolve course conflicts.
 * Pure evaluation function. Does not mutate inputs or global state.
 */
export function generateGroupAlternativeSuggestions(
  selections: StudentSelections,
  allCourses: Course[] = COURSES_DATA,
  externalPassedCourses: Set<string> | string[] = EXTERNAL_PASSED_COURSES
): ConflictResolutionReport {
  const selectedCourses = allCourses.filter((c) =>
    selections.selectedCourseIds.includes(c.id)
  );

  const initialConflictMap = evaluateAllConflicts(
    selections,
    allCourses,
    externalPassedCourses
  );
  const initialStats = calculateConflictStats(
    selections.selectedCourseIds,
    initialConflictMap
  );

  // If there are no conflicts at all, return empty report
  if (initialStats.totalReasonCount === 0) {
    return {
      suggestions: [],
      unresolvable: [],
      totalSuggestionsCount: 0,
      resolvableCount: 0,
      unresolvableCount: 0,
    };
  }

  const initialTotalUnits = Number(
    selectedCourses.reduce((sum, c) => sum + c.units.total, 0).toFixed(2)
  );

  const rawSuggestions: GroupAlternativeSuggestion[] = [];
  const processedPairKeys = new Set<string>();
  const unresolvableList: UnresolvableCourseConflict[] = [];

  // Examine each selected course with conflicts
  for (const courseId of selections.selectedCourseIds) {
    const reasons = initialConflictMap[courseId] || [];
    if (reasons.length === 0) continue;

    const courseA = allCourses.find((c) => c.id === courseId);
    if (!courseA) continue;

    for (const reason of reasons) {
      const counterpartId = reason.conflictingWithCourseId;
      const courseB = counterpartId
        ? allCourses.find((c) => c.id === counterpartId)
        : undefined;

      // Unique identifier for this conflicting pair and reason type
      const conflictPairKey = counterpartId
        ? [courseA.id, counterpartId].sort().join('|') + `::${reason.type}`
        : `${courseA.id}::${reason.type}::prereq`;

      // Non-class_time conflicts (exam or prerequisite) cannot be resolved by changing practical class groups
      if (reason.type !== 'class_time') {
        if (!processedPairKeys.has(conflictPairKey)) {
          processedPairKeys.add(conflictPairKey);
          if (reason.type === 'exam_date') {
            unresolvableList.push({
              courseId: courseA.id,
              courseName: courseA.name,
              conflictingWithCourseId: courseB?.id,
              conflictingWithCourseName: courseB?.name,
              conflictType: 'exam_date',
              title: reason.title,
              description: reason.description,
              reasonCategory: 'identical_exam_date',
              explanation:
                'این تداخل ناشی از همزمانی تاریخ آزمون پایان‌ترم/میان‌ترم است. از آن‌جا که تاریخ امتحان برای تمام گروه‌های یک درس یکسان است، با تغییر گروه کلاسی قابل رفع نیست و نیاز به حذف یا جایگزینی یکی از دو درس دارد.',
            });
          } else {
            unresolvableList.push({
              courseId: courseA.id,
              courseName: courseA.name,
              conflictingWithCourseId: courseB?.id,
              conflictingWithCourseName: courseB?.name,
              conflictType: reason.type,
              title: reason.title,
              description: reason.description,
              reasonCategory: 'prerequisite_unfulfilled',
              explanation:
                'این تداخل مربوط به عدم رعایت پیش‌نیاز یا هم‌نیاز دانشگاهی است و با تغییر گروه کلاسی برطرف نمی‌شود.',
            });
          }
        }
        continue;
      }

      if (!courseB) continue;

      let foundResolutionForThisPair = false;

      // -------------------------------------------------------------
      // Strategy 1: Check alternative practical groups of courseA
      // -------------------------------------------------------------
      const currentGroupAId = selections.selectedPracticalGroups[courseA.id];
      const currentGroupAObj = courseA.practicalGroups?.find(
        (g) => g.id === currentGroupAId
      );

      if (courseA.practicalGroups && courseA.practicalGroups.length > 0) {
        for (const altGroupA of courseA.practicalGroups) {
          if (altGroupA.id === currentGroupAId) continue;

          // Simulate selection with altGroupA
          const testSelections: StudentSelections = {
            ...selections,
            selectedPracticalGroups: {
              ...selections.selectedPracticalGroups,
              [courseA.id]: altGroupA.id,
            },
          };

          const testConflictMap = evaluateAllConflicts(
            testSelections,
            allCourses,
            externalPassedCourses
          );
          const testStats = calculateConflictStats(
            testSelections.selectedCourseIds,
            testConflictMap
          );

          // Check if conflict with courseB is eliminated
          const conflictsWithB = (testConflictMap[courseA.id] || []).filter(
            (cr) => cr.conflictingWithCourseId === courseB.id && cr.type === 'class_time'
          );

          // Did it solve this specific conflict without worsening overall schedule?
          if (
            conflictsWithB.length === 0 &&
            testStats.uniquePairCount < initialStats.uniquePairCount
          ) {
            foundResolutionForThisPair = true;

            const missingInfoWarnings = detectMissingExamInformation([
              courseA,
              courseB,
            ]);

            const hasExamConflict = (testConflictMap[courseA.id] || []).some(
              (cr) => cr.type === 'exam_date'
            );
            const hasPrereqViolation = (testConflictMap[courseA.id] || []).some(
              (cr) => cr.type === 'prerequisite' || cr.type === 'corequisite'
            );
            const isWithinUnitLimits =
              initialTotalUnits >= selections.minUnits &&
              initialTotalUnits <= selections.maxUnits;

            const resolvedPairs = initialStats.uniquePairCount - testStats.uniquePairCount;

            rawSuggestions.push({
              id: `sug_${courseA.id}_to_${altGroupA.id}_vs_${courseB.id}`,
              courseId: courseA.id,
              courseName: courseA.name,
              currentGroupId: currentGroupAId,
              currentGroupName: currentGroupAObj?.name || 'شناور/تعیین‌نشده',
              suggestedGroupId: altGroupA.id,
              suggestedGroupName: altGroupA.name,
              suggestedGroupSlots: altGroupA.slots,
              counterpartCourseId: courseB.id,
              counterpartCourseName: courseB.name,
              originalConflictType: 'class_time',
              originalConflictDescription: reason.description,
              changeCount: 1,
              initialConflictCount: initialStats.uniquePairCount,
              remainingConflictCount: testStats.uniquePairCount,
              resolvedConflictCount: resolvedPairs,
              isCompleteResolution: testStats.uniquePairCount === 0,
              hasExamConflict,
              hasPrerequisiteViolation: hasPrereqViolation,
              isWithinUnitLimits,
              totalUnits: initialTotalUnits,
              missingInfoWarnings,
              explanation: `تغییر گروه درس «${courseA.name}» به گروه «${altGroupA.name}» تداخل زمانی با درس «${courseB.name}» را کاملاً رفع می‌کند.`,
            });
          }
        }
      }

      // -------------------------------------------------------------
      // Strategy 2: Check alternative practical groups of courseB
      // -------------------------------------------------------------
      const currentGroupBId = selections.selectedPracticalGroups[courseB.id];
      const currentGroupBObj = courseB.practicalGroups?.find(
        (g) => g.id === currentGroupBId
      );

      if (courseB.practicalGroups && courseB.practicalGroups.length > 0) {
        for (const altGroupB of courseB.practicalGroups) {
          if (altGroupB.id === currentGroupBId) continue;

          const testSelections: StudentSelections = {
            ...selections,
            selectedPracticalGroups: {
              ...selections.selectedPracticalGroups,
              [courseB.id]: altGroupB.id,
            },
          };

          const testConflictMap = evaluateAllConflicts(
            testSelections,
            allCourses,
            externalPassedCourses
          );
          const testStats = calculateConflictStats(
            testSelections.selectedCourseIds,
            testConflictMap
          );

          const conflictsWithA = (testConflictMap[courseB.id] || []).filter(
            (cr) => cr.conflictingWithCourseId === courseA.id && cr.type === 'class_time'
          );

          if (
            conflictsWithA.length === 0 &&
            testStats.uniquePairCount < initialStats.uniquePairCount
          ) {
            foundResolutionForThisPair = true;

            const missingInfoWarnings = detectMissingExamInformation([
              courseA,
              courseB,
            ]);

            const hasExamConflict = (testConflictMap[courseB.id] || []).some(
              (cr) => cr.type === 'exam_date'
            );
            const hasPrereqViolation = (testConflictMap[courseB.id] || []).some(
              (cr) => cr.type === 'prerequisite' || cr.type === 'corequisite'
            );
            const isWithinUnitLimits =
              initialTotalUnits >= selections.minUnits &&
              initialTotalUnits <= selections.maxUnits;

            const resolvedPairs = initialStats.uniquePairCount - testStats.uniquePairCount;

            rawSuggestions.push({
              id: `sug_${courseB.id}_to_${altGroupB.id}_vs_${courseA.id}`,
              courseId: courseB.id,
              courseName: courseB.name,
              currentGroupId: currentGroupBId,
              currentGroupName: currentGroupBObj?.name || 'شناور/تعیین‌نشده',
              suggestedGroupId: altGroupB.id,
              suggestedGroupName: altGroupB.name,
              suggestedGroupSlots: altGroupB.slots,
              counterpartCourseId: courseA.id,
              counterpartCourseName: courseA.name,
              originalConflictType: 'class_time',
              originalConflictDescription: reason.description,
              changeCount: 1,
              initialConflictCount: initialStats.uniquePairCount,
              remainingConflictCount: testStats.uniquePairCount,
              resolvedConflictCount: resolvedPairs,
              isCompleteResolution: testStats.uniquePairCount === 0,
              hasExamConflict,
              hasPrerequisiteViolation: hasPrereqViolation,
              isWithinUnitLimits,
              totalUnits: initialTotalUnits,
              missingInfoWarnings,
              explanation: `تغییر گروه درس «${courseB.name}» به گروه «${altGroupB.name}» تداخل زمانی با درس «${courseA.name}» را کاملاً رفع می‌کند.`,
            });
          }
        }
      }

      // -------------------------------------------------------------
      // Strategy 3: Check dual group changes if both have practical groups
      // -------------------------------------------------------------
      if (
        !foundResolutionForThisPair &&
        courseA.practicalGroups &&
        courseA.practicalGroups.length > 0 &&
        courseB.practicalGroups &&
        courseB.practicalGroups.length > 0
      ) {
        for (const altGroupA of courseA.practicalGroups) {
          if (altGroupA.id === currentGroupAId) continue;
          for (const altGroupB of courseB.practicalGroups) {
            if (altGroupB.id === currentGroupBId) continue;

            const testSelections: StudentSelections = {
              ...selections,
              selectedPracticalGroups: {
                ...selections.selectedPracticalGroups,
                [courseA.id]: altGroupA.id,
                [courseB.id]: altGroupB.id,
              },
            };

            const testConflictMap = evaluateAllConflicts(
              testSelections,
              allCourses,
              externalPassedCourses
            );
            const testStats = calculateConflictStats(
              testSelections.selectedCourseIds,
              testConflictMap
            );

            const conflictsWithB = (testConflictMap[courseA.id] || []).filter(
              (cr) => cr.conflictingWithCourseId === courseB.id && cr.type === 'class_time'
            );

            if (
              conflictsWithB.length === 0 &&
              testStats.uniquePairCount < initialStats.uniquePairCount
            ) {
              foundResolutionForThisPair = true;

              const missingInfoWarnings = detectMissingExamInformation([
                courseA,
                courseB,
              ]);

              const hasExamConflict =
                (testConflictMap[courseA.id] || []).some(
                  (cr) => cr.type === 'exam_date'
                ) ||
                (testConflictMap[courseB.id] || []).some(
                  (cr) => cr.type === 'exam_date'
                );

              const hasPrereqViolation =
                (testConflictMap[courseA.id] || []).some(
                  (cr) => cr.type === 'prerequisite' || cr.type === 'corequisite'
                ) ||
                (testConflictMap[courseB.id] || []).some(
                  (cr) => cr.type === 'prerequisite' || cr.type === 'corequisite'
                );

              const resolvedPairs = initialStats.uniquePairCount - testStats.uniquePairCount;

              rawSuggestions.push({
                id: `sug_dual_${courseA.id}_${altGroupA.id}_and_${courseB.id}_${altGroupB.id}`,
                courseId: courseA.id,
                courseName: courseA.name,
                currentGroupId: currentGroupAId,
                currentGroupName: currentGroupAObj?.name || 'شناور/تعیین‌نشده',
                suggestedGroupId: altGroupA.id,
                suggestedGroupName: altGroupA.name,
                suggestedGroupSlots: altGroupA.slots,
                counterpartCourseId: courseB.id,
                counterpartCourseName: courseB.name,
                originalConflictType: 'class_time',
                originalConflictDescription: reason.description,
                secondaryChange: {
                  courseId: courseB.id,
                  courseName: courseB.name,
                  currentGroupId: currentGroupBId,
                  currentGroupName: currentGroupBObj?.name || 'شناور/تعیین‌نشده',
                  suggestedGroupId: altGroupB.id,
                  suggestedGroupName: altGroupB.name,
                  suggestedGroupSlots: altGroupB.slots,
                },
                changeCount: 2,
                initialConflictCount: initialStats.uniquePairCount,
                remainingConflictCount: testStats.uniquePairCount,
                resolvedConflictCount: resolvedPairs,
                isCompleteResolution: testStats.uniquePairCount === 0,
                hasExamConflict,
                hasPrerequisiteViolation: hasPrereqViolation,
                isWithinUnitLimits:
                  initialTotalUnits >= selections.minUnits &&
                  initialTotalUnits <= selections.maxUnits,
                totalUnits: initialTotalUnits,
                missingInfoWarnings,
                explanation: `تعویض هماهنگ دو گروه: گروه درس «${courseA.name}» به «${altGroupA.name}» و درس «${courseB.name}» به «${altGroupB.name}» تداخل زمانی را رفع می‌کند.`,
              });
            }
          }
        }
      }

      // If no valid suggestion could resolve this pair, record the clear unresolvable reason
      if (!foundResolutionForThisPair && !processedPairKeys.has(conflictPairKey)) {
        processedPairKeys.add(conflictPairKey);

        const hasPracticalA =
          courseA.practicalGroups && courseA.practicalGroups.length > 0;
        const hasPracticalB =
          courseB.practicalGroups && courseB.practicalGroups.length > 0;

        if (!hasPracticalA && !hasPracticalB) {
          unresolvableList.push({
            courseId: courseA.id,
            courseName: courseA.name,
            conflictingWithCourseId: courseB.id,
            conflictingWithCourseName: courseB.name,
            conflictType: 'class_time',
            title: reason.title,
            description: reason.description,
            reasonCategory: 'theory_fixed_schedule',
            explanation: `تداخل زمانی بین جلسات ثابت نظری درس‌های «${courseA.name}» و «${courseB.name}» رخ داده است. هیچ‌یک از این دو درس دارای گروه کلاسی یا عملی جایگزین در این ترم نیستند و تداخل با تغییر گروه قابل رفع نیست.`,
          });
        } else {
          unresolvableList.push({
            courseId: courseA.id,
            courseName: courseA.name,
            conflictingWithCourseId: courseB.id,
            conflictingWithCourseName: courseB.name,
            conflictType: 'class_time',
            title: reason.title,
            description: reason.description,
            reasonCategory: 'all_practical_groups_conflict',
            explanation: `تمامی گروه‌های عملی جایگزین ارائه‌شده برای درس‌های «${courseA.name}» یا «${courseB.name}» نیز با سایر ساعات انتخابی شما هم‌پوشانی دارند و هیچ ترکیب استانداردی بدون تداخل یافت نشد.`,
          });
        }
      }
    }
  }

  // Deduplicate suggestions by their target state signature
  const dedupMap = new Map<string, GroupAlternativeSuggestion>();
  for (const sug of rawSuggestions) {
    const key = sug.secondaryChange
      ? `${sug.courseId}:${sug.suggestedGroupId}__${sug.secondaryChange.courseId}:${sug.secondaryChange.suggestedGroupId}`
      : `${sug.courseId}:${sug.suggestedGroupId}`;

    const existing = dedupMap.get(key);
    if (!existing) {
      dedupMap.set(key, sug);
    } else {
      // Keep the one with fewer remaining conflicts or higher resolved conflicts
      if (
        sug.remainingConflictCount < existing.remainingConflictCount ||
        (sug.remainingConflictCount === existing.remainingConflictCount &&
          sug.resolvedConflictCount > existing.resolvedConflictCount)
      ) {
        dedupMap.set(key, sug);
      }
    }
  }

  // Ranking Criteria (Requirement 3):
  // 1. Minimum remaining conflicts overall (0 remaining first)
  // 2. Maximum resolved conflicts
  // 3. Minimum changes in user's current selection (1 change before 2 changes)
  // 4. Minimum missing-information warnings
  const rankedSuggestions = Array.from(dedupMap.values()).sort((a, b) => {
    // 1. Remaining conflicts
    if (a.remainingConflictCount !== b.remainingConflictCount) {
      return a.remainingConflictCount - b.remainingConflictCount;
    }
    // 2. Resolved conflicts count (descending)
    if (a.resolvedConflictCount !== b.resolvedConflictCount) {
      return b.resolvedConflictCount - a.resolvedConflictCount;
    }
    // 3. Number of modified groups (ascending)
    if (a.changeCount !== b.changeCount) {
      return a.changeCount - b.changeCount;
    }
    // 4. Fewest missing info warnings
    return a.missingInfoWarnings.length - b.missingInfoWarnings.length;
  });

  return {
    suggestions: rankedSuggestions,
    unresolvable: unresolvableList,
    totalSuggestionsCount: rankedSuggestions.length,
    resolvableCount: rankedSuggestions.length > 0 ? 1 : 0,
    unresolvableCount: unresolvableList.length,
  };
}

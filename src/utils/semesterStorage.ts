/**
 * Utility functions for managing the student's finalized semester weekly schedule.
 * Used by the Android App Shortcut ('برنامه هفتگی') to immediately restore the user's
 * semester-long course selections.
 */

export const SEMESTER_SCHEDULE_STORAGE_KEY = 'medical_semester_saved_schedule_v1';

export interface SavedSemesterSchedule {
  courseIds: string[];
  practicalGroups: Record<string, string>;
  gender: 'male' | 'female';
  savedAt: string;
  timestamp: number;
  courseCount: number;
  totalUnits: number;
}

/**
 * Formats current date and time to Persian locale string (e.g. ۱۴۰۳/۰۶/۲۵ - ۱۲:۳۰)
 */
export function formatPersianDateTime(date: Date = new Date()): string {
  try {
    const formattedDate = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);

    const formattedTime = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);

    return `${formattedDate} ساعت ${formattedTime}`;
  } catch {
    return new Date().toLocaleDateString('fa-IR');
  }
}

/**
 * Retrieves the saved semester schedule from local storage.
 */
export function getSavedSemesterSchedule(): SavedSemesterSchedule | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(SEMESTER_SCHEDULE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.courseIds)) {
      return parsed as SavedSemesterSchedule;
    }
  } catch (err) {
    console.warn('Failed to read saved semester schedule:', err);
  }
  return null;
}

/**
 * Saves or updates the semester schedule in local storage.
 */
export function saveSemesterSchedule(
  courseIds: string[],
  practicalGroups: Record<string, string>,
  gender: 'male' | 'female',
  totalUnits: number
): SavedSemesterSchedule {
  const schedule: SavedSemesterSchedule = {
    courseIds,
    practicalGroups,
    gender,
    savedAt: formatPersianDateTime(new Date()),
    timestamp: Date.now(),
    courseCount: courseIds.length,
    totalUnits,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SEMESTER_SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
    } catch (err) {
      console.warn('Failed to save semester schedule to localStorage:', err);
    }
  }

  return schedule;
}

/**
 * Clears the saved semester schedule.
 */
export function clearSavedSemesterSchedule(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(SEMESTER_SCHEDULE_STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear semester schedule:', err);
    }
  }
}

/**
 * Compares current active selections with the saved semester schedule.
 */
export function isScheduleMatching(
  currentCourseIds: string[],
  currentPracticalGroups: Record<string, string>,
  currentGender: 'male' | 'female',
  saved: SavedSemesterSchedule | null
): boolean {
  if (!saved) return false;
  if (saved.gender !== currentGender) return false;
  if (saved.courseIds.length !== currentCourseIds.length) return false;

  const currentSet = new Set(currentCourseIds);
  for (const id of saved.courseIds) {
    if (!currentSet.has(id)) return false;
  }

  for (const cId of saved.courseIds) {
    const savedGroup = saved.practicalGroups[cId] || '';
    const currentGroup = currentPracticalGroups[cId] || '';
    if (savedGroup !== currentGroup) return false;
  }

  return true;
}

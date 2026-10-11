import { Course, DayOfWeek, TimeSlot } from '../types';
import { timeToMinutes } from './conflictDetector';

export const PERSIAN_WEEKDAYS: { day: DayOfWeek | 'جمعه'; index: number; en: string }[] = [
  { day: 'شنبه', index: 0, en: 'Sat' },
  { day: 'یکشنبه', index: 1, en: 'Sun' },
  { day: 'دوشنبه', index: 2, en: 'Mon' },
  { day: 'سه‌شنبه', index: 3, en: 'Tue' },
  { day: 'چهارشنبه', index: 4, en: 'Wed' },
  { day: 'پنج‌شنبه', index: 5, en: 'Thu' },
  { day: 'جمعه', index: 6, en: 'Fri' },
];

export interface IranTimeInfo {
  dayName: DayOfWeek | 'جمعه';
  dayIndex: number; // 0=Sat, 1=Sun, ..., 5=Thu, 6=Fri
  hours: number;
  minutes: number;
  totalMinutes: number;
  timeString: string;
}

/**
 * Returns the current date and time in Iran timezone (Asia/Tehran).
 */
export function getIranCurrentTime(date: Date = new Date()): IranTimeInfo {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      hour12: false,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const parts = formatter.formatToParts(date);
    const weekdayPart = parts.find((p) => p.type === 'weekday')?.value || '';
    const hourPart = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minutePart = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

    const match = PERSIAN_WEEKDAYS.find((d) => d.en.toLowerCase() === weekdayPart.slice(0, 3).toLowerCase()) || PERSIAN_WEEKDAYS[0];

    const hours = hourPart % 24;
    const minutes = minutePart % 60;
    const totalMinutes = hours * 60 + minutes;
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    return {
      dayName: match.day,
      dayIndex: match.index,
      hours,
      minutes,
      totalMinutes,
      timeString,
    };
  } catch {
    // Fallback if Intl timeZone fails
    const day = date.getDay(); // 0 is Sun, 6 is Sat
    const map: Record<number, { day: DayOfWeek | 'جمعه'; index: number }> = {
      6: { day: 'شنبه', index: 0 },
      0: { day: 'یکشنبه', index: 1 },
      1: { day: 'دوشنبه', index: 2 },
      2: { day: 'سه‌شنبه', index: 3 },
      3: { day: 'چهارشنبه', index: 4 },
      4: { day: 'پنج‌شنبه', index: 5 },
      5: { day: 'جمعه', index: 6 },
    };
    const info = map[day] || { day: 'شنبه', index: 0 };
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return {
      dayName: info.day,
      dayIndex: info.index,
      hours,
      minutes,
      totalMinutes: hours * 60 + minutes,
      timeString: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    };
  }
}

export interface UpcomingClassResult {
  type: 'ongoing' | 'upcoming_today' | 'upcoming_future';
  course: Course;
  slot: TimeSlot;
  dayName: DayOfWeek;
  relativeTimeText: string;
  badgeText: string;
  daysAhead: number;
}

/**
 * Computes the effective cutoff time in minutes for a class slot.
 * For classes with standard 2-hour duration (between 90 and 120 minutes),
 * the effective cutoff is 90 minutes (1:30h) after start time.
 * For example:
 * - 08:00 - 10:00: shown as ongoing until 09:30. At 09:30, it frees up to show the 10:00 class next.
 * For shorter classes (<90 min), the normal end time is respected.
 */
export function getEffectiveSlotCutoffMinutes(startTime: string, endTime: string): number {
  const startM = timeToMinutes(startTime);
  const endM = timeToMinutes(endTime);
  const duration = endM - startM;

  if (duration >= 90) {
    // 90 minutes (1:30 hour) from start
    return startM + 90;
  }
  return endM;
}

/**
 * Finds the earliest upcoming or ongoing class based on Iran time.
 * - Only includes definite slots (ignores unselected tentative practical groups).
 * - Treats 2-hour classes as effective 1:30 hours so back-to-back classes show the next class early.
 */
export function findUpcomingClass(
  activeSlots: { course: Course; slot: TimeSlot }[],
  currentIranTime: IranTimeInfo = getIranCurrentTime()
): UpcomingClassResult | null {
  if (!activeSlots || activeSlots.length === 0) return null;

  // Filter out unselected / floating practical slots (isTentative)
  const definiteSlots = activeSlots.filter(({ slot }) => !slot.isTentative);
  if (definiteSlots.length === 0) return null;

  const nowMinutes = currentIranTime.totalMinutes;
  const todayIndex = currentIranTime.dayIndex;

  // Map slot days to dayIndex
  const dayIndexMap: Record<DayOfWeek, number> = {
    'شنبه': 0,
    'یکشنبه': 1,
    'دوشنبه': 2,
    'سه‌شنبه': 3,
    'چهارشنبه': 4,
    'پنج‌شنبه': 5,
  };

  // 1. Check if there's an ongoing class right now
  // A class is ongoing if nowMinutes >= startM and nowMinutes < effectiveCutoffM (e.g. 08:00 to 09:30 for 08:00-10:00)
  const ongoing = definiteSlots.find(({ slot }) => {
    if (dayIndexMap[slot.day] !== todayIndex) return false;
    const startM = timeToMinutes(slot.startTime);
    const effectiveCutoffM = getEffectiveSlotCutoffMinutes(slot.startTime, slot.endTime);
    return nowMinutes >= startM && nowMinutes < effectiveCutoffM;
  });

  if (ongoing) {
    const endM = timeToMinutes(ongoing.slot.endTime);
    const remaining = Math.max(0, endM - nowMinutes);
    return {
      type: 'ongoing',
      course: ongoing.course,
      slot: ongoing.slot,
      dayName: ongoing.slot.day,
      relativeTimeText: `در حال برگزاری (تا ساعت ${ongoing.slot.endTime} • ${remaining} دقیقه مانده)`,
      badgeText: 'در حال برگزاری',
      daysAhead: 0,
    };
  }

  // 2. Check for upcoming classes later today (classes starting after nowMinutes)
  const upcomingToday = definiteSlots
    .filter(({ slot }) => {
      if (dayIndexMap[slot.day] !== todayIndex) return false;
      const startM = timeToMinutes(slot.startTime);
      return startM > nowMinutes;
    })
    .sort((a, b) => timeToMinutes(a.slot.startTime) - timeToMinutes(b.slot.startTime));

  if (upcomingToday.length > 0) {
    const nextSlot = upcomingToday[0];
    const diffM = timeToMinutes(nextSlot.slot.startTime) - nowMinutes;
    const hours = Math.floor(diffM / 60);
    const mins = diffM % 60;
    const diffStr = hours > 0 ? `${hours} ساعت و ${mins} دقیقه دیگر` : `${mins} دقیقه دیگر`;

    return {
      type: 'upcoming_today',
      course: nextSlot.course,
      slot: nextSlot.slot,
      dayName: nextSlot.slot.day,
      relativeTimeText: `امروز ساعت ${nextSlot.slot.startTime} (شروع تا ${diffStr})`,
      badgeText: 'کلاس بعدی امروز',
      daysAhead: 0,
    };
  }

  // 3. Search future days of the week (1 to 7 days ahead)
  for (let offset = 1; offset <= 7; offset++) {
    const targetDayIndex = (todayIndex + offset) % 7;
    const slotsOnDay = definiteSlots
      .filter(({ slot }) => dayIndexMap[slot.day] === targetDayIndex)
      .sort((a, b) => timeToMinutes(a.slot.startTime) - timeToMinutes(b.slot.startTime));

    if (slotsOnDay.length > 0) {
      const nextSlot = slotsOnDay[0];
      const dayLabel = offset === 1 ? `فردا (${nextSlot.slot.day})` : offset === 2 ? `پس‌فردا (${nextSlot.slot.day})` : `${nextSlot.slot.day}`;

      return {
        type: 'upcoming_future',
        course: nextSlot.course,
        slot: nextSlot.slot,
        dayName: nextSlot.slot.day,
        relativeTimeText: `${dayLabel} ساعت ${nextSlot.slot.startTime}`,
        badgeText: offset === 1 ? 'فردا' : `روز ${nextSlot.slot.day}`,
        daysAhead: offset,
      };
    }
  }

  return null;
}

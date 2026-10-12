/**
 * iCalendar (.ics) generation utility for Medical Course Selection and Exams.
 * Fully compatible with Samsung Calendar (S-Planner), Google Calendar, Apple Calendar (iOS/macOS), and Microsoft Outlook.
 */

import { Course, DayOfWeek } from '../types';
import { getActiveSlotsForCourse } from './conflictDetector';
import {
  toGregorian,
  isValidJalaaliDate as isValidJalaaliDateLib,
  isLeapJalaaliYear as isLeapJalaaliYearLib,
  jalaaliMonthLength as jalaaliMonthLengthLib,
} from 'jalaali-js';

// Map Persian days to RFC 5545 recurrence day codes
const DAY_TO_RRULE_MAP: Record<DayOfWeek, string> = {
  شنبه: 'SA',
  یکشنبه: 'SU',
  دوشنبه: 'MO',
  'سه‌شنبه': 'TU',
  چهارشنبه: 'WE',
  'پنج‌شنبه': 'TH',
};

export interface LocalCalendarDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface GregorianDate {
  gy: number;
  gm: number;
  gd: number;
}

/**
 * Normalizes Persian digits to ASCII English digits.
 */
function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

/**
 * Checks if a Jalali year is a leap year (کبیسه) using standard astronomical algorithm.
 */
export function isLeapJalaliYear(jy: number): boolean {
  if (typeof jy !== 'number' || !Number.isInteger(jy) || jy <= 0) return false;
  try {
    return isLeapJalaaliYearLib(jy);
  } catch {
    return false;
  }
}

/**
 * Returns the exact allowable number of days in a given Jalali month.
 * Months 1-6 have 31 days, months 7-11 have 30 days, month 12 has 29 days (30 in leap years).
 */
export function getJalaliDaysInMonth(jy: number, jm: number): number {
  if (
    typeof jy !== 'number' ||
    typeof jm !== 'number' ||
    !Number.isInteger(jy) ||
    !Number.isInteger(jm) ||
    jy <= 0 ||
    jm < 1 ||
    jm > 12
  ) {
    return 0;
  }
  try {
    return jalaaliMonthLengthLib(jy, jm);
  } catch {
    return 0;
  }
}

/**
 * Validates whether a Jalali date (year, month, day) is legitimate.
 */
export function isValidJalaliDate(jy: number, jm: number, jd: number): boolean {
  if (
    typeof jy !== 'number' ||
    typeof jm !== 'number' ||
    typeof jd !== 'number' ||
    !Number.isInteger(jy) ||
    !Number.isInteger(jm) ||
    !Number.isInteger(jd) ||
    jy <= 0 ||
    jm < 1 ||
    jm > 12 ||
    jd < 1
  ) {
    return false;
  }
  const maxDays = getJalaliDaysInMonth(jy, jm);
  if (jd > maxDays) return false;
  return isValidJalaaliDateLib(jy, jm, jd);
}

/**
 * Mathematically converts a valid Jalali date to its accurate Gregorian counterpart.
 * Explicitly rejects invalid dates (returning null), preventing fake dates,
 * out-of-range months/days, and negative/zero years.
 */
export function jalaliToGregorian(
  jy: number,
  jm: number,
  jd: number
): GregorianDate | null {
  if (!isValidJalaliDate(jy, jm, jd)) {
    return null;
  }

  try {
    const res = toGregorian(jy, jm, jd);
    if (!res || res.gy <= 0 || res.gm < 1 || res.gm > 12 || res.gd < 1 || res.gd > 31) {
      return null;
    }
    return {
      gy: res.gy,
      gm: res.gm,
      gd: res.gd,
    };
  } catch {
    return null;
  }
}

/**
 * Converts a Jalali date string "YYYY/MM/DD" (e.g. "1403/08/30") or Gregorian string to local calendar components.
 * Returns null if the date is invalid, empty, or unparseable.
 * CRITICAL: NEVER falls back to today's date!
 */
export function parseDateToLocalComponents(
  dateStr: string,
  timeStr = '08:30'
): LocalCalendarDateTime | null {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) {
    return null;
  }

  const cleanDate = toEnglishDigits(dateStr.trim());

  // Parse time components safely
  let hour = 8;
  let minute = 30;
  if (timeStr && typeof timeStr === 'string') {
    const cleanTime = toEnglishDigits(timeStr.trim());
    const timeMatch = cleanTime.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (timeMatch) {
      hour = parseInt(timeMatch[1], 10);
      minute = parseInt(timeMatch[2], 10);
    }
  }

  // 1. Check if Jalali pattern: "YYYY/MM/DD" or "YYYY-MM-DD"
  const jalaliMatch = cleanDate.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (jalaliMatch) {
    const jy = parseInt(jalaliMatch[1], 10);
    const jm = parseInt(jalaliMatch[2], 10);
    const jd = parseInt(jalaliMatch[3], 10);

    // If year is in common Jalali range (1200 - 1500)
    if (jy >= 1200 && jy < 1600) {
      const g = jalaliToGregorian(jy, jm, jd);
      if (!g) {
        return null; // Explicitly reject invalid Jalali dates
      }
      return {
        year: g.gy,
        month: g.gm,
        day: g.gd,
        hour,
        minute,
      };
    }
  }

  // 2. Check if standard ISO / Gregorian format (e.g. 2024-11-20 or 2024/11/20)
  const gregMatch = cleanDate.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (gregMatch) {
    const gy = parseInt(gregMatch[1], 10);
    const gm = parseInt(gregMatch[2], 10);
    const gd = parseInt(gregMatch[3], 10);

    if (gy >= 1900 && gy <= 2100 && gm >= 1 && gm <= 12 && gd >= 1 && gd <= 31) {
      const d = new Date(gy, gm - 1, gd);
      if (
        d.getFullYear() === gy &&
        d.getMonth() === gm - 1 &&
        d.getDate() === gd
      ) {
        return {
          year: gy,
          month: gm,
          day: gd,
          hour,
          minute,
        };
      }
    }
    return null;
  }

  return null;
}

/**
 * Format local date and time to RFC 5545 format with TZID
 * e.g. "20261023T083000"
 */
/**
 * Format date-only to RFC 5545 VALUE=DATE format e.g. "20250114"
 */
function formatDateOnly(year: number, month: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}${pad(month)}${pad(day)}`;
}

/**
 * Format local date and time to RFC 5545 format with TZID
 * e.g. "20261023T083000"
 */
function formatLocalDateTime(dt: LocalCalendarDateTime): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${dt.year}${pad(dt.month)}${pad(dt.day)}T${pad(dt.hour)}${pad(dt.minute)}00`
  );
}

/**
 * Add days to a Gregorian year/month/day
 */
function addDaysToGregorian(year: number, month: number, day: number, daysToAdd: number): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

/**
 * Format Date to standard UTC string e.g. "20261023T083000Z" (for DTSTAMP / CREATED)
 */
function formatToUTC(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Find the next matching Gregorian date for a Persian day of the week starting from a reference date
 */
function getFirstOccurrenceDate(day: DayOfWeek, refDate: Date): { year: number; month: number; day: number } {
  // JavaScript getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  const targetDayMap: Record<DayOfWeek, number> = {
    شنبه: 6,
    یکشنبه: 0,
    دوشنبه: 1,
    'سه‌شنبه': 2,
    چهارشنبه: 3,
    'پنج‌شنبه': 4,
  };

  const targetDay = targetDayMap[day];
  const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());

  const currentDay = d.getDay();
  let diff = targetDay - currentDay;
  if (diff < 0) {
    diff += 7;
  }
  d.setDate(d.getDate() + diff);

  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

/**
 * Escape text for iCalendar description / summary fields per RFC 5545
 * Specifically escapes backslash, semicolon, comma, and converts newlines to literal '\n'.
 */
export function escapeICSText(str: string): string {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/[،]/g, '\\,')
    .replace(/[؛]/g, '\\;')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n');
}

/**
 * Fold lines longer than 75 octets according to RFC 5545 specification.
 * Respects UTF-8 multi-byte boundaries so Persian characters are never split mid-sequence.
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let start = 0;
  let isFirst = true;

  while (start < bytes.length) {
    const maxOctets = isFirst ? 75 : 74; // for continuation lines: 1 space octet + 74 content octets = 75
    let end = start + maxOctets;

    if (end >= bytes.length) {
      const slice = bytes.subarray(start);
      chunks.push((isFirst ? '' : ' ') + decoder.decode(slice));
      break;
    }

    // Do not split inside a multi-byte UTF-8 sequence.
    // UTF-8 continuation bytes have bits 10xxxxxx (0x80 to 0xBF).
    while (end > start && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }

    const slice = bytes.subarray(start, end);
    chunks.push((isFirst ? '' : ' ') + decoder.decode(slice));
    start = end;
    isFirst = false;
  }

  return chunks.join('\r\n');
}

/**
 * Determines an approximate or academic semester start date based on Persian academic calendar.
 * Term 1 (Fall): Starts around Mehr 1 (Sep 22/23)
 * Term 2 (Spring): Starts around Bahman 15 (Feb 3/4)
 */
export function getDefaultSemesterStartDate(referenceJalaliYear = 1403, termType: 'fall' | 'spring' = 'fall'): Date {
  if (termType === 'spring') {
    const g = jalaliToGregorian(referenceJalaliYear, 11, 15);
    if (g) return new Date(g.gy, g.gm - 1, g.gd);
  }
  // Default to Fall (1 Mehr)
  const g = jalaliToGregorian(referenceJalaliYear, 7, 1);
  if (g) return new Date(g.gy, g.gm - 1, g.gd);
  return new Date();
}

export interface ICSOptions {
  includeWeeklyClasses?: boolean;
  includeMidtermExams?: boolean;
  includeFinalExams?: boolean;
  addAlarm?: boolean;
  alarmMinutesBefore?: number;
  semesterWeeks?: number; // default 16 weeks
  semesterStartDate?: Date;
  /** Custom Jalali start date string e.g. "1403/07/01" */
  customSemesterStartDateJalali?: string;
}

export interface ICSExportWarning {
  courseId: string;
  courseName: string;
  eventType: 'class' | 'midterm' | 'final';
  rawDate: string;
  reason: string;
}

export interface ICSGenerationResult {
  content: string;
  warnings: ICSExportWarning[];
}

/**
 * Generates RFC 5545 .ics calendar content with explicit VTIMEZONE Asia/Tehran
 * for maximum compatibility with Samsung Calendar, Google Calendar, iOS, and Outlook.
 * Returns both the generated .ics content and any warnings regarding skipped invalid events.
 */
export function generateICSContent(
  selectedCourses: Course[],
  gender: 'male' | 'female',
  selectedPracticalGroups: Record<string, string>,
  options: ICSOptions = {}
): ICSGenerationResult {
  const {
    includeWeeklyClasses = true,
    includeMidtermExams = true,
    includeFinalExams = true,
    addAlarm = true,
    alarmMinutesBefore = 30,
    semesterWeeks = 16,
    customSemesterStartDateJalali,
  } = options;

  let resolvedSemesterStartDate: Date;
  if (customSemesterStartDateJalali && typeof customSemesterStartDateJalali === 'string' && customSemesterStartDateJalali.trim()) {
    const comp = parseDateToLocalComponents(customSemesterStartDateJalali, '00:00');
    if (comp) {
      resolvedSemesterStartDate = new Date(comp.year, comp.month - 1, comp.day);
    } else {
      resolvedSemesterStartDate = options.semesterStartDate || getDefaultSemesterStartDate(1403, 'fall');
    }
  } else if (options.semesterStartDate) {
    resolvedSemesterStartDate = options.semesterStartDate;
  } else {
    // Intelligent default from academic calendar rather than silent today
    resolvedSemesterStartDate = getDefaultSemesterStartDate(1403, 'fall');
  }

  const events: string[] = [];
  const warnings: ICSExportWarning[] = [];
  const nowUtcStr = formatToUTC(new Date());

  // 1. Weekly Class Events (Recurring)
  if (includeWeeklyClasses) {
    for (const course of selectedCourses) {
      const slots = getActiveSlotsForCourse(
        course,
        gender,
        selectedPracticalGroups[course.id]
      );

      for (const slot of slots) {
        if (slot.isTentative) continue; // Skip unconfirmed floating lab slots

        const rruleDay = DAY_TO_RRULE_MAP[slot.day];
        if (!rruleDay) {
          warnings.push({
            courseId: course.id,
            courseName: course.name,
            eventType: 'class',
            rawDate: slot.day,
            reason: `روز برگزاری کلاس «${slot.day}» در درس «${course.name}» نامعتبر است و درج نشد.`,
          });
          continue;
        }

        const dateComp = getFirstOccurrenceDate(slot.day, resolvedSemesterStartDate);
        const [startH, startM] = slot.startTime.split(':').map((v) => parseInt(v, 10) || 0);
        const [endH, endM] = slot.endTime.split(':').map((v) => parseInt(v, 10) || 0);

        const dtStart = formatLocalDateTime({ ...dateComp, hour: startH, minute: startM });
        const dtEnd = formatLocalDateTime({ ...dateComp, hour: endH, minute: endM });

        // Stable and deterministic UID based on course, slot day, time and group
        const groupPart = slot.groupId || slot.groupName ? `-${slot.groupId || slot.groupName}` : '';
        const uid = `class-${course.id}-${slot.day}-${slot.startTime.replace(':', '')}-${slot.endTime.replace(':', '')}${groupPart}@med-planner`;
        const summary = `کلاس ${course.name} (${slot.label || 'نظری'})`;
        const totalUnitsText = course.units ? `${course.units.total} واحد` : '';
        const instructorsText = course.instructors ? `\\nمدرس: ${course.instructors}` : '';
        const unitsLine = totalUnitsText ? `\\nواحد: ${totalUnitsText}` : '';
        const description = `درس: ${course.name}\\nکد: ${course.code || '-'}${instructorsText}${unitsLine}\\nنوع: ${slot.label || 'نظری'}${slot.groupName ? `\\nگروه: ${slot.groupName}` : ''}`;
        const location = slot.location || 'دانشگاه - کلاس درس';

        const eventLines = [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${nowUtcStr}`,
          `CREATED:${nowUtcStr}`,
          `DTSTART;TZID=Asia/Tehran:${dtStart}`,
          `DTEND;TZID=Asia/Tehran:${dtEnd}`,
          `RRULE:FREQ=WEEKLY;COUNT=${semesterWeeks};BYDAY=${rruleDay}`,
          `SUMMARY:${escapeICSText(summary)}`,
          `DESCRIPTION:${escapeICSText(description)}`,
          `LOCATION:${escapeICSText(location)}`,
          'STATUS:CONFIRMED',
          'TRANSP:OPAQUE',
        ];

        if (addAlarm) {
          eventLines.push(
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            `DESCRIPTION:یادآوری شروع کلاس ${escapeICSText(course.name)}`,
            `TRIGGER:-PT${alarmMinutesBefore}M`,
            'END:VALARM'
          );
        }

        eventLines.push('END:VEVENT');
        events.push(eventLines.map(foldLine).join('\r\n'));
      }
    }
  }

  // Helper to parse exam start and end times
  const parseExamTiming = (timeStr?: string): { hasSpecificTime: boolean; startH: number; startM: number; endH: number; endM: number } => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.trim()) {
      return { hasSpecificTime: false, startH: 0, startM: 0, endH: 0, endM: 0 };
    }
    const clean = toEnglishDigits(timeStr.trim());
    // Match "10:00 - 12:00" or "10:00-12:00"
    const rangeMatch = clean.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])\s*[-–]\s*([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (rangeMatch) {
      return {
        hasSpecificTime: true,
        startH: parseInt(rangeMatch[1], 10),
        startM: parseInt(rangeMatch[2], 10),
        endH: parseInt(rangeMatch[3], 10),
        endM: parseInt(rangeMatch[4], 10),
      };
    }
    // Match single time "08:30"
    const singleMatch = clean.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (singleMatch) {
      const startH = parseInt(singleMatch[1], 10);
      const startM = parseInt(singleMatch[2], 10);
      // Default duration is 2 hours, ensuring end is after start
      const endH = (startH + 2) % 24;
      return {
        hasSpecificTime: true,
        startH,
        startM,
        endH,
        endM: startM,
      };
    }
    return { hasSpecificTime: false, startH: 0, startM: 0, endH: 0, endM: 0 };
  };

  // 2. Midterm Exams
  if (includeMidtermExams) {
    for (const course of selectedCourses) {
      if (course.midtermExam && course.midtermExam.date) {
        const timeConfig = parseExamTiming(course.midtermExam.time);
        const dt = parseDateToLocalComponents(
          course.midtermExam.date,
          timeConfig.hasSpecificTime ? `${String(timeConfig.startH).padStart(2, '0')}:${String(timeConfig.startM).padStart(2, '0')}` : '08:30'
        );

        if (!dt) {
          warnings.push({
            courseId: course.id,
            courseName: course.name,
            eventType: 'midterm',
            rawDate: course.midtermExam.date,
            reason: `تاریخ امتحان میان‌ترم «${course.midtermExam.date}» نامعتبر است و این رویداد در گاهشمار درج نشد.`,
          });
          continue; // Do NOT generate invalid event or silent fallback to today!
        }

        // Stable and deterministic UID
        const cleanDateStr = course.midtermExam.date.replace(/[\/\-]/g, '');
        const uid = `exam-midterm-${course.id}-${cleanDateStr}@med-planner`;
        const summary = `امتحان میان‌ترم ${course.name}`;
        const description = `آزمون میان‌ترم / حذفی درس: ${course.name}\\nکد درس: ${course.code}\\nتاریخ شمسی: ${course.midtermExam.date}${course.midtermExam.time ? `\\nساعت: ${course.midtermExam.time}` : ''}${course.midtermExam.notes ? `\\nتوضیحات: ${course.midtermExam.notes}` : ''}`;

        const eventLines: string[] = [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${nowUtcStr}`,
          `CREATED:${nowUtcStr}`,
        ];

        if (timeConfig.hasSpecificTime) {
          // Timed event: DATE-TIME with local TZID
          const dtStart = formatLocalDateTime({ ...dt, hour: timeConfig.startH, minute: timeConfig.startM });
          const dtEnd = formatLocalDateTime({ ...dt, hour: timeConfig.endH, minute: timeConfig.endM });
          eventLines.push(`DTSTART;TZID=Asia/Tehran:${dtStart}`);
          eventLines.push(`DTEND;TZID=Asia/Tehran:${dtEnd}`);
        } else {
          // Full-day event: VALUE=DATE with exclusive DTEND next day
          const dtStart = formatDateOnly(dt.year, dt.month, dt.day);
          const nextDay = addDaysToGregorian(dt.year, dt.month, dt.day, 1);
          const dtEnd = formatDateOnly(nextDay.year, nextDay.month, nextDay.day);
          eventLines.push(`DTSTART;VALUE=DATE:${dtStart}`);
          eventLines.push(`DTEND;VALUE=DATE:${dtEnd}`);
        }

        eventLines.push(
          `SUMMARY:${escapeICSText(summary)}`,
          `DESCRIPTION:${escapeICSText(description)}`,
          'LOCATION:دانشگاه - سالن امتحانات',
          'STATUS:CONFIRMED',
          'TRANSP:OPAQUE'
        );

        if (addAlarm) {
          eventLines.push(
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            `DESCRIPTION:یادآوری ۱ روز قبل: امتحان میان‌ترم ${escapeICSText(course.name)}`,
            'TRIGGER:-P1D',
            'END:VALARM'
          );
          if (timeConfig.hasSpecificTime) {
            eventLines.push(
              'BEGIN:VALARM',
              'ACTION:DISPLAY',
              `DESCRIPTION:آلارم فوری: امتحان میان‌ترم ${escapeICSText(course.name)} تا ۲ ساعت دیگر`,
              'TRIGGER:-PT120M',
              'END:VALARM'
            );
          }
        }

        eventLines.push('END:VEVENT');
        events.push(eventLines.map(foldLine).join('\r\n'));
      }
    }
  }

  // 3. Final Exams
  if (includeFinalExams) {
    for (const course of selectedCourses) {
      if (course.finalExam && course.finalExam.date) {
        const timeConfig = parseExamTiming(course.finalExam.time);
        const dt = parseDateToLocalComponents(
          course.finalExam.date,
          timeConfig.hasSpecificTime ? `${String(timeConfig.startH).padStart(2, '0')}:${String(timeConfig.startM).padStart(2, '0')}` : '08:30'
        );

        if (!dt) {
          warnings.push({
            courseId: course.id,
            courseName: course.name,
            eventType: 'final',
            rawDate: course.finalExam.date,
            reason: `تاریخ امتحان پایان‌ترم «${course.finalExam.date}» نامعتبر است و این رویداد در گاهشمار درج نشد.`,
          });
          continue; // Do NOT generate invalid event or silent fallback to today!
        }

        // Stable and deterministic UID
        const cleanDateStr = course.finalExam.date.replace(/[\/\-]/g, '');
        const uid = `exam-final-${course.id}-${cleanDateStr}@med-planner`;
        const summary = `امتحان پایان‌ترم ${course.name}`;
        const description = `آزمون نهایی متمرکز درس: ${course.name}\\nکد درس: ${course.code}\\nتاریخ شمسی: ${course.finalExam.date}${course.finalExam.time ? `\\nساعت: ${course.finalExam.time}` : ''}${course.finalExam.notes ? `\\nتوضیحات: ${course.finalExam.notes}` : ''}`;

        const eventLines: string[] = [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${nowUtcStr}`,
          `CREATED:${nowUtcStr}`,
        ];

        if (timeConfig.hasSpecificTime) {
          // Timed event: DATE-TIME with local TZID
          const dtStart = formatLocalDateTime({ ...dt, hour: timeConfig.startH, minute: timeConfig.startM });
          const dtEnd = formatLocalDateTime({ ...dt, hour: timeConfig.endH, minute: timeConfig.endM });
          eventLines.push(`DTSTART;TZID=Asia/Tehran:${dtStart}`);
          eventLines.push(`DTEND;TZID=Asia/Tehran:${dtEnd}`);
        } else {
          // Full-day event: VALUE=DATE with exclusive DTEND next day
          const dtStart = formatDateOnly(dt.year, dt.month, dt.day);
          const nextDay = addDaysToGregorian(dt.year, dt.month, dt.day, 1);
          const dtEnd = formatDateOnly(nextDay.year, nextDay.month, nextDay.day);
          eventLines.push(`DTSTART;VALUE=DATE:${dtStart}`);
          eventLines.push(`DTEND;VALUE=DATE:${dtEnd}`);
        }

        eventLines.push(
          `SUMMARY:${escapeICSText(summary)}`,
          `DESCRIPTION:${escapeICSText(description)}`,
          'LOCATION:دانشگاه - سالن امتحانات متمرکز',
          'STATUS:CONFIRMED',
          'TRANSP:OPAQUE'
        );

        if (addAlarm) {
          eventLines.push(
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            `DESCRIPTION:یادآوری ۲ روز قبل: امتحان نهایی ${escapeICSText(course.name)}`,
            'TRIGGER:-P2D',
            'END:VALARM'
          );
          if (timeConfig.hasSpecificTime) {
            eventLines.push(
              'BEGIN:VALARM',
              'ACTION:DISPLAY',
              `DESCRIPTION:آلارم فوری: امتحان نهایی ${escapeICSText(course.name)} تا ۳ ساعت دیگر`,
              'TRIGGER:-PT180M',
              'END:VALARM'
            );
          }
        }

        eventLines.push('END:VEVENT');
        events.push(eventLines.map(foldLine).join('\r\n'));
      }
    }
  }

  // Standard VTIMEZONE component for Asia/Tehran
  const timezoneBlock = [
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Tehran',
    'X-LIC-LOCATION:Asia/Tehran',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0330',
    'TZOFFSETTO:+0330',
    'TZNAME:+0330',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
  ].join('\r\n');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//University Course Planner//FA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:برنامه انتخاب واحد و امتحانات دانشگاهی',
    'X-WR-TIMEZONE:Asia/Tehran',
    'X-WR-CALDESC:تقویم هوشمند جلسات هفتگی کلاس‌ها و تاریخ امتحانات دانشگاهی',
    timezoneBlock,
    ...events,
    'END:VCALENDAR',
  ];

  return {
    content: icsLines.join('\r\n'),
    warnings,
  };
}

/**
 * Downloads the .ics file to user's device with proper MIME type for Android / Samsung / iOS
 */
export function downloadICSFile(filename: string, content: string): void {
  // UTF-8 with BOM or text/calendar helps Samsung Calendar recognize Persian characters without garbled text
  const blob = new Blob(['\ufeff', content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  a.setAttribute('target', '_blank');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

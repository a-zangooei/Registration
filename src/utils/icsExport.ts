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
function formatLocalDateTime(dt: LocalCalendarDateTime): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${dt.year}${pad(dt.month)}${pad(dt.day)}T${pad(dt.hour)}${pad(dt.minute)}00`
  );
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
 */
function escapeICSText(str: string): string {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n');
}

/**
 * Fold lines longer than 75 octets according to RFC 5545 specification
 * (Crucial for Samsung Calendar and strict Android iCalendar parsers)
 */
function foldLine(line: string): string {
  if (line.length <= 72) return line;
  const chunks: string[] = [];
  let remaining = line;
  let isFirst = true;

  while (remaining.length > 0) {
    const limit = isFirst ? 72 : 71;
    chunks.push((isFirst ? '' : ' ') + remaining.substring(0, limit));
    remaining = remaining.substring(limit);
    isFirst = false;
  }
  return chunks.join('\r\n');
}

export interface ICSOptions {
  includeWeeklyClasses?: boolean;
  includeMidtermExams?: boolean;
  includeFinalExams?: boolean;
  addAlarm?: boolean;
  alarmMinutesBefore?: number;
  semesterWeeks?: number; // default 16 weeks
  semesterStartDate?: Date;
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
    semesterStartDate = new Date(),
  } = options;

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

        const dateComp = getFirstOccurrenceDate(slot.day, semesterStartDate);
        const [startH, startM] = slot.startTime.split(':').map((v) => parseInt(v, 10) || 0);
        const [endH, endM] = slot.endTime.split(':').map((v) => parseInt(v, 10) || 0);

        const dtStart = formatLocalDateTime({ ...dateComp, hour: startH, minute: startM });
        const dtEnd = formatLocalDateTime({ ...dateComp, hour: endH, minute: endM });

        const uid = `class-${course.id}-${slot.day}-${slot.startTime.replace(':', '')}-${Date.now()}@uni-planner`;
        const summary = `کلاس ${course.name} (${slot.label || 'نظری'})`;
        const description = `درس: ${course.name}\\nکد: ${course.code}\\nمدرس: ${course.instructors}\\nواحد: ${course.units.total} واحد\\nنوع: ${slot.label || 'نظری'}${slot.groupName ? `\\nگروه: ${slot.groupName}` : ''}`;
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

  // 2. Midterm Exams
  if (includeMidtermExams) {
    for (const course of selectedCourses) {
      if (course.midtermExam && course.midtermExam.date) {
        const timeStr = course.midtermExam.time || '08:30';
        const dt = parseDateToLocalComponents(course.midtermExam.date, timeStr);

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

        const h = dt.hour;
        const dtStart = formatLocalDateTime(dt);
        const dtEnd = formatLocalDateTime({ ...dt, hour: (h + 2) % 24 }); // 2 hours duration

        const uid = `exam-midterm-${course.id}-${course.midtermExam.date.replace(/[\/\-]/g, '')}-${Date.now()}@med-planner`;
        const summary = `امتحان میان‌ترم ${course.name}`;
        const description = `آزمون میان‌ترم / حذفی درس: ${course.name}\\nکد درس: ${course.code}\\nتاریخ شمسی: ${course.midtermExam.date}\\nساعت: ${timeStr}${course.midtermExam.notes ? `\\nتوضیحات: ${course.midtermExam.notes}` : ''}`;

        const eventLines = [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${nowUtcStr}`,
          `CREATED:${nowUtcStr}`,
          `DTSTART;TZID=Asia/Tehran:${dtStart}`,
          `DTEND;TZID=Asia/Tehran:${dtEnd}`,
          `SUMMARY:${escapeICSText(summary)}`,
          `DESCRIPTION:${escapeICSText(description)}`,
          'LOCATION:دانشگاه - سالن امتحانات',
          'STATUS:CONFIRMED',
          'TRANSP:OPAQUE',
        ];

        if (addAlarm) {
          eventLines.push(
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            `DESCRIPTION:یادآوری ۱ روز قبل: امتحان میان‌ترم ${escapeICSText(course.name)}`,
            'TRIGGER:-P1D',
            'END:VALARM',
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            `DESCRIPTION:آلارم فوری: امتحان میان‌ترم ${escapeICSText(course.name)} تا ۲ ساعت دیگر`,
            'TRIGGER:-PT120M',
            'END:VALARM'
          );
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
        const timeStr = course.finalExam.time || '08:30';
        const dt = parseDateToLocalComponents(course.finalExam.date, timeStr);

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

        const h = dt.hour;
        const dtStart = formatLocalDateTime(dt);
        const dtEnd = formatLocalDateTime({ ...dt, hour: (h + 2) % 24 }); // 2 hours duration

        const uid = `exam-final-${course.id}-${course.finalExam.date.replace(/[\/\-]/g, '')}-${Date.now()}@med-planner`;
        const summary = `امتحان پایان‌ترم ${course.name}`;
        const description = `آزمون نهایی متمرکز درس: ${course.name}\\nکد درس: ${course.code}\\nتاریخ شمسی: ${course.finalExam.date}\\nساعت: ${timeStr}${course.finalExam.notes ? `\\nتوضیحات: ${course.finalExam.notes}` : ''}`;

        const eventLines = [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${nowUtcStr}`,
          `CREATED:${nowUtcStr}`,
          `DTSTART;TZID=Asia/Tehran:${dtStart}`,
          `DTEND;TZID=Asia/Tehran:${dtEnd}`,
          `SUMMARY:${escapeICSText(summary)}`,
          `DESCRIPTION:${escapeICSText(description)}`,
          'LOCATION:دانشگاه - سالن امتحانات متمرکز',
          'STATUS:CONFIRMED',
          'TRANSP:OPAQUE',
        ];

        if (addAlarm) {
          eventLines.push(
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            `DESCRIPTION:یادآوری ۲ روز قبل: امتحان نهایی ${escapeICSText(course.name)}`,
            'TRIGGER:-P2D',
            'END:VALARM',
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            `DESCRIPTION:آلارم فوری: امتحان نهایی ${escapeICSText(course.name)} تا ۳ ساعت دیگر`,
            'TRIGGER:-PT180M',
            'END:VALARM'
          );
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

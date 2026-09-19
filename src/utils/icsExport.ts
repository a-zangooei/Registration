/**
 * iCalendar (.ics) generation utility for Medical Course Selection and Exams.
 * Fully compatible with Samsung Calendar (S-Planner), Google Calendar, Apple Calendar (iOS/macOS), and Microsoft Outlook.
 */

import { Course, DayOfWeek } from '../types';
import { getActiveSlotsForCourse } from './conflictDetector';

// Map Persian days to RFC 5545 recurrence day codes
const DAY_TO_RRULE_MAP: Record<DayOfWeek, string> = {
  شنبه: 'SA',
  یکشنبه: 'SU',
  دوشنبه: 'MO',
  'سه‌شنبه': 'TU',
  چهارشنبه: 'WE',
};

export interface LocalCalendarDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/**
 * Converts a Jalali date string "YYYY/MM/DD" (e.g. "1403/08/30") or Gregorian string to local calendar components.
 */
export function parseDateToLocalComponents(dateStr: string, timeStr = '08:30'): LocalCalendarDateTime {
  const [hour, minute] = timeStr.split(':').map((t) => parseInt(t, 10) || 0);

  // Check if Jalali (starts with 13xx or 14xx)
  const parts = dateStr.split(/[\/\-]/).map((p) => parseInt(p, 10));
  if (parts.length === 3 && parts[0] >= 1300 && parts[0] < 1500) {
    const [jy, jm, jd] = parts;
    const g = jalaliToGregorian(jy, jm, jd);
    return {
      year: g.gy,
      month: g.gm,
      day: g.gd,
      hour,
      minute,
    };
  }

  // Fallback as standard ISO / Gregorian
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour,
      minute,
    };
  }

  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour,
    minute,
  };
}

/**
 * Standard Jalali to Gregorian conversion algorithm
 */
function jalaliToGregorian(jy: number, jm: number, jd: number) {
  const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  let gy = jy + 621;
  const days =
    (jy - 979) * 365 +
    Math.floor((jy - 979) / 33) * 8 +
    Math.floor(((jy - 979) % 33 + 3) / 4) +
    979;

  let total_days = 0;
  for (let i = 0; i < jm - 1; ++i) {
    total_days += j_days_in_month[i];
  }
  total_days += jd - 1;

  let g_day_no = days + total_days - 355666;

  let leap = false;
  gy = 400 * Math.floor(g_day_no / 146097);
  g_day_no = g_day_no % 146097;

  if (g_day_no >= 36525) {
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524);
    g_day_no = g_day_no % 36524;
    if (g_day_no >= 365) g_day_no++;
    else leap = true;
  }

  gy += 4 * Math.floor(g_day_no / 1461);
  g_day_no %= 1461;

  if (g_day_no >= 366) {
    leap = false;
    g_day_no--;
    gy += Math.floor(g_day_no / 365);
    g_day_no = g_day_no % 365;
  }

  let gm = 0;
  for (let i = 0; i < 12; i++) {
    const daysInM = i === 1 && (leap || (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0) ? 29 : g_days_in_month[i];
    if (g_day_no < daysInM) {
      gm = i + 1;
      break;
    }
    g_day_no -= daysInM;
  }
  const gd = g_day_no + 1;

  return { gy, gm, gd };
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

/**
 * Generates RFC 5545 .ics calendar content with explicit VTIMEZONE Asia/Tehran
 * for maximum compatibility with Samsung Calendar, Google Calendar, iOS, and Outlook.
 */
export function generateICSContent(
  selectedCourses: Course[],
  gender: 'male' | 'female',
  selectedPracticalGroups: Record<string, string>,
  options: ICSOptions = {}
): string {
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
        if (!rruleDay) continue;

        const dateComp = getFirstOccurrenceDate(slot.day, semesterStartDate);
        const [startH, startM] = slot.startTime.split(':').map((v) => parseInt(v, 10) || 0);
        const [endH, endM] = slot.endTime.split(':').map((v) => parseInt(v, 10) || 0);

        const dtStart = formatLocalDateTime({ ...dateComp, hour: startH, minute: startM });
        const dtEnd = formatLocalDateTime({ ...dateComp, hour: endH, minute: endM });

        const uid = `class-${course.id}-${slot.day}-${slot.startTime.replace(':', '')}-${Date.now()}@med-planner`;
        const summary = `کلاس ${course.name} (${slot.label || 'نظری'})`;
        const description = `درس: ${course.name}\\nکد: ${course.code}\\nمدرس: ${course.instructors}\\nواحد: ${course.units.total} واحد\\nنوع: ${slot.label || 'نظری'}${slot.groupName ? `\\nگروه: ${slot.groupName}` : ''}`;
        const location = slot.location || 'دانشکده پزشکی';

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
        const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
        const dt = parseDateToLocalComponents(course.midtermExam.date, timeStr);

        const dtStart = formatLocalDateTime(dt);
        const dtEnd = formatLocalDateTime({ ...dt, hour: h + 2 }); // 2 hours duration

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
          'LOCATION:دانشکده پزشکی - سالن امتحانات',
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
        const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
        const dt = parseDateToLocalComponents(course.finalExam.date, timeStr);

        const dtStart = formatLocalDateTime(dt);
        const dtEnd = formatLocalDateTime({ ...dt, hour: h + 2 }); // 2 hours duration

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
          'LOCATION:دانشکده پزشکی - سالن امتحانات متمرکز',
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
    'PRODID:-//Medical University Course Planner//FA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:برنامه انتخاب واحد و امتحانات پزشکی',
    'X-WR-TIMEZONE:Asia/Tehran',
    'X-WR-CALDESC:تقویم هوشمند جلسات هفتگی کلاس‌ها و تاریخ امتحانات علوم پایه پزشکی',
    timezoneBlock,
    ...events,
    'END:VCALENDAR',
  ];

  return icsLines.join('\r\n');
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

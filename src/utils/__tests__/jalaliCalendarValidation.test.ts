import assert from 'node:assert/strict';
import {
  isLeapJalaliYear,
  getJalaliDaysInMonth,
  isValidJalaliDate,
  jalaliToGregorian,
  parseDateToLocalComponents,
  generateICSContent,
  foldLine,
  escapeICSText,
  getDefaultSemesterStartDate,
} from '../icsExport';
import {
  validateJalaliDateDetails,
  isValidJalaliDate as isValidJalaliDateInLoader,
  validateCurriculumJson,
} from '../../data/curriculumLoader';
import { Course } from '../../types';

console.log('--- Running Jalali Calendar & ICS Date Validation Test Suite ---\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// =========================================================================
// ۱. آزمون‌های سال کبیسه جلالی (Leap Year) بر مبنای الگوریتم اخترشناسی استاندارد
// =========================================================================
runTest('۱. تشخیص درست سال‌های کبیسه دوره‌های ۴ ساله و ۵ ساله گاهشماری رسمی', () => {
  // سال‌های کبیسه قطعی
  assert.equal(isLeapJalaliYear(1370), true, '1370 باید کبیسه باشد');
  assert.equal(isLeapJalaliYear(1375), true, '1375 باید کبیسه باشد (پرش ۵ ساله)');
  assert.equal(isLeapJalaliYear(1379), true, '1379 باید کبیسه باشد');
  assert.equal(isLeapJalaliYear(1383), true, '1383 باید کبیسه باشد');
  assert.equal(isLeapJalaliYear(1387), true, '1387 باید کبیسه باشد');
  assert.equal(isLeapJalaliYear(1391), true, '1391 باید کبیسه باشد');
  assert.equal(isLeapJalaliYear(1395), true, '1395 باید کبیسه باشد');
  assert.equal(isLeapJalaliYear(1399), true, '1399 باید کبیسه باشد');
  assert.equal(isLeapJalaliYear(1403), true, '1403 باید کبیسه باشد');
  assert.equal(isLeapJalaliYear(1408), true, '1408 باید کبیسه باشد');

  // سال‌های غیرکبیسه
  assert.equal(isLeapJalaliYear(1401), false, '1401 نباید کبیسه باشد');
  assert.equal(isLeapJalaliYear(1402), false, '1402 نباید کبیسه باشد');
  assert.equal(isLeapJalaliYear(1404), false, '1404 نباید کبیسه باشد');
  assert.equal(isLeapJalaliYear(1405), false, '1405 نباید کبیسه باشد');
  assert.equal(isLeapJalaliYear(1406), false, '1406 نباید کبیسه باشد');
  assert.equal(isLeapJalaliYear(1407), false, '1407 نباید کبیسه باشد');

  // ورودی‌های نامعتبر یا سال منفی/صفر
  assert.equal(isLeapJalaliYear(0), false);
  assert.equal(isLeapJalaliYear(-1403), false);
  assert.equal(isLeapJalaliYear(NaN as any), false);
});

// =========================================================================
// ۲. آزمون تعداد روزهای مجاز هر ماه جلالی
// =========================================================================
runTest('۲. صحت تعداد روزهای هر ماه جلالی (ماه‌های ۱-۶: ۳۱ روز، ۷-۱۱: ۳۰ روز، ۱۲: ۲۹ یا ۳۰ روز)', () => {
  // ماه‌های نیمه اول سال
  for (let m = 1; m <= 6; m++) {
    assert.equal(getJalaliDaysInMonth(1403, m), 31, `ماه ${m} باید ۳۱ روز باشد`);
  }

  // ماه‌های پاییز و زمستان تا بهمن
  for (let m = 7; m <= 11; m++) {
    assert.equal(getJalaliDaysInMonth(1403, m), 30, `ماه ${m} باید ۳۰ روز باشد`);
  }

  // اسفند در سال کبیسه ۱۴۰۳
  assert.equal(getJalaliDaysInMonth(1403, 12), 30, 'اسفند در سال کبیسه ۱۴۰۳ باید ۳۰ روز باشد');

  // اسفند در سال عادی ۱۴۰۴
  assert.equal(getJalaliDaysInMonth(1404, 12), 29, 'اسفند در سال غیرکبیسه ۱۴۰۴ باید ۲۹ روز باشد');

  // ماه‌های نامعتبر
  assert.equal(getJalaliDaysInMonth(1403, 13), 0);
  assert.equal(getJalaliDaysInMonth(1403, 0), 0);
});

// =========================================================================
// ۳. آزمون تبدیل جلالی به میلادی (jalaliToGregorian) برای تاریخ‌های شناخته‌شده
// =========================================================================
runTest('۳. تبدیل دقیق تاریخ‌های مرجع شناخته‌شده جلالی به میلادی', () => {
  // ۱ فروردین ۱۴۰۳ -> 2024-03-20
  const d1 = jalaliToGregorian(1403, 1, 1);
  assert.deepEqual(d1, { gy: 2024, gm: 3, gd: 20 });

  // ۳۰ اسفند ۱۴۰۳ (کبیسه) -> 2025-03-20
  const d2 = jalaliToGregorian(1403, 12, 30);
  assert.deepEqual(d2, { gy: 2025, gm: 3, gd: 20 });

  // ۱ فروردین ۱۴۰۴ -> 2025-03-21
  const d3 = jalaliToGregorian(1404, 1, 1);
  assert.deepEqual(d3, { gy: 2025, gm: 3, gd: 21 });

  // ۲۹ اسفند ۱۴۰۲ -> 2024-03-19
  const d4 = jalaliToGregorian(1402, 12, 29);
  assert.deepEqual(d4, { gy: 2024, gm: 3, gd: 19 });

  // ۳۰ اسفند ۱۳۹۹ (کبیسه) -> 2021-03-20
  const d5 = jalaliToGregorian(1399, 12, 30);
  assert.deepEqual(d5, { gy: 2021, gm: 3, gd: 20 });

  // ۲۲ بهمن ۱۳۵۷ -> 1979-02-11
  const d6 = jalaliToGregorian(1357, 11, 22);
  assert.deepEqual(d6, { gy: 1979, gm: 2, gd: 11 });
});

// =========================================================================
// ۴. رد صریح ورودی‌های نامعتبر در jalaliToGregorian و جلوگیری از خروجی‌های غیرعادی
// =========================================================================
runTest('۴. رد تاریخ‌های نامعتبر، روز صفر، ماه ۱۳ و عدم تولید سال منفی یا ساختگی', () => {
  // ماه ۱۳
  assert.equal(jalaliToGregorian(1403, 13, 1), null);

  // روز صفر
  assert.equal(jalaliToGregorian(1403, 1, 0), null);

  // روز ۳۲
  assert.equal(jalaliToGregorian(1403, 1, 32), null);

  // روز ۳۱ در ماه‌های ۷ تا ۱۲
  assert.equal(jalaliToGregorian(1403, 7, 31), null);
  assert.equal(jalaliToGregorian(1403, 11, 31), null);

  // روز ۳۰ اسفند در سال غیرکبیسه ۱۴۰۴
  assert.equal(jalaliToGregorian(1404, 12, 30), null);

  // سال صفر یا منفی
  assert.equal(jalaliToGregorian(0, 1, 1), null);
  assert.equal(jalaliToGregorian(-1403, 1, 1), null);

  // مقادیر غیرعدد
  assert.equal(jalaliToGregorian(NaN as any, 1, 1), null);
  assert.equal(jalaliToGregorian(1403, '1' as any, 1), null);
});

// =========================================================================
// ۵. آزمون تابع parseDateToLocalComponents و حذف قطعی تبدیل به تاریخ امروز
// =========================================================================
runTest('۵. تجزیه تاریخ بدون بازگشت خاموش به تاریخ امروز (حذف Silent Fallback)', () => {
  const today = new Date();

  // تاریخ معتبر شمسی
  const validComp = parseDateToLocalComponents('1403/08/30', '10:00');
  assert.ok(validComp !== null);
  assert.equal(validComp.year, 2024);
  assert.equal(validComp.month, 11);
  assert.equal(validComp.day, 20);
  assert.equal(validComp.hour, 10);
  assert.equal(validComp.minute, 0);

  // ارقام فارسی
  const validFaComp = parseDateToLocalComponents('۱۴۰۳/۰۸/۳۰', '۱۰:۳۰');
  assert.ok(validFaComp !== null);
  assert.equal(validFaComp.year, 2024);
  assert.equal(validFaComp.month, 11);
  assert.equal(validFaComp.day, 20);
  assert.equal(validFaComp.hour, 10);
  assert.equal(validFaComp.minute, 30);

  // ورودی خالی نباید تاریخ امروز بازگرداند
  const emptyRes = parseDateToLocalComponents('');
  assert.equal(emptyRes, null, 'رشته خالی باید دقیقاً null برگرداند نه تاریخ امروز');

  // ورودی ناقص یا مخدوش
  const garbageRes = parseDateToLocalComponents('not-a-date');
  assert.equal(garbageRes, null, 'رشته نامعتبر باید null برگرداند');

  // ماه ۱۳
  const month13Res = parseDateToLocalComponents('1403/13/05');
  assert.equal(month13Res, null, 'ماه ۱۳ باید null برگرداند');

  // اسفند ۳۰ در سال غیرکبیسه ۱۴۰۴
  const nonLeapEsfand30 = parseDateToLocalComponents('1404/12/30');
  assert.equal(nonLeapEsfand30, null, '۳۰ اسفند در سال غیرکبیسه باید null برگرداند');

  // روز ۳۲
  const day32Res = parseDateToLocalComponents('1403/01/32');
  assert.equal(day32Res, null, 'روز ۳۲ باید null برگرداند');
});

// =========================================================================
// ۶. آزمون اعتبارسنجی تاریخ در curriculumLoader
// =========================================================================
runTest('۶. اعتبارسنجی جامع تاریخ جلالی در curriculumLoader', () => {
  // تاریخ معتبر
  const validCheck = validateJalaliDateDetails('1403/10/15');
  assert.equal(validCheck.valid, true);

  // اسفند ۳۰ در سال کبیسه ۱۴۰۳
  const leapCheck = validateJalaliDateDetails('1403/12/30');
  assert.equal(leapCheck.valid, true);

  // اسفند ۳۰ در سال غیرکبیسه ۱۴۰۴
  const nonLeapCheck = validateJalaliDateDetails('1404/12/30');
  assert.equal(nonLeapCheck.valid, false);
  assert.ok(nonLeapCheck.reason?.includes('کبیسه'), 'پیام خطا باید به کبیسه نبودن اشاره کند');

  // ماه ۱۳
  const m13Check = validateJalaliDateDetails('1403/13/01');
  assert.equal(m13Check.valid, false);
  assert.ok(m13Check.reason?.includes('ماه'));

  // روز صفر
  const d0Check = validateJalaliDateDetails('1403/05/00');
  assert.equal(d0Check.valid, false);
  assert.ok(d0Check.reason?.includes('صفر'));

  // روز ۳۱ در ماه مهر
  const mehr31Check = validateJalaliDateDetails('1403/07/31');
  assert.equal(mehr31Check.valid, false);
  assert.ok(mehr31Check.reason?.includes('30') || mehr31Check.reason?.includes('۳۰'));

  // تابع دودویی isValidJalaliDate
  assert.equal(isValidJalaliDateInLoader('1403/10/15'), true);
  assert.equal(isValidJalaliDateInLoader('1404/12/30'), false);
  assert.equal(isValidJalaliDateInLoader('1403/13/01'), false);
});

// =========================================================================
// ۷. رفتار خروجی ICS در مواجهه با درس دارای تاریخ نامعتبر (رد رویداد و ارسال هشدار)
// =========================================================================
runTest('۷. رد رویداد نامعتبر در generateICSContent و تولید پیام هشدار شفاف', () => {
  const dummyCourseValid: Course = {
    id: 'test-c1',
    code: '1001',
    name: 'درس فیزیولوژی',
    units: { total: 2, theory: 2, practical: 0 },
    theorySchedule: [
      { day: 'شنبه', startTime: '08:00', endTime: '10:00', label: 'نظری' },
    ],
    finalExam: {
      date: '1403/10/20', // معتبر
      time: '08:30',
      type: 'final',
    },
  } as unknown as Course;

  const dummyCourseInvalid: Course = {
    id: 'test-c2',
    code: '1002',
    name: 'درس با امتحان تاریخ معیوب',
    units: { total: 2, theory: 2, practical: 0 },
    theorySchedule: [
      { day: 'یکشنبه', startTime: '10:00', endTime: '12:00', label: 'نظری' },
    ],
    finalExam: {
      date: '1404/12/30', // نامعتبر چون سال ۱۴۰۴ اسفند ۳۰ ندارد
      time: '10:00',
      type: 'final',
    },
    midtermExam: {
      date: '1403/13/05', // نامعتبر چون ماه ۱۳ وجود ندارد
      time: '08:30',
      type: 'midterm',
    },
  } as unknown as Course;

  const result = generateICSContent(
    [dummyCourseValid, dummyCourseInvalid],
    'male',
    {},
    { includeWeeklyClasses: true, includeMidtermExams: true, includeFinalExams: true }
  );

  // ۱. فایل خروجی تولید شده
  assert.ok(result.content.includes('BEGIN:VCALENDAR'));
  assert.ok(result.content.includes('END:VCALENDAR'));

  // ۲. رویداد معتبر درس ۱ در گاهشمار درج شده
  assert.ok(result.content.includes('امتحان پایان‌ترم درس فیزیولوژی'));

  // ۳. رویدادهای نامعتبر درس ۲ نباید در متن تقویم درج شده باشند
  assert.ok(!result.content.includes('امتحان پایان‌ترم درس با امتحان تاریخ معیوب'));
  assert.ok(!result.content.includes('امتحان میان‌ترم درس با امتحان تاریخ معیوب'));

  // ۴. هشدارهای مرتبط با درس نامعتبر در لیست هشدارها موجود است
  assert.equal(result.warnings.length, 2, 'باید دقیقاً دو هشدار برای میان‌ترم و پایان‌ترم ثبت شده باشد');
  assert.ok(result.warnings.some((w) => w.eventType === 'final' && w.rawDate === '1404/12/30'));
  assert.ok(result.warnings.some((w) => w.eventType === 'midterm' && w.rawDate === '1403/13/05'));
});

// =========================================================================
// ۸. آزمون اعتبارسنجی رشته واقعی RFC 5545، فیلدهای DTSTART/DTEND، تایم‌زون و آلارم
// =========================================================================
runTest('۸. ارزیابی دقیق ساختار RFC 5545، ترتیب زمانی DTEND پس از DTSTART و شناسه زمان محلی Asia/Tehran', () => {
  const courseWithSchedule: Course = {
    id: 'c-rfc',
    code: '9901',
    name: 'آناتومی بالینی',
    instructors: 'دکتر علوی',
    units: { total: 3, theory: 2, practical: 1 },
    theorySchedule: [
      { day: 'شنبه', startTime: '08:00', endTime: '10:00', label: 'نظری' },
    ],
    finalExam: {
      date: '1403/10/25',
      time: '09:00',
      type: 'final',
    },
  } as unknown as Course;

  const res = generateICSContent([courseWithSchedule], 'male', {}, {
    includeWeeklyClasses: true,
    includeFinalExams: true,
    addAlarm: true,
    alarmMinutesBefore: 15,
  });

  const ics = res.content;

  // ۱. سربرگ و استاندارد کلی
  assert.ok(ics.includes('BEGIN:VCALENDAR'), 'باید تگ آغاز گاهشمار موجود باشد');
  assert.ok(ics.includes('VERSION:2.0'), 'نسخه استاندارد گاهشمار باید 2.0 باشد');
  assert.ok(ics.includes('BEGIN:VTIMEZONE'), 'بخش بلوک VTIMEZONE باید وجود داشته باشد');
  assert.ok(ics.includes('TZID:Asia/Tehran'), 'شناسه تایم‌زون باید Asia/Tehran باشد');

  // ۲. فرمت زمان شروع و پایان کلاس هفتگی
  assert.ok(ics.includes('RRULE:FREQ=WEEKLY;COUNT=16;BYDAY=SA'), 'قاعده تکرار هفتگی شنبه‌ها');
  assert.ok(ics.includes('DTSTART;TZID=Asia/Tehran:'), 'DTSTART با پارامتر تایم‌زون محلی');
  assert.ok(ics.includes('DTEND;TZID=Asia/Tehran:'), 'DTEND با پارامتر تایم‌زون محلی');

  // ۳. بررسی تاریخ تبدیل‌شده امتحان (1403/10/25 جلالی = 2025/01/14 میلادی)
  // ساعت ۹ تا ۱۱ (۲ ساعت پس از شروع)
  assert.ok(ics.includes('DTSTART;TZID=Asia/Tehran:20250114T090000'), 'شروع امتحان پایان‌ترم در تاریخ میلادی دقیق');
  assert.ok(ics.includes('DTEND;TZID=Asia/Tehran:20250114T110000'), 'پایان امتحان پایان‌ترم دقیقا پس از ۲ ساعت');

  // ۴. بررسی وجود VALARM
  assert.ok(ics.includes('BEGIN:VALARM'), 'باید یادآور صوتی/نمایشی وجود داشته باشد');
  assert.ok(ics.includes('TRIGGER:-PT15M'), 'تریگر هشدار کلاس قبل از ۱۵ دقیقه');
  assert.ok(ics.includes('END:VCALENDAR'), 'باید تگ پایان گاهشمار موجود باشد');
});

// =========================================================================
// ۹. آزمون پایداری شناسه‌ها (Stable UID) در خروجی‌های متوالی و عدم وابستگی به زمان
// =========================================================================
runTest('۹. پایداری و یکتایی UID در خروجی‌های متوالی برای جلوگیری از ایجاد رویدادهای تکراری', () => {
  const courseA: Course = {
    id: 'course-stable-1',
    code: '1106',
    name: 'بیوشیمی بالینی',
    theorySchedule: [{ day: 'یکشنبه', startTime: '10:00', endTime: '12:00', label: 'نظری' }],
    finalExam: { date: '1403/10/20', time: '10:00', type: 'final' },
    midtermExam: { date: '1403/08/15', time: '08:30', type: 'midterm' },
  } as unknown as Course;

  // خروجی نوبت اول
  const res1 = generateICSContent([courseA], 'male', {});
  // خروجی نوبت دوم (حتی با تاخیر زمانی)
  const res2 = generateICSContent([courseA], 'male', {});

  const extractUids = (text: string) => {
    const matches = text.match(/UID:[^\r\n]+/g) || [];
    return matches.sort();
  };

  const uids1 = extractUids(res1.content);
  const uids2 = extractUids(res2.content);

  assert.equal(uids1.length, 3, 'باید ۳ رویداد (کلاس، میانترم، پایانترم) وجود داشته باشد');
  assert.deepEqual(uids1, uids2, 'UIDهای تولید شده در دو بار خروجی متوالی باید کاملاً یکسان باشند');
  assert.ok(!uids1[0].includes('undefined'));
  assert.ok(uids1.some((u) => u.includes('class-course-stable-1')));
  assert.ok(uids1.some((u) => u.includes('exam-midterm-course-stable-1-14030815')));
  assert.ok(uids1.some((u) => u.includes('exam-final-course-stable-1-14031020')));
});

// =========================================================================
// ۱۰. آزمون تفکیک رویدادهای تمام‌روزه (VALUE=DATE) از رویدادهای ساعت‌دار (DATE-TIME)
// =========================================================================
runTest('۱۰. آزمون تمایز رویداد تمام‌روزه (امتحان بدون ساعت) و رعایت مرز انحصاری DTEND روز بعد', () => {
  const courseNoTime: Course = {
    id: 'course-notime',
    code: '1107',
    name: 'روانشناسی سلامت',
    theorySchedule: [],
    finalExam: {
      date: '1403/10/25', // 2025-01-14
      time: undefined, // بدون ساعت مشخص
      type: 'final',
    },
  } as unknown as Course;

  const res = generateICSContent([courseNoTime], 'male', {}, { includeWeeklyClasses: false });
  const ics = res.content;

  // باید از قالب VALUE=DATE استفاده کند
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20250114'), 'فرمت تمام‌روزه DTSTART در تاریخ میلادی');
  assert.ok(ics.includes('DTEND;VALUE=DATE:20250115'), 'فرمت تمام‌روزه DTEND باید مرز انحصاری روز بعد (20250115) باشد');
  assert.ok(!ics.includes('DTSTART;TZID=Asia/Tehran:20250114T'), 'نباید از DATE-TIME زمانی برای امتحان بدون ساعت استفاده شود');
});

// =========================================================================
// ۱۱. آزمون شکست خطوط فارسی بر پایه بایت‌های UTF-8 (Octet-based foldLine)
// =========================================================================
runTest('۱۱. آزمون شکست خطوط طولانی فارسی در مرز حداکثر ۷۵ بایت بدون نصف کردن کاراکترهای چندبایتی', () => {
  const longPersianString = 'DESCRIPTION:آزمون نهایی متمرکز و هماهنگ درس علوم تشریح سیستم ادراری تناسلی با تدریس اساتید مجرب گروه علوم تشریح و آسیب‌شناسی دانشگاه علوم پزشکی تهران در سالن آزمون‌های الکترونیک شماره ۲ دانشکده پزشکی';

  const folded = foldLine(longPersianString);
  const lines = folded.split('\r\n');

  assert.ok(lines.length > 1, 'متن طولانی باید به چند خط تقسیم شود');

  const encoder = new TextEncoder();
  lines.forEach((l, idx) => {
    const byteLen = encoder.encode(l).length;
    assert.ok(byteLen <= 75, `خط شماره ${idx + 1} با طول ${byteLen} بایت باید کمتر یا مساوی ۷۵ بایت باشد`);
    if (idx > 0) {
      assert.ok(l.startsWith(' '), 'خطوط ادامه طبق RFC 5545 باید با یک فاصله (Space) آغاز شوند');
    }
  });

  // بازسازی متن پس از un-folding
  const reconstructed = folded.replace(/\r\n /g, '');
  assert.equal(reconstructed, longPersianString, 'متن پس از بازسازی و حذف فواصل continuation باید کاملاً حفظ شود');

  // آزمون escaping کاراکترهای خاص
  const specialText = 'درس، اول; بخش دوم \\ نکته مهم\nخط دوم';
  const escaped = escapeICSText(specialText);
  assert.ok(escaped.includes('\\,'));
  assert.ok(escaped.includes('\\;'));
  assert.ok(escaped.includes('\\\\'));
  assert.ok(escaped.includes('\\n'));
  assert.ok(!escaped.includes('\n'), 'کاراکتر newline نباید بدون اسکیپ در متن خروجی باقی بماند');
});

// =========================================================================
// ۱۲. آزمون تاریخ شروع ترم (عدم Fallback خاموش به تاریخ امروز و محاسبه دقیق روز اول)
// =========================================================================
runTest('۱۲. آزمون تنظیم صریح و محاسبه هوشمند تاریخ شروع ترم بر اساس تقویم آموزشی', () => {
  const courseSchedule: Course = {
    id: 'course-sem-1',
    code: '1108',
    name: 'جنین‌شناسی',
    theorySchedule: [{ day: 'دوشنبه', startTime: '08:00', endTime: '10:00', label: 'نظری' }],
  } as unknown as Course;

  // نیمسال اول ۱۴۰۳ با تاریخ صریح ۱ مهر ۱۴۰۳ (2024-09-22 یکشنبه است، پس اولین دوشنبه 2024-09-23 است)
  const resFall = generateICSContent([courseSchedule], 'male', {}, {
    customSemesterStartDateJalali: '1403/07/01',
    semesterWeeks: 16,
  });

  assert.ok(resFall.content.includes('DTSTART;TZID=Asia/Tehran:20240923T080000'), 'اولین جلسه دوشنبه بعد از ۱ مهر باید 2024-09-23 باشد');

  // نیمسال دوم با تاریخ صریح ۱۵ بهمن ۱۴۰۳ (2025-02-03 دوشنبه است)
  const resSpring = generateICSContent([courseSchedule], 'male', {}, {
    customSemesterStartDateJalali: '1403/11/15',
    semesterWeeks: 14,
  });

  assert.ok(resSpring.content.includes('DTSTART;TZID=Asia/Tehran:20250203T080000'), 'اولین جلسه دوشنبه در شروع ترم بهمن باید 2025-02-03 باشد');
  assert.ok(resSpring.content.includes('RRULE:FREQ=WEEKLY;COUNT=14;BYDAY=MO'), 'قاعده تکرار ۱۴ هفته‌ای برای دوشنبه‌ها');
});

console.log(`\n========================================`);
console.log(`نتیجه آزمون‌ها: ${passedTests} از ${totalTests} آزمون با موفقیت پاس شدند.`);
console.log(`========================================\n`);

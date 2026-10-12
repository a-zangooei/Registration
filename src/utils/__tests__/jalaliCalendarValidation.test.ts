import assert from 'node:assert/strict';
import {
  isLeapJalaliYear,
  getJalaliDaysInMonth,
  isValidJalaliDate,
  jalaliToGregorian,
  parseDateToLocalComponents,
  generateICSContent,
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

console.log(`\n========================================`);
console.log(`نتیجه آزمون‌ها: ${passedTests} از ${totalTests} آزمون با موفقیت پاس شدند.`);
console.log(`========================================\n`);

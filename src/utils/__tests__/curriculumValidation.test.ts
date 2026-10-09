import assert from 'node:assert';
import { validateCurriculumJson, parseCurriculumJson, DEFAULT_CURRICULUM } from '../../data/curriculumLoader';

console.log('--- Running Curriculum Structural & Semantic Validation Test Suite ---\n');

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

// Base minimal valid dataset generator
function createBaseValidDataset() {
  return {
    id: 'test-curriculum-1',
    title: 'دوره آزمایشی معتبر',
    academicYear: '۱۴۰۳-۱۴۰۴',
    termNumber: 5,
    minUnits: 12,
    maxUnits: 20,
    externalPassedCourses: ['PASS-001', 'PASS-002'],
    courses: [
      {
        id: 'c1',
        code: '1001',
        name: 'درس یک',
        units: { total: 2, theory: 2, practical: 0 },
        prerequisites: ['PASS-001'],
        theorySchedule: [
          { day: 'شنبه', startTime: '08:00', endTime: '10:00', label: 'نظری' },
        ],
      },
      {
        id: 'c2',
        code: '1002',
        name: 'درس دو',
        units: { total: 1.5, theory: 1, practical: 0.5 },
        prerequisites: ['1001'],
        corequisites: ['1001'],
        practicalGroups: [
          {
            id: 'c2_g1',
            name: 'گروه یک',
            slots: [
              { day: 'یکشنبه', startTime: '14:00', endTime: '16:00', label: 'عملی' },
            ],
          },
        ],
        midtermExam: {
          date: '1403/08/20',
          startTime: '10:00',
          endTime: '12:00',
          type: 'midterm',
        },
        finalExam: {
          date: '1403/10/25',
          startTime: '08:30',
          endTime: '10:30',
          type: 'final',
        },
      },
    ],
  };
}

// ۱. دیتاست معتبر (شامل دیتاست پیش‌فرض پروژه و دیتاست پایه تستی)
runTest('۱. پذیرش دیتاست رسمی پیش‌فرض پروژه (DEFAULT_CURRICULUM)', () => {
  const result = validateCurriculumJson(DEFAULT_CURRICULUM);
  if (!result.valid) {
    console.error('Validation errors on DEFAULT_CURRICULUM:', result.errors);
  }
  assert.strictEqual(result.valid, true, 'دیتاست رسمی پروژه باید کاملاً معتبر باشد');
  assert.strictEqual(result.errors.length, 0, 'نباید هیچ خطایی در دیتاست پیش‌فرض وجود داشته باشد');
});

runTest('۲. پذیرش دیتاست معتبر پایه', () => {
  const data = createBaseValidDataset();
  const result = validateCurriculumJson(data);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
});

// ۳. شناسه تکراری درس و کد درسی تکراری
runTest('۳. شناسایی و رد شناسه درس تکراری (Duplicate Course ID)', () => {
  const data = createBaseValidDataset();
  data.courses[1].id = 'c1'; // Duplicate with courses[0]

  const result = validateCurriculumJson(data);
  assert.strictEqual(result.valid, false, 'دیتاست با شناسه تکراری درس باید رد شود');
  assert.ok(
    result.errors.some((e) => e.includes('فیلد: id') && e.includes('تکراری است')),
    `خطا باید به فیلد id و تکراری بودن اشاره کند: ${result.errors.join(' | ')}`
  );
});

runTest('۴. شناسایی و رد کد درسی تکراری (Duplicate Course Code)', () => {
  const data = createBaseValidDataset();
  data.courses[1].code = '1001'; // Duplicate with courses[0]

  const result = validateCurriculumJson(data);
  assert.strictEqual(result.valid, false, 'دیتاست با کد درس تکراری باید رد شود');
  assert.ok(
    result.errors.some((e) => e.includes('فیلد: code') && e.includes('تکراری است')),
    `خطا باید به فیلد code و تکراری بودن اشاره کند: ${result.errors.join(' | ')}`
  );
});

// ۵. واحد منفی
runTest('۵. شناسایی و رد واحدهای منفی (Negative Units)', () => {
  const data = createBaseValidDataset();
  data.courses[0].units.total = -2;
  data.courses[0].units.theory = -1;

  const result = validateCurriculumJson(data);
  assert.strictEqual(result.valid, false, 'دیتاست با واحد منفی باید رد شود');
  assert.ok(
    result.errors.some((e) => e.includes('units.total') && e.includes('منفی')),
    `خطا باید به منفی بودن واحد کل اشاره کند: ${result.errors.join(' | ')}`
  );
  assert.ok(
    result.errors.some((e) => e.includes('units.theory') && e.includes('منفی')),
    `خطا باید به منفی بودن واحد نظری اشاره کند: ${result.errors.join(' | ')}`
  );
});

// ۶. تاریخ نامعتبر امتحان
runTest('۶. شناسایی و رد تاریخ نامعتبر امتحان (Invalid Exam Date)', () => {
  const data = createBaseValidDataset();
  data.courses[1].finalExam!.date = '1403/13/45'; // ماه ۱۳ و روز ۴۵ نامعتبر است

  const result = validateCurriculumJson(data);
  assert.strictEqual(result.valid, false, 'دیتاست با تاریخ نامعتبر امتحان باید رد شود');
  assert.ok(
    result.errors.some((e) => e.includes('فیلد: date') && e.includes('نامعتبر است')),
    `خطا باید نامعتبر بودن تاریخ را گزارش کند: ${result.errors.join(' | ')}`
  );
});

runTest('۷. شناسایی تاریخ با ساختار نامتعارف غیرشمسی', () => {
  const data = createBaseValidDataset();
  data.courses[1].finalExam!.date = 'invalid-date-string';

  const result = validateCurriculumJson(data);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('فیلد: date')));
});

// ۸. پیش‌نیاز ناموجود (Dangling/unresolved prerequisite)
runTest('۸. شناسایی و رد پیش‌نیاز ناموجود (Missing Prerequisite Code)', () => {
  const data = createBaseValidDataset();
  data.courses[0].prerequisites = ['9999999']; // کد ۹۹۹۹۹۹۹ نه در دوره است و نه در externalPassedCourses

  const result = validateCurriculumJson(data);
  assert.strictEqual(result.valid, false, 'پیش‌نیاز ناموجود باید به عنوان خطای ارجاعی شناخته شود');
  assert.ok(
    result.errors.some(
      (e) => e.includes('فیلد: prerequisites') && e.includes('9999999') && e.includes('ناموجود')
    ),
    `خطا باید کد پیش‌نیاز ناموجود را گزارش کند: ${result.errors.join(' | ')}`
  );
});

runTest('۹. پذیرش پیش‌نیاز هنگامی که در externalPassedCourses تعریف شده باشد', () => {
  const data = createBaseValidDataset();
  data.courses[0].prerequisites = ['EXTERNAL-PASS'];
  data.externalPassedCourses = ['EXTERNAL-PASS'];

  const result = validateCurriculumJson(data);
  assert.strictEqual(result.valid, true, 'پیش‌نیاز تعریف‌شده در externalPassedCourses باید معتبر باشد');
});

// ۱۰. فیلد الزامی حذف‌شده
runTest('۱۰. شناسایی و رد حذف فیلدهای الزامی در سطح ریشه (Missing Root Required Fields)', () => {
  const data: any = createBaseValidDataset();
  delete data.id;
  delete data.title;
  delete data.courses;

  const result = validateCurriculumJson(data);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('فیلد: id')));
  assert.ok(result.errors.some((e) => e.includes('فیلد: title')));
  assert.ok(result.errors.some((e) => e.includes('فیلد: courses')));
});

runTest('۱۱. شناسایی و رد حذف فیلدهای الزامی در درس (Missing Course Required Fields)', () => {
  const data: any = createBaseValidDataset();
  delete data.courses[0].id;
  delete data.courses[0].code;
  delete data.courses[0].name;
  delete data.courses[0].units;

  const result = validateCurriculumJson(data);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('فیلد: id')));
  assert.ok(result.errors.some((e) => e.includes('فیلد: code')));
  assert.ok(result.errors.some((e) => e.includes('فیلد: name')));
  assert.ok(result.errors.some((e) => e.includes('فیلد: units')));
});

// ۱۲. فیلد اختیاری حذف‌شده (باید همچنان معتبر باشد و خطا ندهد)
runTest('۱۲. پذیرش دیتاست حتی در صورت حذف تمام فیلدهای اختیاری (Missing Optional Fields)', () => {
  const minimalData = {
    id: 'minimal-curriculum',
    title: 'دوره حداقل',
    // تمام فیلدهای اختیاری ریشه حذف شدند:
    // academicYear, termNumber, minUnits, maxUnits, description, externalPassedCourses
    courses: [
      {
        id: 'min-c1',
        code: '101',
        name: 'درس بدون فیلدهای اختیاری',
        units: { total: 3 },
        // تمام فیلدهای اختیاری درس حذف شدند:
        // term, courseTypeString, category, instructors, theorySchedule, practicalGroups,
        // midtermExam, finalExam, prerequisites, corequisites, genderSchedules, colorBadge
      },
    ],
  };

  const result = validateCurriculumJson(minimalData);
  if (!result.valid) {
    console.error('Errors on minimal dataset:', result.errors);
  }
  assert.strictEqual(result.valid, true, 'حذف فیلدهای اختیاری نباید موجب رد دیتاست شود');
  assert.strictEqual(result.errors.length, 0);
});

// ۱۳. خطای زمان‌بندی: ساعت شروع بعد از ساعت پایان
runTest('۱۳. شناسایی و رد ساعت شروع بزرگتر یا مساوی پایان (Start Time >= End Time)', () => {
  const data = createBaseValidDataset();
  data.courses[0].theorySchedule = [
    { day: 'شنبه', startTime: '12:00', endTime: '10:00', label: 'نظری' }, // شروع دیرتر از پایان!
  ];

  const result = validateCurriculumJson(data);
  assert.strictEqual(result.valid, false);
  assert.ok(
    result.errors.some((e) => e.includes('فیلد: time') && e.includes('ساعت شروع')),
    `خطا باید به تناقض ساعت شروع و پایان اشاره کند: ${result.errors.join(' | ')}`
  );
});

// ۱۴. هم‌نیاز ناموجود و ارجاع درس به خود
runTest('۱۴. شناسایی و رد هم‌نیاز ناموجود یا ارجاع درس به خودش', () => {
  const data = createBaseValidDataset();
  data.courses[0].corequisites = ['999999']; // ناموجود
  data.courses[1].prerequisites = [data.courses[1].code]; // ارجاع به خود

  const result = validateCurriculumJson(data);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('هم‌نیاز «999999» ناموجود است')));
  assert.ok(result.errors.some((e) => e.includes('نمی‌تواند پیش‌نیاز خودش باشد')));
});

// ۱۵. تست parseCurriculumJson با رشته متنی و گزارش دقیق خطا
runTest('۱۵. عملکرد شفاف parseCurriculumJson در برابر داده‌های نامعتبر بدون جایگزینی خاموش', () => {
  const invalidJson = JSON.stringify({
    id: 'broken',
    title: 'شکسته',
    courses: [
      {
        id: 'b1',
        code: '10',
        name: 'درس',
        units: { total: -5 },
      },
    ],
  });

  const parsed = parseCurriculumJson(invalidJson);
  assert.strictEqual(parsed.curriculum, null, 'دیتاست نامعتبر نباید بارگذاری شود');
  assert.ok(parsed.error !== null, 'باید پیام خطا برگردانده شود');
  assert.ok(parsed.error!.includes('units.total'), 'پیام خطا باید مشخصاً به واحد کل منفی اشاره کند');
});

// ۱۶. تطابق کامل فراداده مانیفست و فایل‌های دیتاست بدون هیچ‌گونه تناقض
runTest('۱۶. عدم تناقض فراداده manifest.json و دیتاست‌های پروژه', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const manifestPath = path.resolve('public/datasets/manifest.json');
  const datasetPath = path.resolve('src/data/datasets/term-05-fall-1403.json');
  const publicDatasetPath = path.resolve('public/datasets/term-05-fall-1403.json');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  const publicDataset = JSON.parse(fs.readFileSync(publicDatasetPath, 'utf8'));

  assert.ok(Array.isArray(manifest) && manifest.length > 0, 'مانیفست باید یک آرایه غیرخالی باشد');
  const defaultItem = manifest.find((m: any) => m.id === dataset.id);
  assert.ok(defaultItem, 'دیتاست پیش‌فرض باید در مانیفست وجود داشته باشد');

  // بررسی عدم تناقض فیلدهای کلیدی
  assert.strictEqual(defaultItem.id, dataset.id, 'شناسه باید در مانیفست و دیتاست یکسان باشد');
  assert.strictEqual(defaultItem.title, dataset.title, 'عنوان باید در مانیفست و دیتاست یکسان باشد');
  assert.strictEqual(defaultItem.academicYear, dataset.academicYear, 'سال تحصیلی باید یکسان باشد');
  assert.strictEqual(defaultItem.termNumber, dataset.termNumber, 'شماره ترم باید یکسان باشد');
  assert.strictEqual(defaultItem.version, dataset.version, 'نسخه داده باید یکسان باشد');
  assert.strictEqual(defaultItem.lastReviewed, dataset.lastReviewed, 'تاریخ آخرین بررسی باید یکسان باشد');
  assert.strictEqual(defaultItem.source, dataset.source, 'منبع داده باید یکسان باشد');
  assert.strictEqual(defaultItem.verificationStatus, dataset.verificationStatus, 'وضعیت صحت‌سنجی باید یکسان باشد');

  // تطابق کامل بین src/data/datasets و public/datasets
  assert.strictEqual(dataset.id, publicDataset.id);
  assert.strictEqual(dataset.maxUnits, publicDataset.maxUnits, 'سقف واحدها در هر دو نسخه دیتاست باید یکسان باشد');
});

// ۱۷. اعتبارسنجی فیلدهای فراداده استاندارد ممیزی
runTest('۱۷. بررسی فیلدهای استاندارد ممیزی و نسخه در DEFAULT_CURRICULUM', () => {
  assert.strictEqual(DEFAULT_CURRICULUM.id, 'med-term5-fall-1403');
  assert.strictEqual(DEFAULT_CURRICULUM.version, '1.1.0');
  assert.strictEqual(DEFAULT_CURRICULUM.lastReviewed, '1403/07/15');
  assert.strictEqual(DEFAULT_CURRICULUM.source, 'برنامه آموزشی رسمی دانشکده پزشکی');
  assert.strictEqual(DEFAULT_CURRICULUM.verificationStatus, 'needs_review');
  assert.ok(DEFAULT_CURRICULUM.reviewNotes && DEFAULT_CURRICULUM.reviewNotes.length > 0);
});

// ۱۸. ممیزی سازگاری تقویمی تاریخ امتحانات
runTest('۱۸. ممیزی تاریخ‌های امتحانات و مستندسازی تناقض سال ۱۴۰۵ در برابر سال تحصیلی ۱۴۰۳', () => {
  // تمام تاریخ‌های امتحانات موجود باید فرمت معتبر شمسی داشته باشند
  const examDates = DEFAULT_CURRICULUM.courses
    .flatMap((c) => [c.midtermExam?.date, c.finalExam?.date])
    .filter((d): d is string => Boolean(d));

  assert.ok(examDates.length > 0, 'باید تاریخ‌های امتحان در دیتاست وجود داشته باشد');
  for (const date of examDates) {
    // همه تاریخ‌ها با سال ۱۴۰۵ شروع می‌شوند
    assert.ok(date.startsWith('1405/'), `تاریخ ${date} باید مطابق داده‌های فعلی ثبت شده باشد`);
  }

  // وضعیت ممیزی باید صریحاً needs_review باشد تا کاربر از عدم قطعیت سال امتحانات آگاه باشد
  assert.strictEqual(DEFAULT_CURRICULUM.verificationStatus, 'needs_review');
});

console.log(`\n-----------------------------------------------------------`);
console.log(`Curriculum Validation Results: ${passedTests}/${totalTests} tests passed successfully.`);
console.log(`-----------------------------------------------------------\n`);

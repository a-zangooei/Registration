import assert from 'node:assert';
import { Course, StudentSelections } from '../../types';
import {
  checkExamConflicts,
  checkTwoCoursesConflict,
  normalizeJalaliDate,
  parseExamTime,
  toEnglishDigits,
  calculateConflictStats,
  checkCoursePrerequisites,
  evaluateAllConflicts,
  getHoverConflicts,
  getInstantUnselectedConflicts,
} from '../conflictDetector';

// Helper mock course factory
function createMockCourse(overrides: Partial<Course>): Course {
  return {
    id: overrides.id || 'test-c1',
    code: overrides.code || '100000',
    name: overrides.name || 'درس آزمایشی',
    term: overrides.term || 3,
    courseTypeString: 'الزامی پایه',
    category: 'specialized',
    units: { total: 2, theory: 2, practical: 0 },
    instructors: 'استاد تست',
    prerequisites: [],
    theorySchedule: [],
    practicalGroups: [],
    examStatusDescription: 'وضعیت آزمون',
    colorBadge: {
      bg: 'bg-teal-600',
      border: 'border-teal-500',
      text: 'text-teal-700',
      lightBg: 'bg-teal-50',
    },
    ...overrides,
  };
}

const defaultSelections: StudentSelections = {
  selectedCourseIds: [],
  selectedPracticalGroups: {},
  gender: 'male',
  minUnits: 12,
  maxUnits: 20,
};

console.log('--- Running Exam Conflict Logic Test Suite ---\n');

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

// 1. آزمون: دو امتحان در تاریخ یکسان و ساعت یکسان
runTest('۱. دو امتحان در تاریخ یکسان و ساعت یکسان -> تداخل قطعی (error)', () => {
  const courseA = createMockCourse({
    id: 'c1',
    name: 'آناتومی',
    finalExam: {
      date: '1405/11/06',
      time: '08:30',
      type: 'final',
    },
  });

  const courseB = createMockCourse({
    id: 'c2',
    name: 'فیزیولوژی',
    finalExam: {
      date: '1405/11/06',
      time: '08:30',
      type: 'final',
    },
  });

  const conflicts = checkExamConflicts(courseA, courseB);
  assert.strictEqual(conflicts.length, 1, 'باید دقیقاً ۱ تداخل گزارش شود');
  assert.strictEqual(conflicts[0].severity, 'error', 'شدت تداخل باید error باشد');
  assert.strictEqual(conflicts[0].type, 'exam_date');
  assert(conflicts[0].title.includes('تداخل'), 'عنوان باید حاوی تداخل باشد');
});

// 2. آزمون: دو امتحان در یک روز با ساعتهای غیرهمپوشان
runTest('۲. دو امتحان در یک روز با ساعتهای غیرهمپوشان -> بدون تداخل', () => {
  const courseA = createMockCourse({
    id: 'c1',
    name: 'بیوشیمی',
    finalExam: {
      date: '1405/11/06',
      time: '08:00 - 10:00',
      type: 'final',
    },
  });

  const courseB = createMockCourse({
    id: 'c2',
    name: 'ژنتیک',
    finalExam: {
      date: '1405/11/06',
      time: '14:00 - 16:00',
      type: 'final',
    },
  });

  const conflicts = checkExamConflicts(courseA, courseB);
  assert.strictEqual(conflicts.length, 0, 'نباید هیچ تداخلی وجود داشته باشد');
});

// 3. آزمون: دو امتحان با همپوشانی جزئی
runTest('۳. دو امتحان با همپوشانی جزئی -> تداخل قطعی (error)', () => {
  const courseA = createMockCourse({
    id: 'c1',
    name: 'بافت‌شناسی',
    finalExam: {
      date: '1405/11/10',
      time: '10:00 - 12:00',
      type: 'final',
    },
  });

  const courseB = createMockCourse({
    id: 'c2',
    name: 'جنین‌شناسی',
    finalExam: {
      date: '1405/11/10',
      time: '11:30 - 13:30',
      type: 'final',
    },
  });

  const conflicts = checkExamConflicts(courseA, courseB);
  assert.strictEqual(conflicts.length, 1, 'باید ۱ تداخل گزارش شود');
  assert.strictEqual(conflicts[0].severity, 'error');
  assert(conflicts[0].description.includes('تداخل ساعت'));
});

// 4. آزمون: امتحان پایانترم یک درس همزمان با میانترم درس دیگر
runTest('۴. امتحان پایانترم یک درس همزمان با میانترم درس دیگر -> تداخل قطعی (error)', () => {
  const courseA = createMockCourse({
    id: 'c1',
    name: 'ایمنی‌شناسی',
    finalExam: {
      date: '1405/09/20',
      time: '10:00 - 12:00',
      type: 'final',
    },
  });

  const courseB = createMockCourse({
    id: 'c2',
    name: 'ویروس‌شناسی',
    midtermExam: {
      date: '1405/09/20',
      time: '10:00 - 12:00',
      type: 'midterm',
    },
  });

  const conflicts = checkExamConflicts(courseA, courseB);
  assert.strictEqual(conflicts.length, 1, 'باید تداخل میانترم و پایانترم پیدا شود');
  assert.strictEqual(conflicts[0].severity, 'error');
  assert(conflicts[0].title.includes('پایان‌ترم و میان‌ترم'));
});

// 5. آزمون: امتحان در دو تاریخ متفاوت
runTest('۵. امتحان در دو تاریخ متفاوت -> بدون تداخل', () => {
  const courseA = createMockCourse({
    id: 'c1',
    name: 'انگل‌شناسی',
    finalExam: {
      date: '1405/11/05',
      time: '08:30',
      type: 'final',
    },
  });

  const courseB = createMockCourse({
    id: 'c2',
    name: 'قارچ‌شناسی',
    finalExam: {
      date: '1405/11/06',
      time: '08:30',
      type: 'final',
    },
  });

  const conflicts = checkExamConflicts(courseA, courseB);
  assert.strictEqual(conflicts.length, 0, 'در دو تاریخ مختلف نباید تداخلی باشد');
});

// 6. آزمون: امتحان بدون ساعت معتبر
runTest('۶. امتحان بدون ساعت معتبر -> اطلاعات ناکافی (warning)', () => {
  const courseA = createMockCourse({
    id: 'c1',
    name: 'فارماکولوژی',
    finalExam: {
      date: '1405/11/12',
      time: '09:00',
      type: 'final',
    },
  });

  const courseB = createMockCourse({
    id: 'c2',
    name: 'پاتولوژی',
    finalExam: {
      date: '1405/11/12',
      time: '', // بدون ساعت معتبر
      type: 'final',
    },
  });

  const conflicts = checkExamConflicts(courseA, courseB);
  assert.strictEqual(conflicts.length, 1, 'باید هشدار اطلاعات ناکافی گزارش شود');
  assert.strictEqual(conflicts[0].severity, 'warning', 'باید سطح warning باشد');
  assert(conflicts[0].title.includes('اطلاعات ناکافی'));
});

// 7. آزمون: امتحانهایی که دقیقاً پشت سر هم قرار دارند
runTest('۷. امتحانهایی که دقیقاً پشت سر هم قرار دارند (۱۰-۱۲ و ۱۲-۱۴) -> بدون تداخل', () => {
  const courseA = createMockCourse({
    id: 'c1',
    name: 'فیزیک پزشکی',
    finalExam: {
      date: '1405/11/15',
      time: '10:00 - 12:00',
      type: 'final',
    },
  });

  const courseB = createMockCourse({
    id: 'c2',
    name: 'روانشناسی',
    finalExam: {
      date: '1405/11/15',
      time: '12:00 - 14:00',
      type: 'final',
    },
  });

  const conflicts = checkExamConflicts(courseA, courseB);
  assert.strictEqual(conflicts.length, 0, 'آزمون‌های مرزی متصل نباید تداخل داشته باشند');
});

// 8. آزمون: نرمال‌سازی ارقام فارسی و تاریخ‌های شمسی با اسلش و خط تیره
runTest('۸. نرمال‌سازی تاریخ‌های شمسی و ساعت با ارقام فارسی', () => {
  const norm1 = normalizeJalaliDate('۱۴۰۵/۸/۳۰');
  const norm2 = normalizeJalaliDate('1405-08-30');
  assert.strictEqual(norm1, '1405/08/30');
  assert.strictEqual(norm2, '1405/08/30');
  assert.strictEqual(norm1, norm2);

  const parsedTime = parseExamTime({ time: '۰۸:۳۰ تا ۱۰:۳۰' });
  assert.strictEqual(parsedTime.hasValidTime, true);
  assert.strictEqual(parsedTime.hasEndTime, true);
  assert.strictEqual(parsedTime.startMinutes, 510);
  assert.strictEqual(parsedTime.endMinutes, 630);
});

// 9. آزمون رگرسیون: عدم اختلال در تداخل هفتگی کلاس‌ها
runTest('۹. آزمون رگرسیون تداخل هفتگی کلاس‌ها (class_time)', () => {
  const courseA = createMockCourse({
    id: 'c1',
    name: 'درس الف',
    theorySchedule: [
      { day: 'شنبه', startTime: '08:00', endTime: '10:00' },
    ],
  });

  const courseB = createMockCourse({
    id: 'c2',
    name: 'درس ب',
    theorySchedule: [
      { day: 'شنبه', startTime: '09:00', endTime: '11:00' },
    ],
  });

  const reasons = checkTwoCoursesConflict(courseA, courseB, defaultSelections);
  const classConflicts = reasons.filter((r) => r.type === 'class_time');
  assert.strictEqual(classConflicts.length, 1, 'تداخل کلاسی شنبه باید حفظ شود');
});

// 10. آزمون تفکیک جفت‌درس یکتا از تعداد علت‌ها (عدم دوبارشماری تداخل دوطرفه)
runTest('۱۰. تفکیک تعداد تداخل‌های یکتا از تعداد علت‌های تداخل', () => {
  // درس ۱ و ۲ دارای دو علت تداخل (یک تداخل کلاس + یک تداخل امتحان) هستند
  // در نقشه تداخل متقارن، درس ۱ دارای ۲ دلیل و درس ۲ دارای ۲ دلیل است (مجموع دلایل = ۴)
  // اما تعداد جفت‌درس یکتا = ۱، تعداد بازه‌های متداخل = ۲، و تعداد دروس درگیر = ۲ است
  const conflictMap: Record<string, any[]> = {
    c1: [
      {
        type: 'class_time',
        title: 'تداخل زمانی',
        description: 'شنبه ۸-۱۰ با ۹-۱۱',
        conflictingWithCourseId: 'c2',
        conflictingWithCourseName: 'درس دو',
        details: 'شنبه: 08:00-10:00',
        intervalKey: 'c1|c2::class_time::شنبه',
      },
      {
        type: 'exam_date',
        title: 'تداخل امتحان',
        description: 'امتحان تاریخ ۱۴۰۵/۱۰/۱۵',
        conflictingWithCourseId: 'c2',
        conflictingWithCourseName: 'درس دو',
        details: 'تاریخ: 1405/10/15 | زمان: 08:30-10:30',
        intervalKey: 'c1|c2::exam_date::1405/10/15',
      },
    ],
    c2: [
      {
        type: 'class_time',
        title: 'تداخل زمانی',
        description: 'شنبه ۹-۱۱ با ۸-۱۰',
        conflictingWithCourseId: 'c1',
        conflictingWithCourseName: 'درس یک',
        details: 'شنبه: 09:00-11:00',
        intervalKey: 'c1|c2::class_time::شنبه',
      },
      {
        type: 'exam_date',
        title: 'تداخل امتحان',
        description: 'امتحان تاریخ ۱۴۰۵/۱۰/۱۵',
        conflictingWithCourseId: 'c1',
        conflictingWithCourseName: 'درس یک',
        details: 'تاریخ: 1405/10/15 | زمان: 08:30-10:30',
        intervalKey: 'c1|c2::exam_date::1405/10/15',
      },
    ],
  };

  const stats = calculateConflictStats(['c1', 'c2'], conflictMap);

  assert.strictEqual(stats.uniquePairCount, 1, 'تعداد جفت‌درس یکتا باید دقیقاً ۱ باشد (نه ۲ یا ۴)');
  assert.strictEqual(stats.affectedCourseCount, 2, 'تعداد دروس دارای تداخل باید ۲ باشد');
  assert.strictEqual(stats.totalReasonCount, 4, 'تعداد کل علت‌ها در فهرست باید ۴ باشد');
  assert.strictEqual(stats.overlappingTimeSlotCount, 2, 'تعداد بازه‌های زمانی متداخل (کلاس + امتحان) باید ۲ باشد');
});

// 11. آزمون شناسایی جفت یکتا با شناسه پایدار ID بدون تکرار معکوس A-B و B-A
runTest('۱۱. عدم وابستگی جفت یکتا به ترتیب یا نام نمایشی و شمارش منفرد', () => {
  const conflictMap: Record<string, any[]> = {
    courseA: [
      {
        type: 'exam_date',
        title: 'تداخل',
        description: 'desc',
        conflictingWithCourseId: 'courseB',
        conflictingWithCourseName: 'درس بی',
      },
    ],
    courseB: [
      {
        type: 'exam_date',
        title: 'تداخل',
        description: 'desc',
        conflictingWithCourseId: 'courseA',
        conflictingWithCourseName: 'درس آ',
      },
    ],
    courseC: [],
  };

  const stats = calculateConflictStats(['courseA', 'courseB', 'courseC'], conflictMap);

  assert.strictEqual(stats.uniquePairCount, 1, 'یک جفت تداخل بین courseA و courseB');
  assert.strictEqual(stats.affectedCourseCount, 2, 'فقط courseA و courseB درگیر هستند');
  assert.strictEqual(stats.totalReasonCount, 2, 'دو علت تقارنی ثبت شده است');
});

// 12. بررسی پیش‌نیازها با دیتاست پویا (custom dataset) به جای داده‌های ثابت
runTest('۱۲. بررسی پیش‌نیازها و هم‌نیازها روی دیتاست پویا و کدهای پاس‌شده سفارشی', () => {
  const customCourses: Course[] = [
    createMockCourse({
      id: 'custom-c1',
      code: '900001',
      name: 'فیزیولوژی پیشرفته',
      prerequisites: ['900002', '800001'],
      corequisites: ['900003'],
    }),
    createMockCourse({
      id: 'custom-c2',
      code: '900002',
      name: 'فیزیولوژی مقدماتی',
    }),
    createMockCourse({
      id: 'custom-c3',
      code: '900003',
      name: 'آزمایشگاه فیزیولوژی',
    }),
  ];

  const customPassed = ['800001']; // کد 800001 قبلاً پاس شده فرض می‌شود

  // هنگامی که هم‌نیاز custom-c3 اخذ نشده باشد
  const reasons = checkCoursePrerequisites(customCourses[0], [], customCourses, customPassed);
  
  // باید ۲ دلیل تولید شود: 
  // ۱) پیش‌نیاز 900002 در دیتاست هست پس پاس نشده تلقی می‌شود
  // ۲) هم‌نیاز 900003 هم‌اکنون اخذ نشده است
  // اما 800001 چون در customPassed هست نباید خطا دهد
  assert.strictEqual(reasons.length, 2, 'باید دقیقاً ۲ خطا برای پیش‌نیاز و هم‌نیاز ثبت شود');
  assert.ok(reasons.some((r) => r.type === 'prerequisite' && r.conflictingWithCourseId === 'custom-c2'));
  assert.ok(reasons.some((r) => r.type === 'corequisite' && r.conflictingWithCourseId === 'custom-c3'));

  // اگر هم‌نیاز اخذ شود:
  const reasonsWithCoreq = checkCoursePrerequisites(customCourses[0], ['custom-c3'], customCourses, customPassed);
  assert.strictEqual(reasonsWithCoreq.length, 1, 'با اخذ هم‌نیاز، فقط پیش‌نیاز باقی می‌ماند');
});

// 13. آزمون evaluateAllConflicts با دیتاست پویا
runTest('۱۳. اجرای کامل ارزیابی تداخل‌ها روی دیتاست پویا', () => {
  const dynamicCourses: Course[] = [
    createMockCourse({
      id: 'dyn-1',
      name: 'درس یک پویا',
      theorySchedule: [{ day: 'شنبه', startTime: '08:00', endTime: '10:00' }],
    }),
    createMockCourse({
      id: 'dyn-2',
      name: 'درس دو پویا',
      theorySchedule: [{ day: 'شنبه', startTime: '09:00', endTime: '11:00' }],
    }),
    createMockCourse({
      id: 'dyn-3',
      name: 'درس سه پویا بدون تداخل',
      theorySchedule: [{ day: 'یکشنبه', startTime: '08:00', endTime: '10:00' }],
    }),
  ];

  const customSelections: StudentSelections = {
    selectedCourseIds: ['dyn-1', 'dyn-2'],
    selectedPracticalGroups: {},
    gender: 'male',
    minUnits: 12,
    maxUnits: 20,
  };

  const conflictMap = evaluateAllConflicts(customSelections, dynamicCourses, []);

  // کلیدهای map باید فقط شامل دروس dynamicCourses باشند
  assert.deepStrictEqual(Object.keys(conflictMap).sort(), ['dyn-1', 'dyn-2', 'dyn-3'].sort());
  assert.strictEqual(conflictMap['dyn-1'].length, 1, 'درس یک باید تداخل کلاسی داشته باشد');
  assert.strictEqual(conflictMap['dyn-2'].length, 1, 'درس دو باید تداخل کلاسی داشته باشد');
  assert.strictEqual(conflictMap['dyn-3'].length, 0, 'درس سه تداخلی ندارد');
});

// 14. آزمون getInstantUnselectedConflicts و getHoverConflicts با دیتاست پویا
runTest('۱۴. تشخیص تداخل دروس نامنتخب و هاور روی دیتاست پویا', () => {
  const dynamicCourses: Course[] = [
    createMockCourse({
      id: 'dyn-selected',
      name: 'درس منتخب',
      theorySchedule: [{ day: 'دوشنبه', startTime: '10:00', endTime: '12:00' }],
    }),
    createMockCourse({
      id: 'dyn-unselected',
      name: 'درس نامنتخب متداخل',
      theorySchedule: [{ day: 'دوشنبه', startTime: '11:00', endTime: '13:00' }],
    }),
  ];

  const selections: StudentSelections = {
    selectedCourseIds: ['dyn-selected'],
    selectedPracticalGroups: {},
    gender: 'male',
    minUnits: 12,
    maxUnits: 20,
  };

  const instantConflicts = getInstantUnselectedConflicts(selections, dynamicCourses, []);
  assert.strictEqual(instantConflicts['dyn-unselected'].length, 1, 'درس نامنتخب باید تداخل آنی با درس منتخب داشته باشد');
  assert.strictEqual(instantConflicts['dyn-selected'], undefined, 'درس منتخب نباید در نقشه نامنتخب‌ها باشد');

  const hoverResult = getHoverConflicts('dyn-unselected', selections, dynamicCourses, []);
  assert.ok(hoverResult.conflictingCourseIds.has('dyn-selected'), 'شناسه درس منتخب باید در conflictingCourseIds باشد');
  assert.strictEqual(hoverResult.reasons.length, 1);
});

// 15. آزمون سازگاری به عقب با آرگومان‌های پیش‌فرض
runTest('۱۵. سازگاری به عقب توابع در صورت صدا زدن بدون پارامترهای دیتاست', () => {
  const selections: StudentSelections = {
    selectedCourseIds: [],
    selectedPracticalGroups: {},
    gender: 'male',
    minUnits: 12,
    maxUnits: 20,
  };

  const conflictMap = evaluateAllConflicts(selections);
  assert.ok(Object.keys(conflictMap).length > 0, 'باید با داده‌های پیش‌فرض به درستی اجرا شود');
});

console.log(`\n-----------------------------------------`);
console.log(`Results: ${passedTests}/${totalTests} tests passed successfully.`);
console.log(`-----------------------------------------\n`);

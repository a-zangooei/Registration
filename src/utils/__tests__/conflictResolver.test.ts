import assert from 'node:assert/strict';
import { Course, StudentSelections } from '../../types';
import {
  generateGroupAlternativeSuggestions,
  formatSlotsSummary,
} from '../conflictResolver';
import { evaluateAllConflicts, calculateConflictStats } from '../conflictDetector';

console.log('--- Running Conflict Resolver & Group Alternative Test Suite ---');

let passedTests = 0;
let totalTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// Mock dataset for deterministic testing
const testCourseA: Course = {
  id: 'c_ana',
  code: '101',
  name: 'علوم تشریح',
  term: 3,
  courseTypeString: 'پایه الزامی',
  category: 'specialized',
  units: { total: 2, theory: 1, practical: 1 },
  instructors: 'دکتر الف',
  prerequisites: [],
  theorySchedule: [
    { day: 'یکشنبه', startTime: '10:00', endTime: '12:00', label: 'نظری' },
  ],
  practicalGroups: [
    {
      id: 'g_mon_08',
      name: 'گروه دوشنبه ۸-۱۰',
      slots: [{ day: 'دوشنبه', startTime: '08:00', endTime: '10:00' }],
    },
    {
      id: 'g_tue_12',
      name: 'گروه سه‌شنبه ۱۲-۱۴',
      slots: [{ day: 'سه‌شنبه', startTime: '12:00', endTime: '14:00' }],
    },
    {
      id: 'g_wed_14',
      name: 'گروه چهارشنبه ۱۴-۱۶',
      slots: [{ day: 'چهارشنبه', startTime: '14:00', endTime: '16:00' }],
    },
  ],
  examStatusDescription: '',
  colorBadge: { bg: '', border: '', text: '', lightBg: '' },
};

const testCourseB: Course = {
  id: 'c_phys',
  code: '102',
  name: 'فیزیولوژی',
  term: 3,
  courseTypeString: 'پایه الزامی',
  category: 'specialized',
  units: { total: 2, theory: 2, practical: 0 },
  instructors: 'دکتر ب',
  prerequisites: [],
  theorySchedule: [
    { day: 'دوشنبه', startTime: '08:00', endTime: '10:00', label: 'نظری' },
  ],
  practicalGroups: [],
  examStatusDescription: '',
  colorBadge: { bg: '', border: '', text: '', lightBg: '' },
};

const testCourseC_Blocker: Course = {
  id: 'c_block',
  code: '103',
  name: 'درس مسدودکننده',
  term: 3,
  courseTypeString: 'عمومی',
  category: 'general',
  units: { total: 2, theory: 2, practical: 0 },
  instructors: 'دکتر ج',
  prerequisites: [],
  theorySchedule: [
    { day: 'سه‌شنبه', startTime: '12:00', endTime: '14:00', label: 'نظری' },
  ],
  practicalGroups: [],
  examStatusDescription: '',
  colorBadge: { bg: '', border: '', text: '', lightBg: '' },
};

const allTestCourses = [testCourseA, testCourseB, testCourseC_Blocker];

// =========================================================================
// Tests
// =========================================================================

runTest('۱. شناسایی گروه‌های جایگزین بدون تداخل هنگام تداخل یک گروه عملی با کلاس دیگر', () => {
  const selections: StudentSelections = {
    selectedCourseIds: ['c_ana', 'c_phys'],
    selectedPracticalGroups: {
      c_ana: 'g_mon_08', // Conflicts with c_phys on Monday 08:00-10:00
    },
    gender: 'male',
    minUnits: 2,
    maxUnits: 20,
  };

  const report = generateGroupAlternativeSuggestions(selections, allTestCourses, []);

  assert.equal(report.suggestions.length > 0, true, 'باید دست‌کم یک پیشنهاد معتبر تولید شود');
  const validGroupIds = report.suggestions.map((s) => s.suggestedGroupId);
  assert.equal(validGroupIds.includes('g_tue_12'), true, 'گروه سه‌شنبه ۱۲-۱۴ باید پیشنهاد شود');
  assert.equal(validGroupIds.includes('g_wed_14'), true, 'گروه چهارشنبه ۱۴-۱۶ باید پیشنهاد شود');
  assert.equal(validGroupIds.includes('g_mon_08'), false, 'گروه فعلی متداخل نباید به عنوان پیشنهاد جایگزین ارائه شود');
});

runTest('۲. رد خودکار گروه‌های جایگزینی که با درس‌های دیگر انتخاب‌شده تداخل جدید ایجاد می‌کنند', () => {
  // Now student selects c_ana, c_phys AND c_block (which blocks Tuesday 12:00-14:00)
  const selections: StudentSelections = {
    selectedCourseIds: ['c_ana', 'c_phys', 'c_block'],
    selectedPracticalGroups: {
      c_ana: 'g_mon_08', // Conflicts with c_phys on Monday 08:00-10:00
    },
    gender: 'male',
    minUnits: 2,
    maxUnits: 20,
  };

  const report = generateGroupAlternativeSuggestions(selections, allTestCourses, []);

  // 'g_tue_12' conflicts with c_block, so it MUST NOT be suggested as a valid resolution!
  const validGroupIds = report.suggestions.map((s) => s.suggestedGroupId);
  assert.equal(validGroupIds.includes('g_tue_12'), false, 'گروه سه‌شنبه نباید پیشنهاد شود چون با درس c_block تداخل دارد');
  assert.equal(validGroupIds.includes('g_wed_14'), true, 'تنها گروه چهارشنبه باید پیشنهاد شود');
});

runTest('۳. رتبه‌بندی پیشنهادها بر اساس رفع حداکثری تداخل و کمترین تغییر در انتخاب‌ها', () => {
  const selections: StudentSelections = {
    selectedCourseIds: ['c_ana', 'c_phys'],
    selectedPracticalGroups: {
      c_ana: 'g_mon_08',
    },
    gender: 'male',
    minUnits: 2,
    maxUnits: 20,
  };

  const report = generateGroupAlternativeSuggestions(selections, allTestCourses, []);

  // First item must be complete resolution (remaining conflicts = 0)
  assert.equal(report.suggestions[0].isCompleteResolution, true);
  assert.equal(report.suggestions[0].remainingConflictCount, 0);
  assert.equal(report.suggestions[0].changeCount, 1, 'تغییر تک‌گروهی در اولویت است');
});

runTest('۴. تابع پیشنهادساز به عنوان تابع خالص (Pure Function) حالت ورودی را تغییر نمی‌دهد', () => {
  const originalSelections: StudentSelections = {
    selectedCourseIds: ['c_ana', 'c_phys'],
    selectedPracticalGroups: {
      c_ana: 'g_mon_08',
    },
    gender: 'male',
    minUnits: 2,
    maxUnits: 20,
  };

  const snapshot = JSON.stringify(originalSelections);
  generateGroupAlternativeSuggestions(originalSelections, allTestCourses, []);
  assert.equal(JSON.stringify(originalSelections), snapshot, 'نباید هیچ‌گونه موتاسیونی در شیء selections رخ دهد');
});

runTest('۵. گزارش دقیق و توضیح شفاف علت برای تداخل‌های غیرقابل رفع (جلسات ثابت نظری بدون گروه جایگزین)', () => {
  // Course with only theory vs Course with only theory
  const courseTheory1: Course = {
    ...testCourseB,
    id: 'c_t1',
    name: 'پاتولوژی نظری',
    theorySchedule: [{ day: 'شنبه', startTime: '08:00', endTime: '10:00' }],
    practicalGroups: [],
  };
  const courseTheory2: Course = {
    ...testCourseB,
    id: 'c_t2',
    name: 'ژنتیک پزشکی',
    theorySchedule: [{ day: 'شنبه', startTime: '08:00', endTime: '10:00' }],
    practicalGroups: [],
  };

  const selections: StudentSelections = {
    selectedCourseIds: ['c_t1', 'c_t2'],
    selectedPracticalGroups: {},
    gender: 'male',
    minUnits: 2,
    maxUnits: 20,
  };

  const report = generateGroupAlternativeSuggestions(selections, [courseTheory1, courseTheory2], []);

  assert.equal(report.suggestions.length, 0, 'نباید پیشنهاد نامعتبر برای جلسات ثابت نظری ساخته شود');
  assert.equal(report.unresolvable.length > 0, true, 'علت تداخل غیرقابل رفع باید گزارش شود');
  assert.equal(report.unresolvable[0].reasonCategory, 'theory_fixed_schedule');
  assert.equal(report.unresolvable[0].explanation.includes('جلسات ثابت نظری'), true);
});

runTest('۶. گزارش شفاف برای تداخل تاریخ امتحان که با تغییر گروه کلاسی قابل حل نیست', () => {
  const courseExam1: Course = {
    ...testCourseA,
    id: 'c_e1',
    finalExam: { date: '1403/10/20', startTime: '09:00', endTime: '11:00', type: 'final' },
    theorySchedule: [{ day: 'شنبه', startTime: '08:00', endTime: '10:00' }],
  };
  const courseExam2: Course = {
    ...testCourseA,
    id: 'c_e2',
    finalExam: { date: '1403/10/20', startTime: '09:00', endTime: '11:00', type: 'final' },
    theorySchedule: [{ day: 'یکشنبه', startTime: '08:00', endTime: '10:00' }],
  };

  const selections: StudentSelections = {
    selectedCourseIds: ['c_e1', 'c_e2'],
    selectedPracticalGroups: {},
    gender: 'male',
    minUnits: 2,
    maxUnits: 20,
  };

  const report = generateGroupAlternativeSuggestions(selections, [courseExam1, courseExam2], []);

  assert.equal(report.unresolvable.some((u) => u.reasonCategory === 'identical_exam_date'), true);
});

runTest('۷. شناسایی هشدارهای اطلاعات ناقص برای امتحانات بدون ساعت معتبر', () => {
  const courseWithIncompleteExam: Course = {
    ...testCourseA,
    finalExam: { date: '1403/10/25', time: '', type: 'final' }, // Missing time
  };

  const selections: StudentSelections = {
    selectedCourseIds: ['c_ana', 'c_phys'],
    selectedPracticalGroups: { c_ana: 'g_mon_08' },
    gender: 'male',
    minUnits: 2,
    maxUnits: 20,
  };

  const report = generateGroupAlternativeSuggestions(selections, [courseWithIncompleteExam, testCourseB], []);
  assert.equal(report.suggestions.length > 0, true);
  const suggestion = report.suggestions[0];
  assert.equal(suggestion.missingInfoWarnings.length > 0, true);
  assert.equal(suggestion.missingInfoWarnings[0].includes('مشخص نشده است'), true);
});

runTest('۸. معیار پذیرش: پس از اعمال پیشنهاد، اعتبارسنجی مجدد جدول و صفر شدن تداخل هدف', () => {
  const selections: StudentSelections = {
    selectedCourseIds: ['c_ana', 'c_phys'],
    selectedPracticalGroups: { c_ana: 'g_mon_08' },
    gender: 'male',
    minUnits: 2,
    maxUnits: 20,
  };

  const report = generateGroupAlternativeSuggestions(selections, allTestCourses, []);
  const winningSuggestion = report.suggestions[0];

  // User explicitly applies the suggestion
  const appliedSelections: StudentSelections = {
    ...selections,
    selectedPracticalGroups: {
      ...selections.selectedPracticalGroups,
      [winningSuggestion.courseId]: winningSuggestion.suggestedGroupId,
    },
  };

  // Re-evaluate entire schedule state
  const newConflictMap = evaluateAllConflicts(appliedSelections, allTestCourses, []);
  const newStats = calculateConflictStats(appliedSelections.selectedCourseIds, newConflictMap);

  assert.equal(newStats.uniquePairCount, 0, 'پس از اعمال گروه پیشنهادی، تداخل جفت‌درس‌ها باید کاملاً صفر باشد');
  assert.equal(newStats.totalReasonCount, 0, 'تعداد کل علل تداخل باید صفر باشد');
  assert.equal(newConflictMap['c_ana'].length, 0, 'درس علوم تشریح نباید هیچ تداخلی داشته باشد');
});

runTest('۹. فرمت‌بندی صحیح خلاصه زمان‌بندی جلسات به زبان فارسی', () => {
  const summary = formatSlotsSummary([
    { day: 'دوشنبه', startTime: '08:00', endTime: '10:00' },
    { day: 'چهارشنبه', startTime: '10:00', endTime: '12:00' },
  ]);
  assert.equal(summary, 'دوشنبه 08:00 تا 10:00، چهارشنبه 10:00 تا 12:00');
});

console.log('-----------------------------------------------------------');
console.log(`Conflict Resolver Results: ${passedTests}/${totalTests} tests passed successfully.`);
console.log('-----------------------------------------------------------');

import assert from 'node:assert/strict';
import { Course, TimeSlot } from '../../types';
import {
  findUpcomingClass,
  getEffectiveSlotCutoffMinutes,
  IranTimeInfo,
} from '../iranTime';

console.log('--- Running Upcoming Class & Back-to-Back Logic Test Suite ---');

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

// Helpers for test courses
function createTestCourse(id: string, name: string): Course {
  return {
    id,
    code: id,
    name,
    term: 3,
    courseTypeString: 'تست',
    category: 'specialized',
    units: { total: 2, theory: 2, practical: 0 },
    instructors: 'دکتر تست',
    prerequisites: [],
    theorySchedule: [],
    practicalGroups: [],
    examStatusDescription: '',
    colorBadge: { bg: '', border: '', text: '', lightBg: '' },
  };
}

const course1 = createTestCourse('c1', 'درس اول (۰۸:۰۰ تا ۱۰:۰۰)');
const course2 = createTestCourse('c2', 'درس دوم (۱۰:۰۰ تا ۱۲:۰۰)');
const course3 = createTestCourse('c3', 'درس سوم عملی شناور');

// Run tests
runTest('۱. محاسبه نقطه برش زمانی (Cutoff) ۹۰ دقیقه‌ای برای کلاس‌های ۲ ساعته', () => {
  // 08:00 is 480 min. Cutoff should be 480 + 90 = 570 min (09:30)
  const cutoff = getEffectiveSlotCutoffMinutes('08:00', '10:00');
  assert.equal(cutoff, 570);

  // 10:00 is 600 min. Cutoff should be 600 + 90 = 690 min (11:30)
  const cutoff2 = getEffectiveSlotCutoffMinutes('10:00', '12:00');
  assert.equal(cutoff2, 690);

  // For a short class (e.g. 1 hour: 08:00 - 09:00), end time is 540 min
  const cutoffShort = getEffectiveSlotCutoffMinutes('08:00', '09:00');
  assert.equal(cutoffShort, 540);
});

runTest('۲. قبل از ۹:۳۰، کلاس ۸ تا ۱۰ به عنوان کلاس در حال برگزاری نشان داده می‌شود', () => {
  const activeSlots = [
    {
      course: course1,
      slot: { day: 'شنبه', startTime: '08:00', endTime: '10:00' } as TimeSlot,
    },
    {
      course: course2,
      slot: { day: 'شنبه', startTime: '10:00', endTime: '12:00' } as TimeSlot,
    },
  ];

  // At 09:15 on Saturday (555 minutes)
  const timeAt0915: IranTimeInfo = {
    dayName: 'شنبه',
    dayIndex: 0,
    hours: 9,
    minutes: 15,
    totalMinutes: 555,
    timeString: '09:15',
  };

  const result = findUpcomingClass(activeSlots, timeAt0915);
  assert.ok(result !== null);
  assert.equal(result.type, 'ongoing');
  assert.equal(result.course.id, 'c1');
  assert.equal(result.slot.startTime, '08:00');
  assert.equal(result.slot.endTime, '10:00');
});

runTest('۳. از ساعت ۹:۳۰ به بعد، کلاس دوم (۱۰ تا ۱۲) به عنوان کلاس پیش‌رو نمایش داده می‌شود', () => {
  const activeSlots = [
    {
      course: course1,
      slot: { day: 'شنبه', startTime: '08:00', endTime: '10:00' } as TimeSlot,
    },
    {
      course: course2,
      slot: { day: 'شنبه', startTime: '10:00', endTime: '12:00' } as TimeSlot,
    },
  ];

  // Exactly at 09:30 on Saturday (570 minutes)
  const timeAt0930: IranTimeInfo = {
    dayName: 'شنبه',
    dayIndex: 0,
    hours: 9,
    minutes: 30,
    totalMinutes: 570,
    timeString: '09:30',
  };

  const result = findUpcomingClass(activeSlots, timeAt0930);
  assert.ok(result !== null);
  // It should now transition to the next class starting at 10:00!
  assert.equal(result.type, 'upcoming_today');
  assert.equal(result.course.id, 'c2');
  assert.equal(result.slot.startTime, '10:00');
  assert.equal(result.slot.endTime, '12:00');
  assert.match(result.relativeTimeText, /(30|۳۰) دقیقه دیگر/);
});

runTest('۴. در ساعت ۹:۴۵ نیز همچنان کلاس ساعت ۱۰ به عنوان کلاس پیش‌رو امروز دیده می‌شود', () => {
  const activeSlots = [
    {
      course: course1,
      slot: { day: 'شنبه', startTime: '08:00', endTime: '10:00' } as TimeSlot,
    },
    {
      course: course2,
      slot: { day: 'شنبه', startTime: '10:00', endTime: '12:00' } as TimeSlot,
    },
  ];

  // At 09:45 on Saturday (585 minutes)
  const timeAt0945: IranTimeInfo = {
    dayName: 'شنبه',
    dayIndex: 0,
    hours: 9,
    minutes: 45,
    totalMinutes: 585,
    timeString: '09:45',
  };

  const result = findUpcomingClass(activeSlots, timeAt0945);
  assert.ok(result !== null);
  assert.equal(result.type, 'upcoming_today');
  assert.equal(result.course.id, 'c2');
  assert.equal(result.slot.startTime, '10:00');
  assert.match(result.relativeTimeText, /(15|۱۵) دقیقه دیگر/);
});

runTest('۵. در ساعت ۱۰:۰۰، کلاس دوم وارد فاز «در حال برگزاری» می‌شود', () => {
  const activeSlots = [
    {
      course: course1,
      slot: { day: 'شنبه', startTime: '08:00', endTime: '10:00' } as TimeSlot,
    },
    {
      course: course2,
      slot: { day: 'شنبه', startTime: '10:00', endTime: '12:00' } as TimeSlot,
    },
  ];

  // At 10:05 on Saturday (605 minutes)
  const timeAt1005: IranTimeInfo = {
    dayName: 'شنبه',
    dayIndex: 0,
    hours: 10,
    minutes: 5,
    totalMinutes: 605,
    timeString: '10:05',
  };

  const result = findUpcomingClass(activeSlots, timeAt1005);
  assert.ok(result !== null);
  assert.equal(result.type, 'ongoing');
  assert.equal(result.course.id, 'c2');
});

runTest('۶. گروه‌های عملی شناور و انتخاب‌نشده (isTentative: true) به هیچ وجه در کلاس پیش‌رو نمی‌آیند', () => {
  const activeSlots = [
    {
      course: course3,
      slot: {
        day: 'شنبه',
        startTime: '08:00',
        endTime: '10:00',
        isTentative: true,
        groupName: 'گروه شناور انتخاب نشده',
      } as TimeSlot,
    },
    {
      course: course2,
      slot: {
        day: 'شنبه',
        startTime: '10:00',
        endTime: '12:00',
        isTentative: false,
      } as TimeSlot,
    },
  ];

  // At 08:30 on Saturday (510 minutes)
  const timeAt0830: IranTimeInfo = {
    dayName: 'شنبه',
    dayIndex: 0,
    hours: 8,
    minutes: 30,
    totalMinutes: 510,
    timeString: '08:30',
  };

  const result = findUpcomingClass(activeSlots, timeAt0830);
  assert.ok(result !== null);
  // Unselected tentative practical should NOT be ongoing! Next definite class (c2) should be picked.
  assert.equal(result.type, 'upcoming_today');
  assert.equal(result.course.id, 'c2');
});

runTest('۷. اگر همه اسلات‌ها شناور/انتخاب‌نشده باشند، هیچ کلاس پیش‌رویی برگردانده نمی‌شود', () => {
  const activeSlots = [
    {
      course: course3,
      slot: {
        day: 'شنبه',
        startTime: '08:00',
        endTime: '10:00',
        isTentative: true,
      } as TimeSlot,
    },
  ];

  const timeAt0830: IranTimeInfo = {
    dayName: 'شنبه',
    dayIndex: 0,
    hours: 8,
    minutes: 30,
    totalMinutes: 510,
    timeString: '08:30',
  };

  const result = findUpcomingClass(activeSlots, timeAt0830);
  assert.equal(result, null);
});

console.log(`\nUpcoming Class Results: ${passedTests}/${totalTests} tests passed successfully.\n`);

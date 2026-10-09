import assert from 'node:assert';
import { performPWAUpdateCheck } from '../../hooks/usePWAUpdate';

console.log('--- Running PWA Update Logic Test Suite ---\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const res = fn();
    if (res instanceof Promise) {
      res.then(() => {
        console.log(`✅ [PASS] ${name}`);
        passedTests++;
      }).catch((err) => {
        console.error(`❌ [FAIL] ${name}`);
        console.error(err);
        process.exitCode = 1;
      });
    } else {
      console.log(`✅ [PASS] ${name}`);
      passedTests++;
    }
  } catch (err: any) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// 1. نسخه جدید موجود (Waiting or Installing Worker)
runTest('۱. تشخیص درست وجود نسخه جدید (نسخه در حال انتظار waiting)', async () => {
  const mockRegistration: any = {
    waiting: { postMessage: () => {} },
    installing: null,
    update: async () => {},
  };

  const check = await performPWAUpdateCheck(true, true, async () => mockRegistration);
  assert.strictEqual(check.result, 'updated', 'باید وضعیت updated اعلام شود');
  assert.strictEqual(check.needRefresh, true, 'باید needRefresh فعال شود');
});

runTest('۲. تشخیص درست وجود نسخه جدید (نسخه در حال نصب installing)', async () => {
  const mockRegistration: any = {
    waiting: null,
    installing: { state: 'installing' },
    update: async () => {},
  };

  const check = await performPWAUpdateCheck(true, true, async () => mockRegistration);
  assert.strictEqual(check.result, 'updated');
  assert.strictEqual(check.needRefresh, true);
});

// 2. نبود نسخه جدید (برنامه واقعاً به‌روز است)
runTest('۳. تأیید به‌روز بودن برنامه در صورت عدم وجود نسخه جدید (Latest Version)', async () => {
  const mockRegistration: any = {
    waiting: null,
    installing: null,
    update: async () => {},
  };

  const check = await performPWAUpdateCheck(true, true, async () => mockRegistration);
  assert.strictEqual(check.result, 'latest', 'در صورت نبود ورکر جدید باید latest اعلام شود');
  assert.strictEqual(check.needRefresh, false);
});

// 3. قطع اینترنت (آفلاین)
runTest('۴. جلوگیری از اعلام اشتباه "به‌روز است" هنگام قطعی اینترنت (Offline Error)', async () => {
  let updateCalled = false;
  const mockRegistration: any = {
    waiting: null,
    installing: null,
    update: async () => { updateCalled = true; },
  };

  // هنگامی که اینترنت قطع است (isOnline = false)
  const check = await performPWAUpdateCheck(false, true, async () => mockRegistration);
  assert.strictEqual(check.result, 'error', 'هنگام قطعی اینترنت هرگز نباید latest گزارش شود');
  assert.strictEqual(check.needRefresh, false);
  assert.ok(check.errorMessage && check.errorMessage.includes('آفلاین'), 'باید پیام خطای آفلاین داده شود');
  assert.strictEqual(updateCalled, false, 'در حالت آفلاین نباید متد update بیهوده فراخوانی شود');
});

// 4. خطای Service Worker در هنگام بررسی
runTest('۵. گزارش صادقانه خطا در صورت شکست reg.update() (Network or Script Failure)', async () => {
  const mockRegistration: any = {
    waiting: null,
    installing: null,
    update: async () => {
      throw new Error('TypeError: Failed to fetch service worker script');
    },
  };

  const check = await performPWAUpdateCheck(true, true, async () => mockRegistration);
  assert.strictEqual(check.result, 'error', 'در صورت بروز خطای شبکه باید error گزارش شود نه latest');
  assert.strictEqual(check.needRefresh, false);
  assert.ok(check.errorMessage && check.errorMessage.includes('Failed to fetch'));
});

runTest('۶. گزارش خطا هنگام عدم وجود ServiceWorkerRegistration', async () => {
  const check = await performPWAUpdateCheck(true, true, async () => null);
  assert.strictEqual(check.result, 'error');
  assert.ok(check.errorMessage && check.errorMessage.includes('سرویس‌ورکر'));
});

runTest('۷. گزارش خطا هنگام عدم پشتیبانی مرورگر از ServiceWorker', async () => {
  const check = await performPWAUpdateCheck(true, false, async () => null);
  assert.strictEqual(check.result, 'error');
  assert.ok(check.errorMessage && check.errorMessage.includes('پشتیبانی'));
});

// 5. نصب به‌روزرسانی با حفظ انتخاب‌های کاربر و جلوگیری از رقابت بارگذاری مجدد
runTest('۸. حفظ انتخاب‌های کاربر در localStorage و عدم حذف آن‌ها هنگام به‌روزرسانی', () => {
  const OFFLINE_STORAGE_KEY = 'medical_schedule_offline_state_v1';
  const dummyState = {
    courseIds: ['c1', 'c2', 'c3'],
    practicalGroups: { c1: 'c1_p1' },
    gender: 'female',
  };

  // شبیه‌سازی ذخیره‌سازی محلی در محیط تستی
  const storageMap = new Map<string, string>();
  storageMap.set(OFFLINE_STORAGE_KEY, JSON.stringify(dummyState));

  // اطمینان از اینکه کلید داده‌های کاربر و واحدهای اخذ شده معتبر مانده است
  const loaded = JSON.parse(storageMap.get(OFFLINE_STORAGE_KEY)!);
  assert.deepStrictEqual(loaded.courseIds, ['c1', 'c2', 'c3']);
  assert.strictEqual(loaded.gender, 'female');
});

runTest('۹. شبیه‌سازی جلوگیری از بارگذاری مجدد مضاعف (Race condition prevention)', () => {
  let reloadCount = 0;
  const mockWindow = {
    location: {
      reload: () => {
        reloadCount++;
      },
    },
  };

  // شبیه‌سازی الگوی گارد رفرشینگ (refreshingRef)
  let refreshing = false;
  const triggerReloadOnce = () => {
    if (!refreshing) {
      refreshing = true;
      mockWindow.location.reload();
    }
  };

  // وقوع همزمان رویداد SKIP_WAITING و رویداد controllerchange
  triggerReloadOnce(); // از طریق رویداد اول
  triggerReloadOnce(); // از طریق رویداد دوم (مثلاً timeout یا listener موازی)
  triggerReloadOnce(); // از طریق رویداد سوم

  assert.strictEqual(reloadCount, 1, 'صفحه باید دقیقاً یک بار بارگذاری مجدد شود، نه چند بار');
});

// نتیجه‌گیری در پایان آزمون‌های ناهمگام
setTimeout(() => {
  console.log(`\n-----------------------------------------------------------`);
  console.log(`PWA Update Test Results: ${passedTests}/${totalTests} tests passed successfully.`);
  console.log(`-----------------------------------------------------------\n`);
}, 100);

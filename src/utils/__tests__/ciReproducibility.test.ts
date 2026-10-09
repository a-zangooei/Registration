import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Running CI & Package Installation Reproducibility Test Suite ---\n');

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

const rootDir = process.cwd();
const pkgPath = path.join(rootDir, 'package.json');
const lockPath = path.join(rootDir, 'package-lock.json');
const bunLockPath = path.join(rootDir, 'bun.lock');
const ciPath = path.join(rootDir, '.github/workflows/ci.yml');
const deployPath = path.join(rootDir, '.github/workflows/deploy-pages.yml');

// ۱. بررسی فایل‌های قفل و حذف فایل‌های زائد
runTest('۱. وجود فایل قفل رسمی npm (package-lock.json) و عدم وجود فایل قفل اضافی bun.lock', () => {
  assert.strictEqual(fs.existsSync(lockPath), true, 'فایل package-lock.json باید در ریشه پروژه موجود باشد');
  assert.strictEqual(fs.existsSync(bunLockPath), false, 'فایل اضافی bun.lock نباید در مخزن وجود داشته باشد');
});

// ۲. اعتبارسنجی عدم تکرار پکیج‌ها در dependencies و devDependencies
runTest('۲. عدم تداخل یا تکرار نام بسته‌ها بین dependencies و devDependencies در package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = Object.keys(pkg.dependencies || {});
  const devDeps = Object.keys(pkg.devDependencies || {});

  const overlap = deps.filter((d) => devDeps.includes(d));
  assert.deepStrictEqual(
    overlap,
    [],
    `هیچ بسته‌ای نباید هم‌زمان در dependencies و devDependencies تعریف شده باشد: ${overlap.join(', ')}`
  );
});

// ۳. حذف قطعی وابستگی‌های بلااستفاده
runTest('۳. پاک‌سازی کامل وابستگی‌های غیرضروری و بدون استفاده از package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  const unusedPackages = ['express', 'dotenv', 'motion', 'autoprefixer', '@types/express'];
  unusedPackages.forEach((pkgName) => {
    assert.strictEqual(
      allDeps[pkgName],
      undefined,
      `بسته بی‌استفاده ${pkgName} نباید در وابستگی‌های پروژه باقی مانده باشد`
    );
  });
});

// ۴. بررسی وجود اسکریپت‌های الزامی lint، test و build در package.json
runTest('۴. حضور و صحت اسکریپت‌های استاندارد lint، test و build در package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.ok(pkg.scripts, 'بخش scripts باید در package.json تعریف شده باشد');
  assert.ok(pkg.scripts.lint, 'اسکریپت lint باید تعریف شده باشد');
  assert.ok(pkg.scripts.test, 'اسکریپت test باید تعریف شده باشد');
  assert.ok(pkg.scripts.build, 'اسکریپت build باید تعریف شده باشد');
  assert.ok(pkg.engines?.node, 'محدودیت نسخه Node در فیلد engines باید تعریف شده باشد');
});

// ۵. بررسی دستور نصب در گردش‌کار CI (عدم پنهان‌سازی خطا با fallback)
runTest('۵. دستور نصب قطعی npm ci و حذف fallback پنهان‌کننده خطا در ci.yml', () => {
  assert.ok(fs.existsSync(ciPath), 'فایل ci.yml باید وجود داشته باشد');
  const ciContent = fs.readFileSync(ciPath, 'utf8');

  assert.match(
    ciContent,
    /run:\s+npm\s+ci/,
    'دستور نصب در CI باید صراحتاً npm ci باشد'
  );
  assert.strictEqual(
    ciContent.includes('|| npm install'),
    false,
    'دستور نصب نباید دارای فالبک || npm install باشد'
  );
  assert.match(
    ciContent,
    /node-version:\s*22/,
    'نسخه نود در CI باید صراحتاً مشخص باشد'
  );
  assert.match(
    ciContent,
    /run:\s+npm\s+test/,
    'گردش‌کار CI باید شامل مرحله اجرای آزمون‌ها (npm test) باشد'
  );
  assert.match(
    ciContent,
    /run:\s+npm\s+run\s+lint/,
    'گردش‌کار CI باید شامل مرحله بررسی تایپ‌اسکریپت (npm run lint) باشد'
  );
});

// ۶. بررسی گردش‌کار انتشار GitHub Pages (deploy-pages.yml)
runTest('۶. اجرای قطعی npm ci، تست‌ها و اعتبارسنجی تایپ پیش از ساخت در deploy-pages.yml', () => {
  assert.ok(fs.existsSync(deployPath), 'فایل deploy-pages.yml باید وجود داشته باشد');
  const deployContent = fs.readFileSync(deployPath, 'utf8');

  assert.match(
    deployContent,
    /run:\s+npm\s+ci/,
    'دستور نصب در انتشار باید صراحتاً npm ci باشد'
  );
  assert.strictEqual(
    deployContent.includes('|| npm install'),
    false,
    'دستور نصب در انتشار نباید دارای فالبک || npm install باشد'
  );
  assert.match(
    deployContent,
    /run:\s+npm\s+test/,
    'گردش‌کار انتشار باید شامل مرحله اجرای آزمون‌ها (npm test) باشد'
  );
  assert.match(
    deployContent,
    /run:\s+npm\s+run\s+lint/,
    'گردش‌کار انتشار باید شامل مرحله بررسی تایپ‌اسکریپت (npm run lint) باشد'
  );
});

console.log(`\n-----------------------------------------------------------`);
console.log(`CI & Reproducibility Results: ${passedTests}/${totalTests} tests passed successfully.`);
console.log(`-----------------------------------------------------------\n`);

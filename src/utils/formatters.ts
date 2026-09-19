/**
 * Course name shorteners and display helpers for medical curriculum
 */

export function getShortCourseName(fullName: string): string {
  if (!fullName) return '';
  let name = fullName.trim();

  // Anatomical and physiological systems (keep the critical distinguishing system name!)
  name = name.replace(/^علوم تشریح سیستم ادراری\s*-\s*تناسلی/, 'تشریح ادراری-تناسلی');
  name = name.replace(/^علوم تشریح سیستم ادراری/, 'تشریح ادراری');
  name = name.replace(/^علوم تشریح سیستم اعصاب/, 'تشریح اعصاب');
  name = name.replace(/^علوم تشریح سیستم حواس ویژه/, 'تشریح حواس ویژه');
  name = name.replace(/^علوم تشریح سر و گردن/, 'تشریح سر و گردن');
  name = name.replace(/^علوم تشریح سیستم\s*/, 'تشریح ');
  name = name.replace(/^علوم تشریح\s*/, 'تشریح ');

  // Physiology
  name = name.replace(/^فیزیولوژی نظری سیستم ادراری/, 'فیزیولوژی ادراری');
  name = name.replace(/^فیزیولوژی نظری سیستم اعصاب/, 'فیزیولوژی اعصاب');
  name = name.replace(/^فیزیولوژی اعصاب و حواس ویژه/, 'فیزیولوژی اعصاب');
  name = name.replace(/^فیزیولوژی کلیه/, 'فیزیولوژی کلیه');
  name = name.replace(/^فیزیولوژی نظری\s*/, 'فیزیولوژی ');
  name = name.replace(/^فیزیولوژی عملی سیستم\s*/, 'فیزیو عملی ');
  name = name.replace(/^فیزیولوژی عملی\s*/, 'فیزیو عملی ');

  // Pathology & Paraclinical
  name = name.replace(/^پاتولوژی عمومی نظری/, 'پاتولوژی نظری');
  name = name.replace(/^پاتولوژی عمومی عملی/, 'پاتولوژی عملی');
  name = name.replace(/^آسیب‌شناسی پایه و عمومی/, 'پاتولوژی پایه');
  name = name.replace(/^اصول پایه فارماکولوژی پزشکی/, 'فارماکولوژی پایه');
  name = name.replace(/^اصول و مبانی مدیریت خطر، حوادث و بلایا/, 'مدیریت بلایا');
  name = name.replace(/^اصول اپیدمیولوژی/, 'اپیدمیولوژی');
  name = name.replace(/^ایمنی‌شناسی پزشکی/, 'ایمنی‌شناسی');
  name = name.replace(/^انگل‌شناسی پزشکی/, 'انگل‌شناسی');
  name = name.replace(/^ویروس‌شناسی پزشکی/, 'ویروس‌شناسی');
  name = name.replace(/^قارچ‌شناسی پزشکی/, 'قارچ‌شناسی');

  // General & Language
  name = name.replace(/^آیین زندگی \(اخلاق کاربردی\)/, 'آیین زندگی (اخلاق)');
  name = name.replace(/^فرهنگ و تمدن اسلامی/, 'فرهنگ و تمدن');
  name = name.replace(/^اندیشه اسلامی ۲/, 'اندیشه اسلامی ۲');
  name = name.replace(/^زبان تخصصی ۲/, 'زبان تخصصی ۲');

  return name;
}

/**
 * Clean short label for practical groups
 */
export function getShortGroupLabel(groupName?: string, label?: string): string {
  if (groupName) {
    // E.g. "تشریح: سه‌شنبه ۱۲:۰۰ - ۱۴:۰۰" -> "تشریح"
    // E.g. "بافت‌شناسی: دوشنبه ۰۸:۰۰ - ۱۰:۰۰" -> "بافت‌شناسی"
    // E.g. "گروه ۲: سه‌شنبه ۱۰:۰۰ - ۱۲:۰۰" -> "گروه ۲"
    const prefix = groupName.split(':')[0].trim();
    if (prefix) return prefix;
  }
  return label || 'عملی';
}

/**
 * Truncate canvas text safely according to measured width
 */
export function fitCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}

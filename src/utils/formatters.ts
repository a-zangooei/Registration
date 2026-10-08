/**
 * Course name shorteners and display helpers for all university disciplines
 */

export function getShortCourseName(fullName: string): string {
  if (!fullName) return '';
  let name = fullName.trim();

  // General university courses abbreviation
  name = name.replace(/^آیین زندگی \(اخلاق کاربردی\)/, 'آیین زندگی (اخلاق)');
  name = name.replace(/^فرهنگ و تمدن اسلام و ایران/, 'فرهنگ و تمدن');
  name = name.replace(/^دانش خانواده و جمعیت/, 'دانش خانواده');
  name = name.replace(/^مبانی نظری اسلام \(اندیشه اسلامی ۱\)/, 'اندیشه اسلامی ۱');
  name = name.replace(/^انقلاب اسلامی ایران و ریشه‌های آن/, 'انقلاب اسلامی');
  name = name.replace(/^تفسیر موضوعی نهج‌البلاغه/, 'تفسیر نهج‌البلاغه');
  name = name.replace(/^فارسی عمومی و نگارش علمی/, 'فارسی عمومی');
  name = name.replace(/^زبان انگلیسی عمومی دانشگاهی/, 'زبان انگلیسی عمومی');

  // Engineering & Science abbreviation
  name = name.replace(/^مبانی برنامه‌نویسی و الگوریتم‌ها/, 'مبانی برنامه‌نویسی');
  name = name.replace(/^مدارهای الکتریکی و الکترونیکی/, 'مدارهای الکتریکی');
  name = name.replace(/^معماری و ساختار کامپیوتر/, 'معماری کامپیوتر');
  name = name.replace(/^سیستم‌های عامل پیشرفته/, 'سیستم‌های عامل');

  // Medical systems (if medical courses are selected)
  name = name.replace(/^علوم تشریح سیستم ادراری\s*-\s*تناسلی/, 'تشریح ادراری-تناسلی');
  name = name.replace(/^علوم تشریح سیستم\s*/, 'تشریح ');
  name = name.replace(/^علوم تشریح\s*/, 'تشریح ');
  name = name.replace(/^فیزیولوژی نظری سیستم\s*/, 'فیزیولوژی ');
  name = name.replace(/^فیزیولوژی نظری\s*/, 'فیزیولوژی ');
  name = name.replace(/^فیزیولوژی عملی سیستم\s*/, 'فیزیو عملی ');
  name = name.replace(/^پاتولوژی عمومی نظری/, 'پاتولوژی نظری');
  name = name.replace(/^پاتولوژی عمومی عملی/, 'پاتولوژی عملی');

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

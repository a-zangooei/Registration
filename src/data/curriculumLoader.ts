import { Course, CurriculumDataset } from '../types';
import medicalDatasetJson from './datasets/term-05-fall-1403.json';

// Single Official Curriculum: Medical Basic Sciences (Semesters 3, 4, 5)
export const DEFAULT_CURRICULUM: CurriculumDataset = medicalDatasetJson as unknown as CurriculumDataset;

// Re-export common helpers and constants
export const COURSES_DATA: Course[] = DEFAULT_CURRICULUM.courses;

export const EXTERNAL_PASSED_COURSES = new Set<string>(
  DEFAULT_CURRICULUM.externalPassedCourses || []
);

export const TOTAL_REPORT_UNITS = Number(
  COURSES_DATA.reduce((sum, c) => sum + c.units.total, 0).toFixed(2)
);

/**
 * Normalizes Persian digits to English digits.
 */
function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

const VALID_DAYS = new Set(['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه']);

function parseTimeToMinutes(timeStr: string): number | null {
  if (typeof timeStr !== 'string') return null;
  const clean = toEnglishDigits(timeStr.trim());
  const match = clean.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function isValidJalaliDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const clean = toEnglishDigits(dateStr.trim());
  const match = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (year < 1300 || year > 1500) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (month > 6 && day > 30) return false;
  return true;
}

function validateTimeSlots(slots: any[], context: string, errors: string[]) {
  if (!Array.isArray(slots)) {
    errors.push(`[${context}] [فیلد: slots] بازه‌های زمانی باید یک آرایه باشد.`);
    return;
  }
  slots.forEach((slot, sIdx) => {
    const slotContext = `${context} -> بازه ${sIdx + 1}`;
    if (!slot || typeof slot !== 'object') {
      errors.push(`[${slotContext}] ساختار بازه زمانی نامعتبر است (شیء نیست).`);
      return;
    }
    if (!slot.day || typeof slot.day !== 'string' || !VALID_DAYS.has(slot.day.trim())) {
      errors.push(
        `[${slotContext}] [فیلد: day] روز هفته «${slot.day || 'نامشخص'}» نامعتبر است (روزهای مجاز: شنبه تا پنج‌شنبه).`
      );
    }
    const startMin = parseTimeToMinutes(slot.startTime);
    const endMin = parseTimeToMinutes(slot.endTime);

    if (startMin === null) {
      errors.push(
        `[${slotContext}] [فیلد: startTime] فرمت ساعت شروع «${slot.startTime || ''}» نامعتبر است (الگوی صحیح: HH:MM مانند 08:00).`
      );
    }
    if (endMin === null) {
      errors.push(
        `[${slotContext}] [فیلد: endTime] فرمت ساعت پایان «${slot.endTime || ''}» نامعتبر است (الگوی صحیح: HH:MM مانند 10:00).`
      );
    }
    if (startMin !== null && endMin !== null && startMin >= endMin) {
      errors.push(
        `[${slotContext}] [فیلد: time] ساعت شروع (${slot.startTime}) باید قبل از ساعت پایان (${slot.endTime}) باشد.`
      );
    }
  });
}

function validateExamDetail(exam: any, context: string, errors: string[]) {
  if (exam === null || exam === undefined) return;
  if (typeof exam !== 'object') {
    errors.push(`[${context}] ساختار اطلاعات امتحان نامعتبر است.`);
    return;
  }
  if (!exam.date || typeof exam.date !== 'string' || !isValidJalaliDate(exam.date)) {
    errors.push(
      `[${context}] [فیلد: date] تاریخ امتحان «${exam.date || ''}» نامعتبر است (الگوی معتبر تقویم شمسی: YYYY/MM/DD مانند ۱۴۰۳/۱۰/۱۵).`
    );
  }
  if (exam.type && exam.type !== 'midterm' && exam.type !== 'final') {
    errors.push(`[${context}] [فیلد: type] نوع امتحان باید 'midterm' یا 'final' باشد.`);
  }
  if (exam.startTime && exam.endTime) {
    const sMin = parseTimeToMinutes(exam.startTime);
    const eMin = parseTimeToMinutes(exam.endTime);
    if (sMin === null) {
      errors.push(`[${context}] [فیلد: startTime] فرمت ساعت شروع امتحان «${exam.startTime}» نامعتبر است.`);
    }
    if (eMin === null) {
      errors.push(`[${context}] [فیلد: endTime] فرمت ساعت پایان امتحان «${exam.endTime}» نامعتبر است.`);
    }
    if (sMin !== null && eMin !== null && sMin >= eMin) {
      errors.push(
        `[${context}] [فیلد: time] ساعت شروع امتحان (${exam.startTime}) باید قبل از ساعت پایان (${exam.endTime}) باشد.`
      );
    }
  }
}

/**
 * Validates whether an arbitrary JSON object conforms to CurriculumDataset schema structurally and semantically.
 */
export function validateCurriculumJson(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['فرمت داده نامعتبر است (شیء JSON یافت نشد).'] };
  }

  // 1. Root Dataset Validation
  if (!data.id || typeof data.id !== 'string' || !data.id.trim()) {
    errors.push('[دیتاست] [فیلد: id] شناسهٔ دوره تحصیلی (id) الزامی بوده و نباید خالی باشد.');
  }
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('[دیتاست] [فیلد: title] عنوان دوره تحصیلی (title) الزامی بوده و نباید خالی باشد.');
  }

  if (data.minUnits !== undefined && (typeof data.minUnits !== 'number' || isNaN(data.minUnits) || data.minUnits < 0)) {
    errors.push('[دیتاست] [فیلد: minUnits] حداقل مجاز واحد باید عددی نامنفی باشد.');
  }
  if (data.maxUnits !== undefined && (typeof data.maxUnits !== 'number' || isNaN(data.maxUnits) || data.maxUnits < 0)) {
    errors.push('[دیتاست] [فیلد: maxUnits] حداکثر مجاز واحد باید عددی نامنفی باشد.');
  }
  if (
    typeof data.minUnits === 'number' &&
    typeof data.maxUnits === 'number' &&
    data.minUnits > data.maxUnits
  ) {
    errors.push(
      `[دیتاست] [فیلد: minUnits / maxUnits] حداقل واحد مجاز (${data.minUnits}) نمی‌تواند از حداکثر واحد مجاز (${data.maxUnits}) بیشتر باشد.`
    );
  }

  // Audit and metadata validation (Optional)
  if (data.version !== undefined && (typeof data.version !== 'string' || !data.version.trim())) {
    errors.push('[دیتاست] [فیلد: version] نسخه دوره باید یک رشته متنی غیرخالی باشد.');
  }
  if (data.lastReviewed !== undefined && (typeof data.lastReviewed !== 'string' || !data.lastReviewed.trim())) {
    errors.push('[دیتاست] [فیلد: lastReviewed] تاریخ آخرین بررسی باید یک رشته متنی غیرخالی باشد.');
  }
  if (data.source !== undefined && (typeof data.source !== 'string' || !data.source.trim())) {
    errors.push('[دیتاست] [فیلد: source] منبع اطلاعات باید یک رشته متنی غیرخالی باشد.');
  }
  if (
    data.verificationStatus !== undefined &&
    data.verificationStatus !== 'verified' &&
    data.verificationStatus !== 'needs_review'
  ) {
    errors.push('[دیتاست] [فیلد: verificationStatus] وضعیت صحت‌سنجی باید verified یا needs_review باشد.');
  }

  // External passed courses collection
  const externalPassedSet = new Set<string>();
  if (data.externalPassedCourses !== undefined) {
    if (!Array.isArray(data.externalPassedCourses)) {
      errors.push('[دیتاست] [فیلد: externalPassedCourses] دروس پاس‌شده خارج از دوره باید یک آرایه باشد.');
    } else {
      for (const ep of data.externalPassedCourses) {
        if (typeof ep === 'string' && ep.trim()) {
          externalPassedSet.add(ep.trim());
        }
      }
    }
  }

  // 2. Courses Array Validation
  if (!Array.isArray(data.courses)) {
    errors.push('[دیتاست] [فیلد: courses] فهرست دروس (courses) باید یک آرایه باشد.');
    return { valid: false, errors };
  }
  if (data.courses.length === 0) {
    errors.push('[دیتاست] [فیلد: courses] آرایه دروس نباید خالی باشد.');
    return { valid: false, errors };
  }

  // Pre-collect all course codes in dataset for referential integrity checks
  const allCourseCodes = new Set<string>();
  for (const c of data.courses) {
    if (c && typeof c.code === 'string' && c.code.trim()) {
      allCourseCodes.add(c.code.trim());
    }
  }

  const seenCourseIds = new Map<string, number>();
  const seenCourseCodes = new Map<string, number>();

  // 3. Per-Course Structural and Semantic Validation
  data.courses.forEach((c: any, idx: number) => {
    if (!c || typeof c !== 'object' || Array.isArray(c)) {
      errors.push(`[دیتاست] [درس ردیف ${idx + 1}] ساختار اطلاعات درس نامعتبر است (شیء نیست).`);
      return;
    }

    const cLabel = c.name && typeof c.name === 'string' && c.name.trim()
      ? `درس «${c.name.trim()}» (شناسه: ${c.id || idx + 1})`
      : `درس ردیف ${idx + 1} (شناسه: ${c.id || 'نامشخص'})`;

    // ID validation & uniqueness
    if (!c.id || typeof c.id !== 'string' || !c.id.trim()) {
      errors.push(`[${cLabel}] [فیلد: id] شناسهٔ درس الزامی بوده و نباید خالی باشد.`);
    } else {
      const trimmedId = c.id.trim();
      if (seenCourseIds.has(trimmedId)) {
        errors.push(
          `[${cLabel}] [فیلد: id] شناسهٔ درس «${trimmedId}» تکراری است (قبلاً در ردیف ${seenCourseIds.get(trimmedId)! + 1} استفاده شده است).`
        );
      } else {
        seenCourseIds.set(trimmedId, idx);
      }
    }

    // Code validation & uniqueness
    if (!c.code || typeof c.code !== 'string' || !c.code.trim()) {
      errors.push(`[${cLabel}] [فیلد: code] کد درس الزامی بوده و نباید خالی باشد.`);
    } else {
      const trimmedCode = c.code.trim();
      if (seenCourseCodes.has(trimmedCode)) {
        errors.push(
          `[${cLabel}] [فیلد: code] کد درس «${trimmedCode}» تکراری است (قبلاً در ردیف ${seenCourseCodes.get(trimmedCode)! + 1} استفاده شده است).`
        );
      } else {
        seenCourseCodes.set(trimmedCode, idx);
      }
    }

    // Name validation
    if (!c.name || typeof c.name !== 'string' || !c.name.trim()) {
      errors.push(`[${cLabel}] [فیلد: name] نام درس الزامی بوده و نباید خالی باشد.`);
    }

    // Units validation
    if (!c.units || typeof c.units !== 'object' || Array.isArray(c.units)) {
      errors.push(`[${cLabel}] [فیلد: units] اطلاعات واحد درسی الزامی است.`);
    } else {
      if (typeof c.units.total !== 'number' || isNaN(c.units.total)) {
        errors.push(`[${cLabel}] [فیلد: units.total] تعداد واحد کل باید مقدار عددی باشد.`);
      } else if (c.units.total < 0) {
        errors.push(`[${cLabel}] [فیلد: units.total] تعداد واحد کل نمی‌تواند منفی باشد (مقدار: ${c.units.total}).`);
      }

      if (c.units.theory !== undefined) {
        if (typeof c.units.theory !== 'number' || isNaN(c.units.theory)) {
          errors.push(`[${cLabel}] [فیلد: units.theory] تعداد واحد نظری باید مقدار عددی باشد.`);
        } else if (c.units.theory < 0) {
          errors.push(`[${cLabel}] [فیلد: units.theory] تعداد واحد نظری نمی‌تواند منفی باشد (مقدار: ${c.units.theory}).`);
        }
      }

      if (c.units.practical !== undefined) {
        if (typeof c.units.practical !== 'number' || isNaN(c.units.practical)) {
          errors.push(`[${cLabel}] [فیلد: units.practical] تعداد واحد عملی باید مقدار عددی باشد.`);
        } else if (c.units.practical < 0) {
          errors.push(`[${cLabel}] [فیلد: units.practical] تعداد واحد عملی نمی‌تواند منفی باشد (مقدار: ${c.units.practical}).`);
        }
      }
    }

    // Theory schedule validation (Optional / array of TimeSlots)
    if (c.theorySchedule !== undefined) {
      if (!Array.isArray(c.theorySchedule)) {
        errors.push(`[${cLabel}] [فیلد: theorySchedule] برنامه ساعات نظری باید یک آرایه باشد.`);
      } else {
        validateTimeSlots(c.theorySchedule, `${cLabel} -> برنامه نظری`, errors);
      }
    }

    // Gender schedules validation (Optional)
    if (c.genderSchedules !== undefined && c.genderSchedules !== null) {
      if (typeof c.genderSchedules !== 'object' || Array.isArray(c.genderSchedules)) {
        errors.push(`[${cLabel}] [فیلد: genderSchedules] برنامه تفکیک جنسیتی باید یک شیء باشد.`);
      } else {
        if (c.genderSchedules.male !== undefined) {
          validateTimeSlots(c.genderSchedules.male, `${cLabel} -> برنامه برادران`, errors);
        }
        if (c.genderSchedules.female !== undefined) {
          validateTimeSlots(c.genderSchedules.female, `${cLabel} -> برنامه خواهران`, errors);
        }
      }
    }

    // Practical groups validation (Optional / array)
    if (c.practicalGroups !== undefined) {
      if (!Array.isArray(c.practicalGroups)) {
        errors.push(`[${cLabel}] [فیلد: practicalGroups] گروه‌های عملی باید یک آرایه باشد.`);
      } else {
        const seenGroupIds = new Set<string>();
        c.practicalGroups.forEach((group: any, gIdx: number) => {
          const gContext = `${cLabel} -> گروه عملی ${group?.name || gIdx + 1}`;
          if (!group || typeof group !== 'object' || Array.isArray(group)) {
            errors.push(`[${gContext}] ساختار اطلاعات گروه عملی نامعتبر است.`);
            return;
          }
          if (!group.id || typeof group.id !== 'string' || !group.id.trim()) {
            errors.push(`[${gContext}] [فیلد: id] شناسه گروه عملی الزامی است.`);
          } else {
            const gTrimmed = group.id.trim();
            if (seenGroupIds.has(gTrimmed)) {
              errors.push(`[${gContext}] [فیلد: id] شناسه گروه عملی «${gTrimmed}» در این درس تکراری است.`);
            } else {
              seenGroupIds.add(gTrimmed);
            }
          }
          if (!group.name || typeof group.name !== 'string' || !group.name.trim()) {
            errors.push(`[${gContext}] [فیلد: name] نام گروه عملی الزامی است.`);
          }
          if (group.slots !== undefined) {
            validateTimeSlots(group.slots, gContext, errors);
          }
        });
      }
    }

    // Prerequisites validation & referential integrity
    if (c.prerequisites !== undefined) {
      if (!Array.isArray(c.prerequisites)) {
        errors.push(`[${cLabel}] [فیلد: prerequisites] پیش‌نیازها باید یک آرایه از کدهای درسی باشد.`);
      } else {
        c.prerequisites.forEach((prereqCode: any) => {
          if (typeof prereqCode !== 'string' || !prereqCode.trim()) {
            errors.push(`[${cLabel}] [فیلد: prerequisites] کد پیش‌نیاز نامعتبر است (باید رشته متنی غیرخالی باشد).`);
            return;
          }
          const cleanCode = prereqCode.trim();
          const currentCode = typeof c.code === 'string' ? c.code.trim() : '';

          if (currentCode && cleanCode === currentCode) {
            errors.push(`[${cLabel}] [فیلد: prerequisites] یک درس نمی‌تواند پیش‌نیاز خودش باشد (کد: ${cleanCode}).`);
          } else if (!allCourseCodes.has(cleanCode) && !externalPassedSet.has(cleanCode)) {
            errors.push(
              `[${cLabel}] [فیلد: prerequisites] کد پیش‌نیاز «${cleanCode}» ناموجود است؛ این کد نه در فهرست دروس دوره و نه در دروس پاس‌شده خارج از دوره (externalPassedCourses) یافت نشد.`
            );
          }
        });
      }
    }

    // Corequisites validation & referential integrity
    if (c.corequisites !== undefined) {
      if (!Array.isArray(c.corequisites)) {
        errors.push(`[${cLabel}] [فیلد: corequisites] هم‌نیازها باید یک آرایه از کدهای درسی باشد.`);
      } else {
        c.corequisites.forEach((coreqCode: any) => {
          if (typeof coreqCode !== 'string' || !coreqCode.trim()) {
            errors.push(`[${cLabel}] [فیلد: corequisites] کد هم‌نیاز نامعتبر است (باید رشته متنی غیرخالی باشد).`);
            return;
          }
          const cleanCode = coreqCode.trim();
          const currentCode = typeof c.code === 'string' ? c.code.trim() : '';

          if (currentCode && cleanCode === currentCode) {
            errors.push(`[${cLabel}] [فیلد: corequisites] یک درس نمی‌تواند هم‌نیاز خودش باشد (کد: ${cleanCode}).`);
          } else if (!allCourseCodes.has(cleanCode)) {
            errors.push(
              `[${cLabel}] [فیلد: corequisites] کد هم‌نیاز «${cleanCode}» ناموجود است؛ در فهرست دروس این دوره درسی با این کد یافت نشد.`
            );
          }
        });
      }
    }

    // Exam validation (midterm & final)
    validateExamDetail(c.midtermExam, `${cLabel} -> امتحان میان‌ترم`, errors);
    validateExamDetail(c.finalExam, `${cLabel} -> امتحان پایان‌ترم`, errors);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parses and validates raw JSON text into a CurriculumDataset.
 */
export function parseCurriculumJson(jsonText: string): { curriculum: CurriculumDataset | null; error: string | null } {
  try {
    const parsed = JSON.parse(jsonText);
    const { valid, errors } = validateCurriculumJson(parsed);
    if (!valid) {
      return { curriculum: null, error: errors.join('\n') };
    }
    return { curriculum: parsed as CurriculumDataset, error: null };
  } catch (err: any) {
    return { curriculum: null, error: `خطا در پارس کردن فایل JSON: ${err.message}` };
  }
}

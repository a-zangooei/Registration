import { Course, CurriculumDataset } from '../types';
import defaultDatasetJson from './datasets/term-05-fall-1403.json';

// Cast imported JSON to typed CurriculumDataset
export const DEFAULT_CURRICULUM: CurriculumDataset = defaultDatasetJson as unknown as CurriculumDataset;

// Re-export common helpers and constants
export const COURSES_DATA: Course[] = DEFAULT_CURRICULUM.courses;

export const EXTERNAL_PASSED_COURSES = new Set<string>(
  DEFAULT_CURRICULUM.externalPassedCourses || []
);

export const TOTAL_REPORT_UNITS = Number(
  COURSES_DATA.reduce((sum, c) => sum + c.units.total, 0).toFixed(2)
);

/**
 * Validates whether an arbitrary JSON object conforms to CurriculumDataset schema.
 */
export function validateCurriculumJson(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['فرمت داده نامعتبر است (شیء JSON یافت نشد).'] };
  }

  if (!data.id || typeof data.id !== 'string') errors.push('فیلد شناسه دوره (id) الزامی است.');
  if (!data.title || typeof data.title !== 'string') errors.push('فیلد عنوان دوره (title) الزامی است.');
  if (!Array.isArray(data.courses)) errors.push('فهرست دروس (courses) باید یک آرایه باشد.');
  else if (data.courses.length === 0) errors.push('آرایه دروس خالی است.');

  if (Array.isArray(data.courses)) {
    data.courses.forEach((c: any, idx: number) => {
      if (!c.id) errors.push(`درس ردیف ${idx + 1} فاقد شناسه (id) است.`);
      if (!c.name) errors.push(`درس ردیف ${idx + 1} فاقد نام (name) است.`);
      if (!c.units || typeof c.units.total !== 'number') {
        errors.push(`درس "${c.name || idx + 1}" فاقد تعداد واحد کل (units.total) است.`);
      }
    });
  }

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

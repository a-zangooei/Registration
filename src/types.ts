export type DayOfWeek = 'شنبه' | 'یکشنبه' | 'دوشنبه' | 'سه‌شنبه' | 'چهارشنبه' | 'پنج‌شنبه';

export interface TimeSlot {
  day: DayOfWeek;
  startTime: string; // e.g., "08:00"
  endTime: string;   // e.g., "10:00"
  location?: string;
  label?: string;    // e.g. "نظری", "بافت", "تشریح"
  isTentative?: boolean; // بازه شناور گروه عملی (هنگامی که هنوز گروه خاصی انتخاب نشده)
  groupId?: string;
  groupName?: string;
}

export interface PracticalGroup {
  id: string;
  name: string;
  slots: TimeSlot[];
  capacity?: number;
}

export interface ExamDetail {
  date: string;       // Jalali date string e.g. "1405/08/30"
  time?: string;      // e.g. "08:30" or "10:00 - 12:00"
  startTime?: string; // e.g. "08:30"
  endTime?: string;   // e.g. "10:30"
  isFullDeletion?: boolean; // حذفی کامل
  type: 'midterm' | 'final';
  notes?: string;
}

export type CourseCategory = 'specialized' | 'general';
export type GenderRequirement = 'both' | 'male' | 'female';

export interface Course {
  id: string;
  code: string;
  name: string;
  term: number;
  courseTypeString: string; // e.g. "الزامی پایه", "شناور عمومی", "شناور پایه"
  category: CourseCategory;  // specialized (اختصاصی/پایه) or general (عمومی)
  units: {
    total: number;
    theory: number;
    practical: number;
  };
  instructors: string;
  prerequisites: string[]; // Course codes that must be passed
  corequisites?: string[]; // Course codes that must be taken simultaneously
  
  // Weekly Schedule
  theorySchedule: TimeSlot[];
  genderSchedules?: {
    male: TimeSlot[];
    female: TimeSlot[];
  };
  practicalGroups: PracticalGroup[];
  
  // Exams
  midtermExam?: ExamDetail | null;
  finalExam?: ExamDetail | null;
  examStatusDescription: string;
  
  // Color palette for calendar
  colorBadge: {
    bg: string;
    border: string;
    text: string;
    lightBg: string;
  };
}

export interface ConflictStats {
  /** تعداد جفت‌درس‌های یکتای دارای تداخل */
  uniquePairCount: number;
  /** تعداد بازه‌های زمانی متداخل (شامل جلسات کلاس و امتحانات) */
  overlappingTimeSlotCount: number;
  /** تعداد درس‌هایی که دست‌کم یک تداخل دارند */
  affectedCourseCount: number;
  /** کل تعداد علت‌ها و هشدارهای تداخل ثبت‌شده */
  totalReasonCount: number;
}

export interface ConflictReason {
  type: 'class_time' | 'exam_date' | 'prerequisite' | 'corequisite';
  title: string;
  description: string;
  conflictingWithCourseId?: string;
  conflictingWithCourseName?: string;
  details?: string;
  severity?: 'error' | 'warning';
  /** کلید یکتا برای بازه زمانی متداخل جهت جلوگیری از دوباره‌شماری تقارنی */
  intervalKey?: string;
}

export interface CourseConflictResult {
  hasConflict: boolean;
  conflicts: ConflictReason[];
  severity: 'error' | 'warning';
}

export interface StudentSelections {
  selectedCourseIds: string[];
  selectedPracticalGroups: Record<string, string>; // courseId -> practicalGroupId
  gender: 'male' | 'female';
  minUnits: number;
  maxUnits: number;
}

export interface CurriculumDataset {
  id: string;
  title: string;
  academicYear: string;
  termNumber: number;
  minUnits: number;
  maxUnits: number;
  description?: string;
  version?: string;
  lastReviewed?: string;
  source?: string;
  verificationStatus?: 'verified' | 'needs_review';
  reviewNotes?: string;
  externalPassedCourses: string[];
  courses: Course[];
}

export interface SemesterManifestItem {
  id: string;
  title: string;
  academicYear: string;
  termNumber: number;
  path: string;
  isDefault?: boolean;
  version?: string;
  lastReviewed?: string;
  source?: string;
  verificationStatus?: 'verified' | 'needs_review';
  reviewNotes?: string;
}


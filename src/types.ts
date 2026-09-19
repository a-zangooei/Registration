export type DayOfWeek = 'شنبه' | 'یکشنبه' | 'دوشنبه' | 'سه‌شنبه' | 'چهارشنبه';

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
  time?: string;      // e.g. "08:30" or "10:00"
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
  term: 3 | 4 | 5;
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

export interface ConflictReason {
  type: 'class_time' | 'exam_date' | 'prerequisite' | 'corequisite';
  title: string;
  description: string;
  conflictingWithCourseId?: string;
  conflictingWithCourseName?: string;
  details?: string;
  severity?: 'error' | 'warning';
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
}


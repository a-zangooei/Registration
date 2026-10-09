import React from 'react';
import { Course, ConflictReason, ConflictStats } from '../types';
import { AlertTriangle, Clock, Calendar, GraduationCap, Layers } from 'lucide-react';

interface ConflictSummaryProps {
  conflictMap: Record<string, ConflictReason[]>;
  conflictStats?: ConflictStats;
  courses: Course[];
  selectedCourseIds: string[];
  onRemoveCourse?: (courseId: string) => void;
}

export const ConflictSummary: React.FC<ConflictSummaryProps> = ({
  conflictMap,
  conflictStats,
  courses,
  selectedCourseIds,
  onRemoveCourse,
}) => {
  // Aggregate courses with conflicts
  const allConflicts: { course: Course; reasons: ConflictReason[] }[] = [];
  
  for (const courseId of selectedCourseIds) {
    const reasons = conflictMap[courseId] || [];
    if (reasons.length > 0) {
      const course = courses.find((c) => c.id === courseId);
      if (course) {
        allConflicts.push({ course, reasons });
      }
    }
  }

  if (allConflicts.length === 0) {
    return null;
  }

  const affectedCourseCount = conflictStats ? conflictStats.affectedCourseCount : allConflicts.length;
  const uniquePairCount = conflictStats ? conflictStats.uniquePairCount : 0;
  const overlappingSlots = conflictStats ? conflictStats.overlappingTimeSlotCount : 0;
  const totalReasons = conflictStats
    ? conflictStats.totalReasonCount
    : allConflicts.reduce((sum, c) => sum + c.reasons.length, 0);

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-rose-200/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-rose-950">
              شناسایی تعارضات در انتخاب واحد
            </h3>
            <p className="text-[11px] text-rose-800">
              جهت نهایی‌سازی برنامه، رفع تداخلات زمانی، امتحانی و رعایت پیش‌نیازها الزامی است.
            </p>
          </div>
        </div>

        {/* Distinct Conflict Stats Indicators */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {uniquePairCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-900 font-semibold shadow-2xs"
              title="تعداد جفت‌درس‌های مجزا که با یکدیگر تداخل دارند (هر جفت یک‌بار شمرده می‌شود)"
            >
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <span>جفت‌درس متداخل:</span>
              <span className="font-mono font-bold text-rose-700">{uniquePairCount}</span>
            </div>
          )}

          {overlappingSlots > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-950 font-semibold shadow-2xs"
              title="تعداد بازه‌های زمانی یا ساعات امتحان هم‌پوشان یکتا"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>بازه‌های هم‌پوشان:</span>
              <span className="font-mono font-bold text-amber-700">{overlappingSlots}</span>
            </div>
          )}

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-900 font-semibold shadow-2xs"
            title="تعداد دروسی که دست‌کم دچار یک مورد تداخل یا پیش‌نیاز شده‌اند"
          >
            <Layers className="w-3.5 h-3.5 text-rose-600" />
            <span>دروس درگیر:</span>
            <span className="font-mono font-bold text-rose-700">{affectedCourseCount}</span>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100/70 border border-rose-200 text-rose-800 font-medium"
            title="کل علل، هشدارها و جزئیات تداخل ثبت‌شده برای دروس"
          >
            <span>علل و هشدارها:</span>
            <span className="font-mono font-bold">{totalReasons}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {allConflicts.map(({ course, reasons }) => (
          <div
            key={course.id}
            className="bg-white p-3 rounded-xl border border-rose-200 text-xs text-slate-800 shadow-2xs"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 gap-2">
              <span className="font-bold text-rose-950 truncate">{course.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {course.code}
                </span>
                {onRemoveCourse && (
                  <button
                    type="button"
                    onClick={() => onRemoveCourse(course.id)}
                    className="text-[10px] text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-lg transition-colors font-bold cursor-pointer"
                    title="حذف این درس جهت رفع تداخل"
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>

            <ul className="mt-2 space-y-1.5">
              {reasons.map((r, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-snug">
                  {r.type === 'class_time' && (
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  {r.type === 'exam_date' && (
                    <Calendar className={`w-3.5 h-3.5 ${r.severity === 'warning' ? 'text-amber-600' : 'text-rose-600'} shrink-0 mt-0.5`} />
                  )}
                  {(r.type === 'prerequisite' || r.type === 'corequisite') && (
                    <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className={`font-semibold ${r.severity === 'warning' ? 'text-amber-900' : 'text-rose-900'}`}>{r.title}: </span>
                    <span className="text-slate-600">{r.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

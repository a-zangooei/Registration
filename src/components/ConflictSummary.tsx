import React from 'react';
import { Course, ConflictReason } from '../types';
import { AlertTriangle, Clock, Calendar, GraduationCap, ArrowRight, ShieldCheck } from 'lucide-react';

interface ConflictSummaryProps {
  conflictMap: Record<string, ConflictReason[]>;
  courses: Course[];
  selectedCourseIds: string[];
}

export const ConflictSummary: React.FC<ConflictSummaryProps> = ({
  conflictMap,
  courses,
  selectedCourseIds,
}) => {
  // Aggregate unique conflicts
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

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs animate-fadeIn">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-rose-950">
            شناسایی تداخلات فعال در برنامه شما ({allConflicts.length} درس دارای تداخل)
          </h3>
          <p className="text-[11px] text-rose-800">
            برای ثبت نهایی انتخاب واحد، لازم است تداخلات زمانی، امتحانی و پیش‌نیازها رفع گردند.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {allConflicts.map(({ course, reasons }) => (
          <div
            key={course.id}
            className="bg-white p-3 rounded-xl border border-rose-200 text-xs text-slate-800 shadow-2xs"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="font-bold text-rose-950 truncate">{course.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {course.code}
              </span>
            </div>

            <ul className="mt-2 space-y-1.5">
              {reasons.map((r, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-snug">
                  {r.type === 'class_time' && (
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  {r.type === 'exam_date' && (
                    <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  {(r.type === 'prerequisite' || r.type === 'corequisite') && (
                    <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-rose-900">{r.title}: </span>
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

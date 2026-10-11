import React, { useMemo, useState } from 'react';
import { Course, ConflictReason, ConflictStats, StudentSelections } from '../types';
import {
  AlertTriangle,
  Clock,
  Calendar,
  GraduationCap,
  Layers,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import {
  generateGroupAlternativeSuggestions,
  formatSlotsSummary,
  GroupAlternativeSuggestion,
} from '../utils/conflictResolver';

interface ConflictSummaryProps {
  conflictMap: Record<string, ConflictReason[]>;
  conflictStats?: ConflictStats;
  courses: Course[];
  selectedCourseIds: string[];
  selections: StudentSelections;
  externalPassedCourses?: Set<string> | string[];
  onRemoveCourse?: (courseId: string) => void;
  onApplyGroupSuggestion?: (
    courseId: string,
    newGroupId: string,
    secondaryChange?: { courseId: string; newGroupId: string }
  ) => void;
}

export const ConflictSummary: React.FC<ConflictSummaryProps> = ({
  conflictMap,
  conflictStats,
  courses,
  selectedCourseIds,
  selections,
  externalPassedCourses,
  onRemoveCourse,
  onApplyGroupSuggestion,
}) => {
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [showUnresolvableDetails, setShowUnresolvableDetails] = useState(false);
  const [appliedSuggestionId, setAppliedSuggestionId] = useState<string | null>(null);

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

  // Calculate resolution suggestions and explanations
  const resolutionReport = useMemo(() => {
    return generateGroupAlternativeSuggestions(
      selections,
      courses,
      externalPassedCourses
    );
  }, [selections, courses, externalPassedCourses]);

  if (allConflicts.length === 0) {
    return null;
  }

  const affectedCourseCount = conflictStats
    ? conflictStats.affectedCourseCount
    : allConflicts.length;
  const uniquePairCount = conflictStats ? conflictStats.uniquePairCount : 0;
  const overlappingSlots = conflictStats
    ? conflictStats.overlappingTimeSlotCount
    : 0;
  const totalReasons = conflictStats
    ? conflictStats.totalReasonCount
    : allConflicts.reduce((sum, c) => sum + c.reasons.length, 0);

  const displayedSuggestions = showAllSuggestions
    ? resolutionReport.suggestions
    : resolutionReport.suggestions.slice(0, 3);

  const handleApply = (sug: GroupAlternativeSuggestion) => {
    if (onApplyGroupSuggestion) {
      setAppliedSuggestionId(sug.id);
      onApplyGroupSuggestion(
        sug.courseId,
        sug.suggestedGroupId,
        sug.secondaryChange
          ? {
              courseId: sug.secondaryChange.courseId,
              newGroupId: sug.secondaryChange.suggestedGroupId,
            }
          : undefined
      );
      setTimeout(() => {
        setAppliedSuggestionId(null);
      }, 2000);
    }
  };

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 shadow-xs animate-fadeIn space-y-4">
      {/* Header and Statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/80">
        <div className="flex items-center gap-2.5">
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

      {/* ========================================================================= */}
      {/* SECTION 1: SMART GROUP ALTERNATIVE RECOMMENDATIONS                       */}
      {/* ========================================================================= */}
      {resolutionReport.suggestions.length > 0 && (
        <div className="bg-white border-2 border-teal-500/40 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-teal-950">
                پیشنهادهای هوشمند رفع تداخل (گروه‌های جایگزین)
              </h4>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-teal-800">
              <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 font-medium">
                {resolutionReport.suggestions.length} راه‌حل بدون تداخل شناسایی شد
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {displayedSuggestions.map((sug) => (
              <div
                key={sug.id}
                className="p-3 rounded-xl border border-teal-200/80 bg-teal-50/30 hover:bg-teal-50/60 transition-colors space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">
                      درس «{sug.courseName}»
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (جهت رفع تداخل با {sug.counterpartCourseName})
                    </span>
                    {sug.isCompleteResolution ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        رفع کامل ۱۰۰٪ تداخلات
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                        کاهش تداخل به {sug.remainingConflictCount} مورد
                      </span>
                    )}
                  </div>

                  {/* Explicit Action Button */}
                  <button
                    type="button"
                    onClick={() => handleApply(sug)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
                    title="اعمال صریح این گروه جایگزین در برنامه هفتگی"
                  >
                    {appliedSuggestionId === sug.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>اعمال شد</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>اعمال این پیشنهاد</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Change details and schedule information */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-1.5 text-[11px]">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-slate-700">
                    <div className="flex items-center gap-1 text-rose-800 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>گروه فعلی:</span>
                      <span className="font-semibold">{sug.currentGroupName}</span>
                    </div>
                    <ArrowLeft className="w-3 h-3 text-slate-400 hidden sm:inline" />
                    <div className="flex items-center gap-1 text-teal-800 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                      <span>گروه پیشنهادی:</span>
                      <span>{sug.suggestedGroupName}</span>
                    </div>
                  </div>

                  <div className="text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>زمان جلسه جدید: </span>
                    <span className="font-semibold text-slate-800">
                      {formatSlotsSummary(sug.suggestedGroupSlots)}
                    </span>
                  </div>

                  {sug.secondaryChange && (
                    <div className="text-purple-800 font-medium bg-purple-50 p-1.5 rounded border border-purple-200">
                      <span>+ تغییر هماهنگ گروه درس «{sug.secondaryChange.courseName}» به «{sug.secondaryChange.suggestedGroupName}»</span>
                    </div>
                  )}

                  {/* Calculations and impact */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-500 border-t border-slate-100">
                    <span>
                      تداخل جفت‌درس‌ها: <strong className="text-slate-700">{sug.initialConflictCount}</strong> ⬅️ <strong className="text-teal-700">{sug.remainingConflictCount}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      مجموع واحدها: <strong className="text-slate-700">{sug.totalUnits}</strong> (در محدوده مجاز)
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">
                      تداخل امتحانی: ندارد
                    </span>
                  </div>

                  {/* Missing info warnings (Requirement 4) */}
                  {sug.missingInfoWarnings.length > 0 && (
                    <div className="mt-1 p-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-900 flex items-start gap-1">
                      <Info className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">نکته اطلاعاتی: </span>
                        <span>{sug.missingInfoWarnings.join(' • ')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {resolutionReport.suggestions.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllSuggestions((prev) => !prev)}
                className="w-full py-1 text-[11px] text-teal-800 hover:text-teal-950 font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                {showAllSuggestions ? (
                  <>
                    <span>نمایش کمتر</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>
                      مشاهده {resolutionReport.suggestions.length - 3} پیشنهاد جایگزین دیگر
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: CONFLICTING COURSES BREAKDOWN                                  */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-rose-950 px-1">
          جزئیات تداخل‌های شناسایی‌شده:
        </h4>
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
                      حذف درس
                    </button>
                  )}
                </div>
              </div>

              <ul className="mt-2 space-y-1.5">
                {reasons.map((r, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-snug"
                  >
                    {r.type === 'class_time' && (
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    {r.type === 'exam_date' && (
                      <Calendar
                        className={`w-3.5 h-3.5 ${
                          r.severity === 'warning'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        } shrink-0 mt-0.5`}
                      />
                    )}
                    {(r.type === 'prerequisite' || r.type === 'corequisite') && (
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span
                        className={`font-semibold ${
                          r.severity === 'warning'
                            ? 'text-amber-900'
                            : 'text-rose-900'
                        }`}
                      >
                        {r.title}:{' '}
                      </span>
                      <span className="text-slate-600">{r.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: UNRESOLVABLE CONFLICT EXPLANATIONS (Requirement 7)             */}
      {/* ========================================================================= */}
      {resolutionReport.unresolvable.length > 0 && (
        <div className="pt-1 border-t border-rose-200/70">
          <button
            type="button"
            onClick={() => setShowUnresolvableDetails((prev) => !prev)}
            className="flex items-center justify-between w-full text-right text-[11px] font-bold text-rose-900 hover:text-rose-950 py-1 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-rose-700" />
              <span>
                چرا برخی تداخل‌ها با تغییر گروه حل نمی‌شوند؟ ({resolutionReport.unresolvable.length} مورد)
              </span>
            </div>
            {showUnresolvableDetails ? (
              <ChevronUp className="w-3.5 h-3.5 text-rose-700" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-rose-700" />
            )}
          </button>

          {showUnresolvableDetails && (
            <div className="mt-2 space-y-2 bg-white/80 p-3 rounded-xl border border-rose-200 text-[11px] text-slate-700">
              {resolutionReport.unresolvable.map((item, idx) => (
                <div key={idx} className="pb-2 border-b border-rose-100 last:border-0 last:pb-0">
                  <div className="font-bold text-rose-950 mb-0.5">
                    • تداخل درس «{item.courseName}»
                    {item.conflictingWithCourseName ? ` با «${item.conflictingWithCourseName}»` : ''}:
                  </div>
                  <p className="text-slate-600 text-[10px] leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

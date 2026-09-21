import React from 'react';
import {
  BookmarkCheck,
  Smartphone,
  Calendar,
  Clock,
  RotateCcw,
  CheckCircle2,
  Trash2,
  X,
  Sparkles,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Course } from '../types';
import { SavedSemesterSchedule } from '../utils/semesterStorage';

interface SemesterScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCourses: Course[];
  currentCourseIds: string[];
  currentPracticalGroups: Record<string, string>;
  savedSchedule: SavedSemesterSchedule | null;
  isCurrentMatchingSaved: boolean;
  onSaveCurrentAsSemester: () => void;
  onLoadSavedSemester: () => void;
  onClearSavedSemester: () => void;
}

export const SemesterScheduleModal: React.FC<SemesterScheduleModalProps> = ({
  isOpen,
  onClose,
  allCourses,
  currentCourseIds,
  currentPracticalGroups,
  savedSchedule,
  isCurrentMatchingSaved,
  onSaveCurrentAsSemester,
  onLoadSavedSemester,
  onClearSavedSemester,
}) => {
  if (!isOpen) return null;

  const currentCourses = allCourses.filter((c) => currentCourseIds.includes(c.id));
  const savedCourses = savedSchedule
    ? allCourses.filter((c) => savedSchedule.courseIds.includes(c.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        id="semester-schedule-modal"
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-linear-to-r from-teal-800 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <BookmarkCheck className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                برنامه هفتگی ترم (میانبر اندروید)
              </h3>
              <p className="text-[11px] text-teal-100/90 mt-0.5">
                ذخیره دروس قطعی برای دسترسی سریع با لمس طولانی روی آیکون
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-slate-800">
          
          {/* Android Shortcut Explainer Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5 text-amber-800">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-black text-amber-900">
                نحوه کار با میانبر در گوشی اندروید:
              </p>
              <p className="leading-relaxed text-amber-800">
                وقتی این برنامه را روی صفحه اصلی گوشی (PWA) اضافه کنید، با <strong>نگه‌داشتن انگشت روی آیکون برنامه</strong> در لانچر اندروید، گزینهٔ <strong>«برنامه هفتگی»</strong> ظاهر می‌شود. با زدن روی آن، مستقیماً همین دروس ذخیره‌شده باز خواهند شد.
              </p>
            </div>
          </div>

          {/* Current Saved Status */}
          {savedSchedule ? (
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-black text-teal-900">
                    برنامه قطعی ترم ذخیره شده است
                  </span>
                </div>
                <span className="text-[10px] text-teal-700 bg-white px-2 py-0.5 rounded-full border border-teal-200 font-bold">
                  {savedSchedule.savedAt}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-teal-100 flex items-center justify-between">
                  <span className="text-slate-500">تعداد دروس:</span>
                  <span className="font-black text-slate-800">
                    {savedSchedule.courseCount} درس
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-teal-100 flex items-center justify-between">
                  <span className="text-slate-500">مجموع واحدها:</span>
                  <span className="font-black text-slate-800">
                    {savedSchedule.totalUnits} واحد
                  </span>
                </div>
              </div>

              {/* List of saved courses preview */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-bold text-slate-600">
                  دروس ذخیره‌شده در برنامه ترم:
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {savedCourses.map((c) => (
                    <div
                      key={c.id}
                      className="text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-800 truncate max-w-[240px]">
                        {c.name}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                        {c.units.total} واحد
                        {savedSchedule.practicalGroups[c.id]
                          ? ` (گروه ${savedSchedule.practicalGroups[c.id].replace(`${c.id}_`, '')})`
                          : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status comparison with current selections */}
              {isCurrentMatchingSaved ? (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-700 bg-white p-2 rounded-xl border border-teal-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>چینش فعلی شما دقیقاً منطبق بر برنامه ذخیره‌شده ترم است.</span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                  <span className="text-amber-900 font-medium text-[11px]">
                    چینش فعلی با برنامه ذخیره‌شده متفاوت است ({currentCourseIds.length} درس در مقابل {savedSchedule.courseCount} درس).
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadSavedSemester();
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold text-[11px] hover:bg-teal-700 transition shrink-0"
                  >
                    بارگذاری برنامه ترم
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
              <Clock className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="text-xs font-black text-slate-700">
                هنوز برنامه قطعی برای ترم ذخیره نشده است
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                پس از انتخاب دروس و گروه‌های مورد نظر در سامانه، دکمه زیر را بزنید تا برنامه شما ثبت شود و با میانبر اندروید باز شود.
              </p>
            </div>
          )}

          {/* Current Selection Summary */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
            <span className="text-slate-600">
              دروس فعلی انتخاب‌شده: <strong>{currentCourses.length} درس</strong>
            </span>
            <span className="text-slate-600">
              مجموع واحدها:{' '}
              <strong>
                {currentCourses.reduce((sum, c) => sum + c.units.total, 0).toFixed(1)} واحد
              </strong>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onSaveCurrentAsSemester();
                onClose();
              }}
              disabled={currentCourses.length === 0}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs ${
                currentCourses.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>
                {savedSchedule
                  ? 'به‌روزرسانی برنامه ترم با انتخاب‌های فعلی'
                  : 'ذخیره انتخاب‌های فعلی به عنوان برنامه هفتگی ترم'}
              </span>
            </button>

            {savedSchedule && (
              <div className="flex gap-2">
                {!isCurrentMatchingSaved && (
                  <button
                    type="button"
                    onClick={() => {
                      onLoadSavedSemester();
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl border border-teal-300 bg-white text-teal-800 hover:bg-teal-50 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>بازگرداندن برنامه ذخیره‌شده</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('آیا از حذف برنامه ذخیره‌شده ترم مطمئن هستید؟')) {
                      onClearSavedSemester();
                    }
                  }}
                  className="py-2 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف ذخیره</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

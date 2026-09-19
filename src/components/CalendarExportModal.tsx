import React, { useState } from 'react';
import { Course } from '../types';
import { generateICSContent, downloadICSFile, ICSOptions } from '../utils/icsExport';
import {
  Calendar,
  CalendarDays,
  Bell,
  Clock,
  Check,
  X,
  Smartphone,
  Info,
  Download,
  BookOpen,
  CalendarCheck,
  HelpCircle,
} from 'lucide-react';

interface CalendarExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourses: Course[];
  gender: 'male' | 'female';
  selectedPracticalGroups: Record<string, string>;
}

export const CalendarExportModal: React.FC<CalendarExportModalProps> = ({
  isOpen,
  onClose,
  selectedCourses,
  gender,
  selectedPracticalGroups,
}) => {
  const [includeWeeklyClasses, setIncludeWeeklyClasses] = useState(true);
  const [includeMidtermExams, setIncludeMidtermExams] = useState(true);
  const [includeFinalExams, setIncludeFinalExams] = useState(true);
  
  // Alarm settings
  const [addAlarm, setAddAlarm] = useState(true);
  const [alarmMinutesBefore, setAlarmMinutesBefore] = useState(30);

  // Semester duration
  const [semesterWeeks, setSemesterWeeks] = useState(16);

  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const totalCourses = selectedCourses.length;

  const handleExport = () => {
    try {
      setIsExporting(true);
      const options: ICSOptions = {
        includeWeeklyClasses,
        includeMidtermExams,
        includeFinalExams,
        addAlarm,
        alarmMinutesBefore,
        semesterWeeks,
      };

      const icsContent = generateICSContent(
        selectedCourses,
        gender,
        selectedPracticalGroups,
        options
      );

      downloadICSFile(`medical-schedule-${Date.now()}.ics`, icsContent);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to export calendar:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn no-print overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                دریافت و افزودن به تقویم شخصی
              </h3>
              <p className="text-[11px] text-slate-500">
                خروجی تقویم استاندارد (Samsung Calendar، Google Calendar و تقویم آیفون)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-right">
          {/* Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CalendarCheck className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-teal-900">
                  {totalCourses > 0
                    ? `${totalCourses} درس انتخاب شده آماده انتقال به تقویم`
                    : 'هیچ درسی انتخاب نشده است'}
                </p>
                <p className="text-[11px] text-teal-700">
                  جلسات با زمان‌بندی محلی تهران (+03:30) دقیقاً روی ساعت گوشی شما تنظیم می‌شوند.
                </p>
              </div>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-teal-600 text-white shrink-0">
              {totalCourses} درس
            </span>
          </div>

          {/* Section 1: Choose Events to Export */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>رویدادهای مورد نظر برای انتقال:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Weekly Classes */}
              <label
                className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  includeWeeklyClasses
                    ? 'border-teal-500 bg-teal-50/40 text-teal-950 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50/70 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs">جلسات هفتگی کلاس‌ها</span>
                  <input
                    type="checkbox"
                    checked={includeWeeklyClasses}
                    onChange={(e) => setIncludeWeeklyClasses(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-normal">
                  تکرار هفتگی نظری و گروه‌های عملی در طول ترم
                </span>
              </label>

              {/* Midterms */}
              <label
                className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  includeMidtermExams
                    ? 'border-teal-500 bg-teal-50/40 text-teal-950 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50/70 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs">امتحانات میان‌ترم / حذفی</span>
                  <input
                    type="checkbox"
                    checked={includeMidtermExams}
                    onChange={(e) => setIncludeMidtermExams(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-normal">
                  تاریخ و ساعت دقیق آزمون‌های میان‌دوره
                </span>
              </label>

              {/* Final Exams */}
              <label
                className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  includeFinalExams
                    ? 'border-teal-500 bg-teal-50/40 text-teal-950 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50/70 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs">امتحانات نهایی پایان‌ترم</span>
                  <input
                    type="checkbox"
                    checked={includeFinalExams}
                    onChange={(e) => setIncludeFinalExams(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-normal">
                  برنامه امتحانات متمرکز دی و بهمن ماه
                </span>
              </label>
            </div>
          </div>

          {/* Section 2: Alarm & Notification Settings (Detailed Explanations) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addAlarm}
                  onChange={(e) => setAddAlarm(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span>تنظیم زنگ یادآور و اعلان (Alarm / Notification)</span>
                </span>
              </label>

              {addAlarm && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-600">زمان هشدار کلاس:</span>
                  <select
                    value={alarmMinutesBefore}
                    onChange={(e) => setAlarmMinutesBefore(Number(e.target.value))}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-medium focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value={15}>۱۵ دقیقه قبل</option>
                    <option value={30}>۳۰ دقیقه قبل (پیشنهادی)</option>
                    <option value={45}>۴۵ دقیقه قبل</option>
                    <option value={60}>۱ ساعت قبل</option>
                    <option value={120}>۲ ساعت قبل</option>
                  </select>
                </div>
              )}
            </div>

            {/* Explanatory description for Alarm feature */}
            <div className="text-[11px] text-slate-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-start gap-1.5 font-medium text-slate-700">
                <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>نحوه عملکرد آلارم در تقویم گوشی:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[10.5px] text-slate-600 pr-1">
                <li>
                  <strong className="text-slate-800">برای جلسات هفتگی کلاس‌ها:</strong> زنگ هشدار {alarmMinutesBefore} دقیقه قبل از هر جلسه به صدا در می‌آید تا برای جابجایی بین دانشکده و آزمایشگاه‌ها فرصت کافی داشته باشید.
                </li>
                <li>
                  <strong className="text-slate-800">برای آزمون‌های میان‌ترم:</strong> دو نوبت اعلان خودکار ارسال می‌شود؛ یک روز قبل (برای مرور نهایی مباحث) و ۲ ساعت پیش از ورود به جلسه.
                </li>
                <li>
                  <strong className="text-slate-800">برای آزمون‌های نهایی متمرکز:</strong> یادآورهای چندمرحله‌ای ۲ روز قبل و ۳ ساعت قبل جهت جلوگیری از هرگونه جا ماندن از سالن امتحانات تنظیم می‌شوند.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3: Device Instructions Guide (Samsung Calendar, Google Cal, Apple) */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
              <span>راهنمای وارد کردن به تقویم سامسونگ (Samsung Calendar) و دیگر برنامه‌ها:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[10.5px] text-amber-900/90 pr-1 leading-relaxed">
              <li>
                <strong>گوشی‌های سامسونگ:</strong> پس از کلیک روی دکمه دانلود، فایل <code className="bg-amber-100/90 px-1 py-0.5 rounded font-mono text-[10px]">.ics</code> باز می‌شود. در اعلان نمایش داده شده، گزینه <strong>«افزودن همه رویدادها به تقویم سامسونگ» (Import All)</strong> را انتخاب کنید.
              </li>
              <li>
                اگر فایل مستقیم باز نشد: وارد برنامه <strong>تقویم سامسونگ (Calendar)</strong> شوید، از منوی سه خط (همبرگری) گزینه تنظیمات <span className="font-semibold">مدیریت تقویم‌ها / وارد کردن رویدادها (Import events)</span> را بزنید و این فایل را انتخاب کنید.
              </li>
              <li>
                <strong>تقویم گوگل (Google Calendar) یا آیفون (iOS Calendar):</strong> روی فایل ضربه بزنید و گزینه «Add all to Calendar» را تایید فرمایید.
              </li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 gap-3">
          <div className="text-xs text-slate-500 font-medium">
            فرمت استاندارد iCalendar (RFC 5545)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || totalCourses === 0 || (!includeWeeklyClasses && !includeMidtermExams && !includeFinalExams)}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-black shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <span>در حال آماده‌سازی...</span>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>فایل تقویم دانلود شد!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>دریافت فایل تقویم (.ics)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

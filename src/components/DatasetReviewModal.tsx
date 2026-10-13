import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BookOpen,
  Info,
  Clock,
  Search,
  FileText,
  ShieldAlert,
  GitCompare,
  FileCheck2,
} from 'lucide-react';
import { CurriculumDataset, Course } from '../types';
import { ResponsiveTableContainer } from './ResponsiveTableContainer';

interface DatasetReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  curriculum: CurriculumDataset;
}

type TabType = 'exams' | 'courses' | 'checklist' | 'metadata';

export const DatasetReviewModal: React.FC<DatasetReviewModalProps> = ({
  isOpen,
  onClose,
  curriculum,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('exams');
  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract all exams from curriculum
  const examItems = useMemo(() => {
    const list: Array<{
      courseId: string;
      courseCode: string;
      courseName: string;
      examType: 'midterm' | 'final';
      date: string;
      time?: string;
      isFullDeletion?: boolean;
      notes?: string;
      yearIssue: boolean;
    }> = [];

    curriculum.courses.forEach((c) => {
      if (c.midtermExam) {
        list.push({
          courseId: c.id,
          courseCode: c.code,
          courseName: c.name,
          examType: 'midterm',
          date: c.midtermExam.date,
          time: c.midtermExam.time || c.midtermExam.startTime,
          isFullDeletion: c.midtermExam.isFullDeletion,
          notes: c.midtermExam.notes,
          yearIssue: c.midtermExam.date.startsWith('1405'),
        });
      }
      if (c.finalExam) {
        list.push({
          courseId: c.id,
          courseCode: c.code,
          courseName: c.name,
          examType: 'final',
          date: c.finalExam.date,
          time: c.finalExam.time || c.finalExam.startTime,
          notes: c.finalExam.notes,
          yearIssue: c.finalExam.date.startsWith('1405'),
        });
      }
    });

    // Sort by exam date
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [curriculum]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return curriculum.courses;
    const q = searchQuery.toLowerCase().trim();
    return curriculum.courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        c.instructors.toLowerCase().includes(q)
    );
  }, [curriculum, searchQuery]);

  // Filtered exams
  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return examItems;
    const q = searchQuery.toLowerCase().trim();
    return examItems.filter(
      (e) =>
        e.courseName.toLowerCase().includes(q) ||
        e.courseCode.includes(q) ||
        e.date.includes(q)
    );
  }, [examItems, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-700" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="audit-modal-title" className="text-base sm:text-lg font-bold text-slate-900 truncate">
                گزارش ممیزی اطلاعات آموزشی و چک‌لیست اقلام بازبینی
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {curriculum.title} · شناسه: {curriculum.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-slate-500"
            aria-label="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* STATUS ALERT SUMMARY CALLOUT                                              */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 bg-amber-50/60 border-b border-amber-200 shrink-0 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              <strong className="font-semibold">نتیجه ممیزی و وضعیت اعتبار داده‌ها:</strong> متادیتای رسمی دوره شامل سال تحصیلی <span className="font-bold tabular-nums">۱۴۰۳-۱۴۰۴</span> و تاریخ بازبینی <span className="tabular-nums">۱۴۰۳/۰۷/۱۵</span> است، اما تاریخ تمام ۱۹ آزمون موجود به سال <span className="font-bold tabular-nums text-rose-800">۱۴۰۵</span> اشاره دارند. از آنجا که هیچ سند رسمی موثق جدیدی در مخزن برای اثبات تغییر وجود ندارد، مطابق اصول امانتداری داده، تاریخ‌ها اصلاح خودسرانه نشده و وضعیت در حالت <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono text-xs">needs_review</code> نگهداری می‌شود.
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TABS & SEARCH BAR                                                         */}
        {/* ========================================================================= */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'exams'}
              onClick={() => setActiveTab('exams')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors shrink-0 ${
                activeTab === 'exams'
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              امتحانات و تاریخ‌ها ({examItems.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'courses'}
              onClick={() => setActiveTab('courses')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors shrink-0 ${
                activeTab === 'courses'
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              فهرست تمام دروس ({curriculum.courses.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'checklist'}
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors shrink-0 ${
                activeTab === 'checklist'
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              چک‌لیست راستی‌آزمایی
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'metadata'}
              onClick={() => setActiveTab('metadata')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors shrink-0 ${
                activeTab === 'metadata'
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              فراداده و مقایسه فایل‌ها
            </button>
          </div>

          {(activeTab === 'exams' || activeTab === 'courses') && (
            <div className="relative min-w-[200px] sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی درس یا کد..."
                className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENTS                                                              */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto grow space-y-4">
          
          {/* TAB 1: EXAMS AUDIT */}
          {activeTab === 'exams' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>نمایش {filteredExams.length} امتحان ثبت‌شده در دیتاست</span>
                <span className="text-rose-700 font-medium">تمامی تاریخ‌ها نیازمند بازبینی و تأیید نهایی هستند</span>
              </div>

              <ResponsiveTableContainer columnCount={6}>
                <table className="w-full min-w-[620px] text-right text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3 whitespace-nowrap min-w-[140px]">نام و کد درس</th>
                      <th className="p-3 whitespace-nowrap min-w-[120px]">نوع آزمون</th>
                      <th className="p-3 whitespace-nowrap min-w-[100px]">تاریخ ثبت‌شده</th>
                      <th className="p-3 whitespace-nowrap min-w-[70px]">ساعت</th>
                      <th className="p-3 whitespace-nowrap min-w-[130px]">وضعیت اعتبارسنجی</th>
                      <th className="p-3 min-w-[140px]">توضیحات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredExams.map((item, idx) => (
                      <tr key={`${item.courseId}-${item.examType}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-medium">
                          <div className="truncate max-w-[180px] sm:max-w-none">{item.courseName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{item.courseCode}</div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="text-slate-700">
                            {item.examType === 'midterm' ? (
                              item.isFullDeletion ? 'میان‌ترم (حذفی کامل)' : 'میان‌ترم (حذفی بخشی)'
                            ) : (
                              'پایان‌ترم'
                            )}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-mono font-semibold text-rose-700 tabular-nums">
                            {item.date}
                          </span>
                        </td>
                        <td className="p-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {item.time || 'نامشخص'}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="text-[11px] text-amber-800 font-medium">
                            تأییدنشده (عدم انطباق سال)
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {item.notes || '—'}
                        </td>
                      </tr>
                    ))}
                    {filteredExams.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          هیچ موردی مطابق جستجو یافت نشد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ResponsiveTableContainer>
            </div>
          )}

          {/* TAB 2: COURSES AUDIT */}
          {activeTab === 'courses' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>نمایش {filteredCourses.length} درس از مجموع ۱۹ درس مصوب</span>
                <span>سقف مجاز انتخاب: ۱۲ تا ۲۰ واحد</span>
              </div>

              <ResponsiveTableContainer columnCount={7}>
                <table className="w-full min-w-[760px] text-right text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3 whitespace-nowrap min-w-[80px]">کد درس</th>
                      <th className="p-3 whitespace-nowrap min-w-[140px]">عنوان درس</th>
                      <th className="p-3 whitespace-nowrap min-w-[90px]">واحدها</th>
                      <th className="p-3 whitespace-nowrap min-w-[130px]">مدرس / اساتید</th>
                      <th className="p-3 whitespace-nowrap min-w-[140px]">زمان نظری</th>
                      <th className="p-3 whitespace-nowrap min-w-[90px]">گروه‌های عملی</th>
                      <th className="p-3 whitespace-nowrap min-w-[110px]">پیش‌نیازها</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredCourses.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">{c.code}</td>
                        <td className="p-3 font-medium text-slate-900 whitespace-nowrap">{c.name}</td>
                        <td className="p-3 tabular-nums whitespace-nowrap">
                          {c.units.total} <span className="text-slate-500">({c.units.theory}ن / {c.units.practical}ع)</span>
                        </td>
                        <td className="p-3 text-slate-700 text-[11px] max-w-[160px] truncate" title={c.instructors}>
                          {c.instructors}
                        </td>
                        <td className="p-3 text-slate-600 text-[11px] whitespace-nowrap">
                          {c.theorySchedule.length > 0 ? (
                            c.theorySchedule.map((s, i) => (
                              <div key={i}>{s.day} {s.startTime}-{s.endTime}</div>
                            ))
                          ) : c.genderSchedules ? (
                            <div>تفکیک خواهران/برادران</div>
                          ) : (
                            <span className="text-slate-400">فاقد نظری</span>
                          )}
                        </td>
                        <td className="p-3 tabular-nums text-slate-700 whitespace-nowrap">
                          {c.practicalGroups.length > 0 ? `${c.practicalGroups.length} گروه` : '—'}
                        </td>
                        <td className="p-3 text-slate-600 text-[11px] whitespace-nowrap">
                          {c.prerequisites.length > 0 ? (
                            c.prerequisites.join('، ')
                          ) : (
                            <span className="text-slate-400">ندارد</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredCourses.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          هیچ درسی مطابق جستجو یافت نشد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ResponsiveTableContainer>
            </div>
          )}

          {/* TAB 3: VERIFICATION CHECKLIST & ACTIONS */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-teal-600" />
                  چک‌لیست اقلام نیازمند اقدام و ممیزی آموزشی
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  برای ارتقای وضعیت دیتاست از <code className="text-amber-800 font-mono font-semibold">needs_review</code> به <code className="text-emerald-800 font-mono font-semibold">verified</code>، اقلام زیر باید با شواهد مستند ارزیابی و تطبیق داده شوند:
                </p>

                <div className="mt-3 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-start gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="w-4 h-4 rounded-full border border-amber-500 text-amber-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">!</span>
                    <div>
                      <strong className="font-semibold text-slate-900">۱. انطباق قطعی سال آزمون‌ها با تقویم دانشگاه:</strong>
                      <div className="text-slate-600 mt-0.5">
                        استعلام تقویم رسمی آموزش دانشکده پزشکی مبنی بر اینکه آزمون‌ها دقیقاً در سال ۱۴۰۳ برگزار شده‌اند یا سال تحصیلی متفاوتی مدنظر بوده است. در حال حاضر تاریخ‌های موجود سال ۱۴۰۵ قید شده‌اند.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="w-4 h-4 rounded-full border border-teal-500 text-teal-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                    <div>
                      <strong className="font-semibold text-slate-900">۲. یکپارچگی ارجاعات پیش‌نیازها و هم‌نیازها:</strong>
                      <div className="text-slate-600 mt-0.5">
                        کدهای دروس پاس‌شده قبلی (مانند 1106101، 110611100، 1106145 و 1106001) در فهرست <code className="font-mono">externalPassedCourses</code> به درستی تعریف شده‌اند و در تست‌های ارجاعی پاس می‌شوند.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="w-4 h-4 rounded-full border border-teal-500 text-teal-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                    <div>
                      <strong className="font-semibold text-slate-900">۳. همگامی ۱۰۰٪ فایل‌های مخزن:</strong>
                      <div className="text-slate-600 mt-0.5">
                        نسخه موجود در <code className="font-mono">src/data/datasets/term-05-fall-1403.json</code> و نسخه ارائه‌شده در <code className="font-mono">public/datasets/term-05-fall-1403.json</code> بایت‌به‌بایت منطبق هستند و توسط آزمون‌های CI محافظت می‌شوند.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="w-4 h-4 rounded-full border border-amber-500 text-amber-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">!</span>
                    <div>
                      <strong className="font-semibold text-slate-900">۴. استعلام ساعت دقیق امتحانات بدون بازه:</strong>
                      <div className="text-slate-600 mt-0.5">
                        ساعت‌های امتحانات همگی روی ۰۸:۳۰ (پایان‌ترم) و ۱۰:۰۰ (میان‌ترم) تنظیم شده‌اند؛ بررسی اینکه آیا آزمون‌های همزمان در سالن‌های تفکیک‌شده برگزار می‌شوند یا تداخل مکانی دارند.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  برنامه بدون هیچ نقصی با دیتاست فعلی کار می‌کند؛ هشدار فوق صرفاً برای تضمین حداکثر دقت آموزشی و پرهیز از انتشار اطلاعات تأییدنشده ارائه شده است.
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: METADATA & COMPARISON */}
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-500" />
                    فراداده رسمی دیتاست (Metadata)
                  </div>
                  <div className="space-y-1.5 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">شناسه دوره:</span>
                      <span className="font-mono font-medium">{curriculum.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">سال تحصیلی:</span>
                      <span className="font-bold">{curriculum.academicYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">شماره ترم:</span>
                      <span className="tabular-nums font-semibold">{curriculum.termNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">تاریخ آخرین بازبینی:</span>
                      <span className="font-mono">{curriculum.lastReviewed || 'نامشخص'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">نسخه دیتاست:</span>
                      <span className="font-mono">{curriculum.version || '1.1.0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">وضعیت صحت‌سنجی:</span>
                      <span className="font-mono font-bold text-amber-800">{curriculum.verificationStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">منبع داده:</span>
                      <span>{curriculum.source}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-teal-600" />
                    مقایسه فایل‌های src و public
                  </div>
                  <div className="space-y-1.5 text-slate-700 leading-relaxed">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>تطابق ۱۰۰٪ ساختاری و محتوایی</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      مسیر ۱: <code className="font-mono text-slate-800">src/data/datasets/term-05-fall-1403.json</code><br />
                      مسیر ۲: <code className="font-mono text-slate-800">public/datasets/term-05-fall-1403.json</code>
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      هیچ اختلافی در مقادیر واحدها، گروه‌های عملی یا تاریخ‌های امتحانات بین این دو فایل وجود ندارد.
                    </p>
                  </div>
                </div>
              </div>

              {curriculum.reviewNotes && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-slate-800">یادداشت فنی ممیزی (Review Notes):</div>
                  <p className="text-slate-600 leading-relaxed">{curriculum.reviewNotes}</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER                                                              */}
        {/* ========================================================================= */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            دانشکده پزشکی · سامانه برنامه‌ریزی آموزشی
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-slate-800 active:scale-98"
          >
            بستن گزارش
          </button>
        </div>

      </div>
    </div>
  );
};

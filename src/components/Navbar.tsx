import React from 'react';
import { BookOpen, UserCheck, ShieldAlert, Sparkles, RotateCcw, Code2, Download, Share2 } from 'lucide-react';

interface NavbarProps {
  gender: 'male' | 'female';
  onGenderChange: (gender: 'male' | 'female') => void;
  conflictCount: number;
  selectedCount: number;
  totalUnits: number;
  onSelectRecommended: () => void;
  onReset: () => void;
  onOpenSchemaModal: () => void;
  onOpenExportModal: () => void;
  onOpenShareModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  gender,
  onGenderChange,
  conflictCount,
  selectedCount,
  totalUnits,
  onSelectRecommended,
  onReset,
  onOpenSchemaModal,
  onOpenExportModal,
  onOpenShareModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  سامانه هوشمند انتخاب واحد علوم پایه پزشکی
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
                  ورودی علوم پایه
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                برنامه‌ریزی دقیق برنامه کلاسی، امتحانات و تشخیص برخط تداخلات
              </p>
            </div>
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Gender Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                id="btn-gender-male"
                type="button"
                onClick={() => onGenderChange('male')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  gender === 'male'
                    ? 'bg-white text-teal-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>برادران</span>
              </button>
              <button
                id="btn-gender-female"
                type="button"
                onClick={() => onGenderChange('female')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  gender === 'female'
                    ? 'bg-white text-teal-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>خواهران</span>
              </button>
            </div>

            {/* Share Link Button */}
            <button
              id="btn-share-link"
              type="button"
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-2xs transition-colors"
              title="اشتراک‌گذاری سریع لینک با هم‌کلاسی‌ها"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">اشتراک لینک</span>
            </button>

            {/* Export Button (Desktop & Tablet) */}
            <button
              id="btn-export-trigger"
              type="button"
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
              title="خروجی یکپارچه (PDF/پرینت، HTML، عکس)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروجی و چاپ</span>
            </button>

            {/* Quick action buttons */}
            <button
              id="btn-recommended-combo"
              type="button"
              onClick={onSelectRecommended}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors"
              title="چینش استاندارد بدون تداخل تا سقف ۱۴ واحد"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>ترکیب بدون تداخل</span>
            </button>

            <button
              id="btn-schema-modal"
              type="button"
              onClick={onOpenSchemaModal}
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
              title="مشاهده ساختار داده (JSON Schema) و الگوریتم تداخل"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-600" />
              <span>مستندات</span>
            </button>

            <button
              id="btn-reset-selections"
              type="button"
              onClick={onReset}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="پاک‌سازی همه دروس"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Conflicts indicator */}
            {conflictCount > 0 ? (
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold animate-pulse"
                title={`${conflictCount} تداخل فعال در دروس انتخابی`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>{conflictCount} تداخل</span>
              </div>
            ) : selectedCount > 0 ? (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>بدون تداخل</span>
              </div>
            ) : null}

          </div>

        </div>
      </div>
    </header>
  );
};

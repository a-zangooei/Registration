import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  UserCheck,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  Code2,
  Download,
  Share2,
  Menu,
  X,
  Check,
  ChevronLeft
} from 'lucide-react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when ESC is pressed or on window resize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm md:text-base lg:text-lg font-black text-slate-900 tracking-tight truncate">
                  سامانه انتخاب واحد علوم پایه پزشکی
                </h1>
                <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-800 border border-teal-200">
                  ورودی علوم پایه
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                برنامه‌ریزی دقیق برنامه کلاسی، امتحانات و تشخیص برخط تداخلات
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MOBILE ONLY CONTROLS (< md): Minimalist view with conflict badge & Menu  */}
          {/* ========================================================================= */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {/* Mobile Conflict Badge */}
            {conflictCount > 0 && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 text-xs font-black animate-pulse"
                title={`${conflictCount} تداخل`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>{conflictCount} تداخل</span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              id="btn-mobile-menu-toggle"
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isMobileMenuOpen
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
              aria-label="منوی گزینه‌ها و تنظیمات"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4 text-slate-700" />
              )}
              <span>منو</span>
              <span className={`w-1.5 h-1.5 rounded-full ${gender === 'male' ? 'bg-sky-500' : 'bg-rose-500'}`}></span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* DESKTOP CONTROLS (md:flex): Full horizontal toolbar without crowding      */}
          {/* ========================================================================= */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
            
            {/* Gender Toggle on Desktop */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                id="btn-gender-male-desktop"
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
                id="btn-gender-female-desktop"
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
              id="btn-share-link-desktop"
              type="button"
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-2xs transition-colors"
              title="اشتراک‌گذاری سریع لینک با هم‌کلاسی‌ها"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>اشتراک لینک</span>
            </button>

            {/* Export Button */}
            <button
              id="btn-export-trigger-desktop"
              type="button"
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
              title="خروجی یکپارچه (PDF/پرینت، HTML، عکس)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>خروجی و چاپ</span>
            </button>

            {/* Quick action: Recommended Combo */}
            <button
              id="btn-recommended-combo-desktop"
              type="button"
              onClick={onSelectRecommended}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors"
              title="چینش استاندارد بدون تداخل تا سقف ۱۴ واحد"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>ترکیب پیشنهادی</span>
            </button>

            {/* Schema Docs */}
            <button
              id="btn-schema-modal-desktop"
              type="button"
              onClick={onOpenSchemaModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
              title="مشاهده ساختار داده (JSON Schema) و الگوریتم تداخل"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-600" />
              <span>مستندات</span>
            </button>

            {/* Reset */}
            <button
              id="btn-reset-selections-desktop"
              type="button"
              onClick={onReset}
              className="p-1.5 text-xs font-medium rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>بدون تداخل</span>
              </div>
            ) : null}

          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE DROPDOWN MENU (< md)                                               */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 top-14 bg-slate-900/40 z-30 md:hidden backdrop-blur-2xs animate-fadeIn"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Drawer / Dropdown */}
          <div className="relative z-40 bg-white border-b border-slate-200 px-4 py-4 space-y-4 md:hidden shadow-xl animate-fadeIn">
            
            {/* 1. Gender Selector in Mobile Menu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                تفکیک جنسیتی کلاس‌ها و گروه‌ها:
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    onGenderChange('male');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    gender === 'male'
                      ? 'bg-white text-teal-800 shadow-xs border border-teal-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-sky-600" />
                  <span>برادران</span>
                  {gender === 'male' && <Check className="w-3.5 h-3.5 text-teal-600 mr-auto" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onGenderChange('female');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    gender === 'female'
                      ? 'bg-white text-teal-800 shadow-xs border border-teal-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-rose-600" />
                  <span>خواهران</span>
                  {gender === 'female' && <Check className="w-3.5 h-3.5 text-teal-600 mr-auto" />}
                </button>
              </div>
            </div>

            {/* 2. Menu Action Items */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              {/* Share Link */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenShareModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-950 border border-indigo-200 text-xs font-bold transition-colors text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span>اشتراک‌گذاری لینک مستقیم</span>
                    <p className="text-[10px] text-indigo-600 font-normal">ارسال چینش دروس به هم‌کلاسی‌ها</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-indigo-500" />
              </button>

              {/* Recommended Combo */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSelectRecommended();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-teal-50/70 hover:bg-teal-100/70 text-teal-950 border border-teal-200 text-xs font-bold transition-colors text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span>ترکیب پیشنهادی بدون تداخل</span>
                    <p className="text-[10px] text-teal-700 font-normal">چینش خودکار تا سقف ۱۴ واحد مجاز</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-teal-600" />
              </button>

              {/* Export Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenExportModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition-colors text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span>خروجی جامع (PDF / تصویر / HTML)</span>
                    <p className="text-[10px] text-slate-500 font-normal">دانلود و چاپ آفلاین برنامه</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>

              {/* Schema Docs */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSchemaModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition-colors text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-600 text-white flex items-center justify-center shrink-0">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span>مستندات الگوریتم و JSON Schema</span>
                    <p className="text-[10px] text-slate-500 font-normal">منطق ریاضی بررسی تداخلات</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>

              {/* Reset */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onReset();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 text-rose-900 border border-rose-200 text-xs font-bold transition-colors text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <span>پاک‌سازی تمام دروس</span>
                    <p className="text-[10px] text-rose-600 font-normal">حذف کل انتخاب‌ها و شروع مجدد</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-rose-400" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>دروس انتخابی: {selectedCount} درس</span>
              <span className="font-bold text-teal-800">مجموع واحد: {totalUnits}</span>
            </div>

          </div>
        </>
      )}
    </header>
  );
};

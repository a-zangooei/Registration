import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  UserCheck,
  ShieldAlert,
  RotateCcw,
  Code2,
  Download,
  Share2,
  Menu,
  X,
  Check,
  ChevronLeft,
  ChevronDown,
  SlidersHorizontal,
  DownloadCloud,
  Calendar,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react';
import { useOfflineManager } from '../hooks/useOfflineManager';

interface NavbarProps {
  gender: 'male' | 'female';
  onGenderChange: (gender: 'male' | 'female') => void;
  conflictCount: number;
  selectedCount: number;
  totalUnits: number;
  onReset: () => void;
  onOpenSchemaModal: () => void;
  onOpenExportModal: () => void;
  onOpenCalendarModal: () => void;
  onOpenShareModal: () => void;
  onOpenOfflineModal: () => void;
  onOpenSemesterModal?: () => void;
  hasSavedSemesterSchedule?: boolean;
  needRefresh?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  gender,
  onGenderChange,
  conflictCount,
  selectedCount,
  totalUnits,
  onReset,
  onOpenSchemaModal,
  onOpenExportModal,
  onOpenCalendarModal,
  onOpenShareModal,
  onOpenOfflineModal,
  onOpenSemesterModal,
  hasSavedSemesterSchedule = false,
  needRefresh = false,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const { isFullyCached } = useOfflineManager();

  // Close menus when clicking outside, on ESC, or on window resize
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(event.target as Node)
      ) {
        setIsToolsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsToolsMenuOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          
          {/* ========================================================================= */}
          {/* LOGO & TITLE: Crystal clear on both desktop and mobile                     */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-slate-900 tracking-tight whitespace-nowrap">
              سامانه انتخاب واحد علوم پزشکی
            </h1>
          </div>

          {/* ========================================================================= */}
          {/* MOBILE ONLY CONTROLS (< md): Minimalist, spacious layout                   */}
          {/* ========================================================================= */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Conflict Badge (if any) */}
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
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
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
          {/* DESKTOP CONTROLS (md:flex): Clean, uncluttered toolbar with dropdown menu  */}
          {/* ========================================================================= */}
          <div className="hidden md:flex items-center gap-2 lg:gap-2.5 shrink-0">
            
            {/* Conflicts Indicator */}
            {conflictCount > 0 ? (
              <div
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold animate-pulse"
                title={`${conflictCount} تداخل فعال در دروس انتخابی`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>{conflictCount} تداخل</span>
              </div>
            ) : selectedCount > 0 ? (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>بدون تداخل</span>
              </div>
            ) : null}

            {/* Gender Toggle on Desktop */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                id="btn-gender-male-desktop"
                type="button"
                onClick={() => onGenderChange('male')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  gender === 'male'
                    ? 'bg-white text-teal-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>برادران</span>
              </button>
              <button
                id="btn-gender-female-desktop"
                type="button"
                onClick={() => onGenderChange('female')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  gender === 'female'
                    ? 'bg-white text-teal-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-rose-600" />
                <span>خواهران</span>
              </button>
            </div>

            {/* Direct Primary Action: Calendar */}
            <button
              id="btn-calendar-trigger-desktop"
              type="button"
              onClick={onOpenCalendarModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
              title="انتقال به تقویم شخصی (Google Calendar، Samsung Calendar و آیفون با آلارم)"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>تقویم</span>
            </button>

            {/* Share Link Button */}
            <button
              id="btn-share-link-desktop"
              type="button"
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-2xs transition-colors"
              title="اشتراک‌گذاری سریع لینک با هم‌کلاسی‌ها"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>اشتراک</span>
            </button>

            {/* Consolidated Tools & More Menu Dropdown */}
            <div className="relative" ref={toolsMenuRef}>
              <button
                id="btn-tools-menu-desktop"
                type="button"
                onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                  isToolsMenuOpen
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="سایر امکانات، وضعیت آفلاین و تنظیمات"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>امکانات</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
                {needRefresh && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>}
              </button>

              {/* Floating Dropdown Card */}
              {isToolsMenuOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
                  {/* Semester Schedule */}
                  {onOpenSemesterModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        onOpenSemesterModal();
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-teal-50 transition-colors text-right"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                          <BookmarkCheck className="w-4 h-4 text-teal-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>برنامه هفتگی ترم</span>
                            {hasSavedSemesterSchedule && (
                              <span className="text-[9px] bg-teal-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                                ذخیره شده
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-normal">میانبر اختصاصی اندروید</p>
                        </div>
                      </div>
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}

                  {/* Offline PWA Manager */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenOfflineModal();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors text-right"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white ${
                          needRefresh ? 'bg-teal-600' : isFullyCached ? 'bg-emerald-600' : 'bg-amber-600'
                        }`}
                      >
                        {needRefresh ? <Sparkles className="w-4 h-4" /> : <DownloadCloud className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>کارکرد آفلاین و دانلود</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                              needRefresh
                                ? 'bg-teal-600 text-white'
                                : isFullyCached
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {needRefresh ? 'به‌روزرسانی' : isFullyCached ? 'آفلاین فعال' : 'دانلود نشده'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-normal">ذخیره داده‌ها بدون نیاز به اینترنت</p>
                      </div>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Comprehensive Export (PDF / Image / Calendar) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenExportModal();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors text-right"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4 text-slate-700" />
                      </div>
                      <div>
                        <span>خروجی جامع و پرینت</span>
                        <p className="text-[10px] text-slate-500 font-normal">خروجی PDF، عکس و برگه انتخاب واحد</p>
                      </div>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Schema & Docs */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenSchemaModal();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors text-right"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Code2 className="w-4 h-4 text-slate-700" />
                      </div>
                      <div>
                        <span>مستندات و ساختار داده</span>
                        <p className="text-[10px] text-slate-500 font-normal">JSON Schema و الگوریتم تداخل</p>
                      </div>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <div className="h-px bg-slate-100 my-1"></div>

                  {/* Reset */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onReset();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors text-right"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-4 h-4 text-rose-600" />
                      </div>
                      <div>
                        <span>پاک‌سازی تمام دروس</span>
                        <p className="text-[10px] text-rose-500 font-normal">شروع مجدد انتخاب واحد</p>
                      </div>
                    </div>
                    <ChevronLeft className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>
              )}
            </div>

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
              {/* Calendar Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCalendarModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-200 text-xs font-bold transition-colors text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span>انتقال به تقویم شخصی</span>
                    <p className="text-[10px] text-teal-700 font-normal">تقویم سامسونگ، گوگل و آیفون با آلارم</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-teal-600" />
              </button>

              {/* Semester Schedule / Android Shortcut in Mobile Menu */}
              {onOpenSemesterModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenSemesterModal();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-teal-50/80 hover:bg-teal-100 text-teal-950 border border-teal-200 text-xs font-bold transition-colors text-right"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0">
                      <BookmarkCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>برنامه هفتگی ترم (میانبر اندروید)</span>
                        {hasSavedSemesterSchedule && (
                          <span className="text-[9px] bg-teal-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                            ذخیره شده
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-teal-700 font-normal">
                        دسترسی مستقیم با لمس طولانی روی آیکون برنامه
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-teal-600" />
                </button>
              )}

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

              {/* PWA & Offline Manager Card */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenOfflineModal();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-colors text-right ${
                  needRefresh
                    ? 'bg-teal-50 hover:bg-teal-100 border-teal-300 text-teal-950 animate-pulse'
                    : isFullyCached
                    ? 'bg-emerald-50/80 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/80 hover:bg-amber-100/80 border-amber-300 text-amber-950 animate-pulse'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 shadow-2xs ${
                      needRefresh ? 'bg-teal-600' : isFullyCached ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}
                  >
                    {needRefresh ? <Sparkles className="w-4 h-4" /> : <DownloadCloud className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span>{needRefresh ? 'به‌روزرسانی آماده اعمال است' : 'دانلود و کارکرد آفلاین (PWA)'}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                          needRefresh
                            ? 'bg-teal-600 text-white'
                            : isFullyCached
                            ? 'bg-emerald-200/90 text-emerald-900'
                            : 'bg-amber-200/90 text-amber-900'
                        }`}
                      >
                        {needRefresh ? 'نسخه جدید آماده' : isFullyCached ? 'دانلود شده' : 'نیازمند دانلود'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal">
                      {needRefresh
                        ? 'تغییرات جدید بارگیری شده؛ لمس کنید برای اعمال'
                        : isFullyCached
                        ? '۱۰۰٪ فایل‌ها در حافظه ذخیره و آماده‌اند'
                        : 'کلیک جهت دانلود و ذخیره بدون اینترنت'}
                    </p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
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
                    <span>خروجی جامع (PDF / تقویم / عکس)</span>
                    <p className="text-[10px] text-slate-500 font-normal">خروجی فایل‌ها و چاپ مستقیم A4</p>
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

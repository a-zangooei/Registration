import React, { useState } from 'react';
import { Share2, Check, Copy, ExternalLink, X, Send } from 'lucide-react';
import { Course } from '../types';
import { buildShareableUrl } from '../utils/urlSharing';
import { getShortCourseName } from '../utils/formatters';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourses: Course[];
  selectedPracticalGroups: Record<string, string>;
  gender: 'male' | 'female';
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  selectedCourses,
  selectedPracticalGroups,
  gender,
}) => {
  const [copied, setCopied] = useState(false);

  // ESC key to close modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shareUrl = buildShareableUrl({
    courseIds: selectedCourses.map((c) => c.id),
    practicalGroups: selectedPracticalGroups,
    gender,
  });

  const totalUnits = Number(
    selectedCourses.reduce((sum, c) => sum + c.units.total, 0).toFixed(2)
  );

  const lockedGroupsCount = Object.keys(selectedPracticalGroups).filter((id) =>
    selectedCourses.some((c) => c.id === id)
  ).length;

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent(
    `برنامه انتخاب واحد من (${selectedCourses.length} درس، ${totalUnits} واحد) در سامانه علوم پایه پزشکی:`
  )}`;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn no-print overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90dvh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-teal-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                اشتراک‌گذاری سریع چینش دروس
              </h3>
              <p className="text-[11px] text-slate-500">
                لینک هوشمند با ذخیره کامل دروس و گروه‌های عملی انتخابی
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          
          {/* Summary pill */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="font-bold text-teal-800">{selectedCourses.length} درس</span>
              <span>•</span>
              <span>{totalUnits} واحد</span>
              <span>•</span>
              <span className="text-slate-500">
                {lockedGroupsCount > 0
                  ? `${lockedGroupsCount} گروه عملی قطعی`
                  : 'گروه‌های شناور'}
              </span>
            </div>
            <span className="font-semibold text-teal-700">
              {gender === 'female' ? 'خواهران' : 'برادران'}
            </span>
          </div>

          {/* Courses chips */}
          {selectedCourses.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-600 mb-1.5">
                دروس موجود در این لینک:
              </div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-slate-50/80 rounded-xl border border-slate-100">
                {selectedCourses.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white text-slate-800 border border-slate-200 shadow-2xs"
                  >
                    {getShortCourseName(c.name)}
                    {selectedPracticalGroups[c.id] && (
                      <span className="text-teal-600 font-bold mr-1">✓</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* URL Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              آدرس اینترنتی فشرده شده (Shareable Link):
            </label>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
              <input
                id="share-url-input"
                type="text"
                readOnly
                value={shareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full bg-transparent text-xs text-slate-700 outline-hidden font-mono text-left direction-ltr truncate px-1"
              />
              <button
                id="btn-copy-share-url"
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی لینک</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social quick share */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <a
              href={telegramShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ارسال مستقیم به تلگرام</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>کپی مجدد</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>هر فردی این پیوند را باز کند، دقیقاً همین ترکیب را می‌بیند.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};

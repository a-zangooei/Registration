import React, { useEffect } from 'react';
import { Course } from '../types';
import { ExportContent } from './ExportContent';
import { Download, X } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourses: Course[];
  gender: 'male' | 'female';
  selectedPracticalGroups: Record<string, string>;
  minUnits: number;
  maxUnits: number;
  onOpenShareModal?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  selectedCourses,
  gender,
  selectedPracticalGroups,
  minUnits,
  maxUnits,
  onOpenShareModal,
}) => {
  // ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn no-print overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90dvh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                خروجی و چاپ انتخاب واحد
              </h3>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                ذخیره PDF، فایل HTML آفلاین، تصویر باکیفیت و لینک اشتراک
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            برنامه انتخاب واحد خود را به همراه لیست کامل دروس، جدول هفتگی و گاهشمار امتحانات با کیفیت بالا و به صورت ۱۰۰٪ آفلاین ذخیره یا چاپ نمایید.
          </p>

          <ExportContent
            selectedCourses={selectedCourses}
            gender={gender}
            selectedPracticalGroups={selectedPracticalGroups}
            minUnits={minUnits}
            maxUnits={maxUnits}
            onOpenShareModal={() => {
              onClose();
              if (onOpenShareModal) onOpenShareModal();
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertTriangle, ClipboardList, ChevronLeft } from 'lucide-react';
import { CurriculumDataset } from '../types';

interface DatasetVerificationBannerProps {
  curriculum: CurriculumDataset;
  onOpenReviewModal: () => void;
  className?: string;
}

export const DatasetVerificationBanner: React.FC<DatasetVerificationBannerProps> = ({
  curriculum,
  onOpenReviewModal,
  className = '',
}) => {
  // Only display when the verification status is explicitly 'needs_review'
  if (curriculum.verificationStatus !== 'needs_review') {
    return null;
  }

  return (
    <aside
      aria-label="هشدار ممیزی اطلاعات آموزشی"
      className={`bg-amber-50/95 border border-amber-300 text-amber-950 rounded-2xl p-3 sm:p-4 shadow-xs transition-all no-print ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        
        {/* Warning Icon & Descriptive Text */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5 text-amber-700" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-bold text-sm sm:text-base text-amber-900">
                وضعیت اطلاعات آموزشی: نیازمند بازبینی
              </span>
              <span className="text-xs text-amber-700 font-medium">
                (سال تحصیلی {curriculum.academicYear} · نسخه {curriculum.version || '1.1.0'})
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-800/90 mt-0.5 leading-relaxed">
              تاریخ‌های امتحانات به سال ۱۴۰۵ ثبت شده‌اند و نیازمند انطباق با تقویم قطعی آموزش هستند. برنامه برای استفاده فعال است، اما تاریخ‌ها تأیید قطعی نشده‌اند.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onOpenReviewModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 active:scale-98"
        >
          <ClipboardList className="w-4 h-4" aria-hidden="true" />
          <span>مشاهده جزئیات و چک‌لیست</span>
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};

import React from 'react';

export interface ResponsiveTableContainerProps {
  children: React.ReactNode;
  className?: string;
  columnCount?: number | string;
  hintText?: string;
  showMobileHint?: boolean;
}

/**
 * Universal responsive table container that supports:
 * 1. Horizontal scrolling on small screens without breaking layout.
 * 2. Unrestricted vertical touch scrolling (touch-action: auto), so user can drag vertically
 *    anywhere on the table without getting trapped or having to touch only side margins.
 * 3. Mobile hint indicator with column count.
 * 4. Future-proof for any data table added to the app.
 */
export const ResponsiveTableContainer: React.FC<ResponsiveTableContainerProps> = ({
  children,
  className = '',
  columnCount,
  hintText = '← برای مشاهده ستون‌های بیشتر به چپ بکشید',
  showMobileHint = true,
}) => {
  return (
    <div
      data-responsive-table="true"
      className={`border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white ${className}`}
    >
      <div className="overflow-x-auto overflow-y-visible touch-auto -webkit-overflow-scrolling-touch table-responsive-scroll">
        {children}
      </div>
      {showMobileHint && (
        <div className="sm:hidden px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between select-none">
          <span>{hintText}</span>
          {columnCount && (
            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
              {typeof columnCount === 'number' ? `${columnCount} ستون` : columnCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Sparkles, RefreshCw, X, ArrowUpCircle } from 'lucide-react';

interface PWAUpdateNotificationProps {
  needRefresh: boolean;
  onApplyUpdate: () => void;
  onDismiss: () => void;
}

export const PWAUpdateNotification: React.FC<PWAUpdateNotificationProps> = ({
  needRefresh,
  onApplyUpdate,
  onDismiss,
}) => {
  if (!needRefresh) return null;

  return (
    <aside
      aria-label="اعلان به‌روزرسانی سامانه"
      className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-short no-print"
    >
      <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-teal-500/40 backdrop-blur-md flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5 animate-pulse text-teal-300" />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <span>نسخه جدید سامانه آماده است!</span>
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            </h4>
            <button
              type="button"
              onClick={onDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              title="بستن موقت پیام"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            آخرین اصلاحات دروس و قابلیت‌های جدید بارگیری شدند. برای اعمال آنی، دکمه زیر را لمس کنید:
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              id="btn-pwa-apply-update"
              type="button"
              onClick={onApplyUpdate}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-teal-500/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>به‌روزرسانی فوری برنامه</span>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-2 rounded-xl text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              بعداً
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

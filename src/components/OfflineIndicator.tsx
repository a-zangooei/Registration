import React from 'react';
import { WifiOff, DownloadCloud, CheckCircle2 } from 'lucide-react';
import { useOfflineManager } from '../hooks/useOfflineManager';

export const OfflineIndicator: React.FC<{ onOpenManager: () => void }> = ({ onOpenManager }) => {
  const { isOnline, isFullyCached } = useOfflineManager();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-auto z-40 max-w-sm bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700 backdrop-blur-md flex items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4" />
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-white">حالت کاملاً آفلاین فعال است</p>
          <p className="text-[10px] text-slate-300">برنامه بدون اینترنت از حافظه داخلی کار می‌کند.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenManager}
        className="px-2.5 py-1 text-[11px] font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors shrink-0"
      >
        مدیریت
      </button>
    </div>
  );
};

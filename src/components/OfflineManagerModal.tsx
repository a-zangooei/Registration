import React from 'react';
import {
  X,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
  Check,
  ShieldCheck,
  Share2,
  ArrowDownToLine,
  HelpCircle,
} from 'lucide-react';
import { useOfflineManager } from '../hooks/useOfflineManager';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface OfflineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineManagerModal: React.FC<OfflineManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isOnline,
    isFullyCached,
    isDownloading,
    downloadProgress,
    cachedFileCount,
    lastDownloadedDate,
    downloadError,
    downloadForOffline,
  } = useOfflineManager();

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // ESC key to close
  React.useEffect(() => {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto no-print"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <DownloadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                وضعیت و دانلود نسخه آفلاین (PWA)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                شفافیت دانلود، نصب برنامه و کارکرد ۱۰۰٪ بدون اینترنت
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs text-slate-700 leading-relaxed overflow-y-auto max-h-[80vh]">
          
          {/* Transparent Status Box */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isFullyCached
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                  isFullyCached
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {isFullyCached ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black">
                    {isFullyCached
                      ? 'محتوا دانلود شده و آماده استفاده آفلاین است'
                      : 'محتوا هنوز به صورت کامل دانلود نشده است'}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isFullyCached
                        ? 'bg-emerald-200/80 text-emerald-900'
                        : 'bg-amber-200/80 text-amber-900'
                    }`}
                  >
                    {isFullyCached ? 'آماده آفلاین' : 'نیازمند دانلود'}
                  </span>
                </div>

                <p className="text-[11px] leading-relaxed opacity-90">
                  {isFullyCached
                    ? 'تمامی فایل‌های چارت درسی، تقویم هفتگی، الگوریتم تداخلات و قالب‌ها در حافظه داخلی دستگاه شما ذخیره شده‌اند و حتی با قطع کامل اینترنت کار خواهند کرد.'
                    : 'برای اطمینان از عملکرد ۱۰۰٪ آفلاین و بدون اینترنت، روی دکمه دانلود در زیر کلیک کنید.'}
                </p>

                {lastDownloadedDate && (
                  <div className="pt-2 text-[10px] flex items-center gap-1 font-semibold opacity-75">
                    <span>آخرین ذخیره و اعتبارسنجی:</span>
                    <span className="font-mono">{lastDownloadedDate}</span>
                    {cachedFileCount > 0 && (
                      <span className="mr-2">({cachedFileCount} فایل در حافظه)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Download & Cache Button (Core User Request) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-teal-700" />
                مدیریت حافظه کش و دانلود داده‌ها
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                ذخیره در Cache Storage مرورگر
              </span>
            </div>

            {/* Progress Bar (Visible while downloading) */}
            {isDownloading && (
              <div className="space-y-1.5 py-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-teal-900">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    <span>در حال بارگیری و ذخیره محتوا در دستگاه...</span>
                  </span>
                  <span className="font-mono">{downloadProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message if any */}
            {downloadError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{downloadError}</span>
              </div>
            )}

            {/* Action Trigger Button */}
            <button
              type="button"
              disabled={isDownloading}
              onClick={downloadForOffline}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isDownloading
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : isFullyCached
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
              }`}
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال ذخیره فایل‌ها... ({downloadProgress}%)</span>
                </>
              ) : isFullyCached ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>بررسی مجدد و به‌روزرسانی نسخه آفلاین</span>
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>دانلود و ذخیره تمام داده‌ها برای کارکرد آفلاین</span>
                </>
              )}
            </button>
          </div>

          {/* Installation Section (PWA Install Button) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-teal-700" />
                نصب به عنوان اپلیکیشن (PWA)
              </span>
              <span className="text-[10px] text-slate-500">
                بدون نیاز به گوگل‌پلی یا بازار
              </span>
            </div>

            {isInstalled ? (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>این برنامه در حال حاضر به عنوان اپلیکیشن روی دستگاه شما نصب است.</span>
              </div>
            ) : isInstallable ? (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-600">
                  با نصب این وب‌اپلیکیشن، آیکون برنامه به صفحه اصلی اضافه شده و به شکل تمام‌صفحه و با سرعت بالا اجرا خواهد شد.
                </p>
                <button
                  type="button"
                  onClick={install}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>نصب برنامه روی گوشی / رایانه</span>
                </button>
              </div>
            ) : isIOS ? (
              <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2 text-indigo-950">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  راهنمای نصب روی آیفون و آیپد (iOS Safari):
                </span>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-indigo-900">
                  <li>در مرورگر سافاری روی دکمه <strong>Share</strong> (مربع با فلش رو به بالا) بزنید.</li>
                  <li>منو را به پایین بکشید و گزینه <strong>Add to Home Screen</strong> را انتخاب کنید.</li>
                  <li>روی دکمه <strong>Add</strong> بزنید تا آیکون روی صفحه شما بنشیند.</li>
                </ol>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 leading-relaxed">
                این برنامه با استاندارد PWA سازگار است. از طریق منوی مرورگر خود می‌توانید گزینه <strong>«افزودن به صفحه اصلی» (Add to Home Screen)</strong> یا دکمه نصب آدرس‌بار را بزنید.
              </p>
            )}
          </div>

          {/* Connectivity Status Info */}
          <div className="flex items-center justify-between p-3 bg-slate-100/70 rounded-xl text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-emerald-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-rose-600" />
              )}
              <span>
                وضعیت اتصال: <strong>{isOnline ? 'آنلاین (متصل)' : 'آفلاین (استفاده از کش داخلی)'}</strong>
              </span>
            </div>
            <span className="text-[10px] text-slate-400">PWA Offline Engine v1.0</span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
          >
            بستن پنجره
          </button>
        </div>

      </div>
    </div>
  );
};

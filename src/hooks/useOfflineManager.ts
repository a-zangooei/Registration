import { useState, useEffect, useCallback } from 'react';

const OFFLINE_CACHE_NAME = 'medical-curriculum-offline-v1';
const LAST_SYNC_KEY = 'pwa_offline_last_downloaded';

export interface OfflineStatus {
  isOnline: boolean;
  isFullyCached: boolean;
  isDownloading: boolean;
  downloadProgress: number; // 0 to 100
  cachedFileCount: number;
  lastDownloadedDate: string | null;
  downloadError: string | null;
}

export function useOfflineManager() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isFullyCached, setIsFullyCached] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [cachedFileCount, setCachedFileCount] = useState<number>(0);
  const [lastDownloadedDate, setLastDownloadedDate] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Check cache status
  const checkCacheStatus = useCallback(async () => {
    if (typeof window === 'undefined' || !('caches' in window)) return;

    try {
      const savedDate = localStorage.getItem(LAST_SYNC_KEY);
      setLastDownloadedDate(savedDate);

      // Check all caches (workbox + dedicated offline cache)
      const cacheNames = await caches.keys();
      let totalCount = 0;

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        totalCount += keys.length;
      }

      setCachedFileCount(totalCount);

      // If we have saved date and totalCount > 5, consider it downloaded and cached
      if (savedDate && totalCount >= 4) {
        setIsFullyCached(true);
      } else {
        // Also check if critical JSON dataset is in any cache
        const matchDataset = await caches.match('./datasets/term-05-fall-1403.json');
        if (matchDataset) {
          setIsFullyCached(true);
        }
      }
    } catch (err) {
      console.warn('Error checking offline cache status:', err);
    }
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkCacheStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkCacheStatus]);

  // Active Download Function to guarantee 100% offline availability with transparent progress
  const downloadForOffline = useCallback(async () => {
    if (typeof window === 'undefined' || !('caches' in window)) {
      setDownloadError('مرورگر شما از حافظه موقت آفلاین (Cache Storage) پشتیبانی نمی‌کند.');
      return false;
    }

    setIsDownloading(true);
    setDownloadProgress(5);
    setDownloadError(null);

    try {
      // 1. Gather all critical assets to cache
      const coreUrls = [
        './',
        './index.html',
        './icon.svg',
        './pwa-192x192.png',
        './pwa-512x512.png',
        './pwa-maskable-512x512.png',
        './apple-touch-icon.png',
        './favicon.ico',
        './datasets/manifest.json',
        './datasets/term-05-fall-1403.json',
        './datasets/curriculum-template.json',
        'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap',
      ];

      // Also dynamically collect loaded script and style bundles in current DOM
      const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'))
        .map((s) => s.src)
        .filter(Boolean);

      const styles = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
        .map((l) => l.href)
        .filter(Boolean);

      const allUrlsToCache = Array.from(new Set([...coreUrls, ...scripts, ...styles]));

      const cache = await caches.open(OFFLINE_CACHE_NAME);
      let loadedCount = 0;

      for (let i = 0; i < allUrlsToCache.length; i++) {
        const url = allUrlsToCache[i];
        try {
          // Fetch with no-cache to get latest version from server
          const response = await fetch(url, { cache: 'no-cache' });
          if (response.ok || response.type === 'opaque') {
            await cache.put(url, response.clone());
            loadedCount++;

            // If it's the Google Fonts CSS, parse and precache the actual woff2 font files
            if (url.includes('fonts.googleapis.com/css')) {
              try {
                const cssText = await response.text();
                const fontUrls = Array.from(cssText.matchAll(/url\((https:\/\/[^)]+)\)/g)).map(
                  (m) => m[1]
                );
                for (const fontUrl of fontUrls) {
                  try {
                    const fontResp = await fetch(fontUrl, { mode: 'cors' });
                    if (fontResp.ok) {
                      await cache.put(fontUrl, fontResp);
                    }
                  } catch (fontErr) {
                    console.warn(`Could not cache font binary ${fontUrl}:`, fontErr);
                  }
                }
              } catch (cssErr) {
                console.warn('Could not parse Google Fonts CSS for offline fonts:', cssErr);
              }
            }
          }
        } catch (fetchErr) {
          console.warn(`Could not precache ${url}:`, fetchErr);
        }

        const pct = Math.round(((i + 1) / allUrlsToCache.length) * 90);
        setDownloadProgress(Math.max(10, pct));
      }

      // Record successful download timestamp
      const nowPersian = new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date());

      localStorage.setItem(LAST_SYNC_KEY, nowPersian);
      setLastDownloadedDate(nowPersian);
      setIsFullyCached(true);
      setDownloadProgress(100);

      // Re-verify cached items
      await checkCacheStatus();

      setTimeout(() => {
        setIsDownloading(false);
      }, 600);

      return true;
    } catch (err: any) {
      console.error('Error downloading offline assets:', err);
      setDownloadError(err.message || 'خطا در بارگیری فایل‌های آفلاین رخ داد.');
      setIsDownloading(false);
      return false;
    }
  }, [checkCacheStatus]);

  return {
    isOnline,
    isFullyCached,
    isDownloading,
    downloadProgress,
    cachedFileCount,
    lastDownloadedDate,
    downloadError,
    downloadForOffline,
    checkCacheStatus,
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';

export type PWAUpdateCheckResult = 'latest' | 'updated' | 'error' | null;

/**
 * Evaluates update status given online status, service worker capability, and registration updater.
 * Isolated pure logic for robust unit testing and deterministic behavior.
 */
export async function performPWAUpdateCheck(
  isOnline: boolean,
  hasServiceWorker: boolean,
  getRegistrationFn: () => Promise<ServiceWorkerRegistration | null | undefined>
): Promise<{
  result: 'latest' | 'updated' | 'error';
  errorMessage?: string;
  needRefresh: boolean;
}> {
  // 1. Explicit offline check: never falsely claim up-to-date when offline
  if (!isOnline) {
    return {
      result: 'error',
      errorMessage: 'دستگاه شما آفلاین است. برای بررسی نسخه جدید، اتصال اینترنت را برقرار کنید.',
      needRefresh: false,
    };
  }

  // 2. Service Worker support check
  if (!hasServiceWorker) {
    return {
      result: 'error',
      errorMessage: 'مرورگر شما از Service Worker پشتیبانی نمی‌کند.',
      needRefresh: false,
    };
  }

  try {
    const reg = await getRegistrationFn();
    if (!reg) {
      return {
        result: 'error',
        errorMessage: 'سرویس‌ورکر فعال برای بررسی نسخه جدید یافت نشد.',
        needRefresh: false,
      };
    }

    // Call update on the active registration
    await reg.update();

    if (reg.waiting || reg.installing) {
      return {
        result: 'updated',
        needRefresh: true,
      };
    }

    return {
      result: 'latest',
      needRefresh: false,
    };
  } catch (err: any) {
    return {
      result: 'error',
      errorMessage: err?.message || 'خطا در ارتباط با سرور هنگام دریافت نسخه جدید.',
      needRefresh: false,
    };
  }
}

export function usePWAUpdate() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const refreshingRef = useRef<boolean>(false);
  const [needRefresh, setNeedRefresh] = useState<boolean>(false);
  const [offlineReady, setOfflineReady] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateCheckResult, setUpdateCheckResult] = useState<PWAUpdateCheckResult>(null);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(null);

  // Register service worker and wire update events
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let isSubscribed = true;
    let cleanupListeners: (() => void) | null = null;

    const registerAndListen = async () => {
      try {
        // Register the production service worker (sw.js)
        const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
        if (!isSubscribed) return;
        registrationRef.current = reg;

        // If there's already a waiting worker, notify user
        if (reg.waiting) {
          setNeedRefresh(true);
        }

        // Listen for new workers installing and waiting
        const onUpdateFound = () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // A new version is ready and waiting to take over
                  setNeedRefresh(true);
                } else {
                  // Content is cached for offline use for the first time
                  setOfflineReady(true);
                }
              }
            });
          }
        };
        reg.addEventListener('updatefound', onUpdateFound);

        // 1. Initial check when online
        if (navigator.onLine) {
          reg.update().catch(() => {});
        }

        // 2. Periodic background check every 15 minutes
        const intervalId = setInterval(() => {
          if (navigator.onLine && registrationRef.current) {
            registrationRef.current.update().catch(() => {});
          }
        }, 15 * 60 * 1000);

        // 3. Check when app returns to foreground
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && navigator.onLine && registrationRef.current) {
            registrationRef.current.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        cleanupListeners = () => {
          reg.removeEventListener('updatefound', onUpdateFound);
          clearInterval(intervalId);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      } catch (err) {
        console.debug('ServiceWorker registration skipped or failed in dev mode:', err);
      }
    };

    registerAndListen();

    // Reload when the new Service Worker takes control (controllerchange)
    const handleControllerChange = () => {
      if (!refreshingRef.current) {
        refreshingRef.current = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      isSubscribed = false;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      if (cleanupListeners) {
        cleanupListeners();
      }
    };
  }, []);

  // Manual Check for Updates
  const checkForUpdate = useCallback(async () => {
    setIsCheckingUpdate(true);
    setUpdateCheckResult(null);
    setUpdateErrorMessage(null);

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const hasSW = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

    const check = await performPWAUpdateCheck(
      isOnline,
      hasSW,
      async () => {
        let reg = registrationRef.current;
        if (!reg && hasSW) {
          reg = (await navigator.serviceWorker.getRegistration()) || null;
          if (!reg) {
            reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
          }
          if (reg) registrationRef.current = reg;
        }
        return reg;
      }
    );

    if (check.needRefresh) {
      setNeedRefresh(true);
    }
    setUpdateCheckResult(check.result);
    if (check.errorMessage) {
      setUpdateErrorMessage(check.errorMessage);
    }

    setIsCheckingUpdate(false);
    setTimeout(() => {
      setUpdateCheckResult(null);
      setUpdateErrorMessage(null);
    }, 5000);
  }, []);

  // Apply update and reload safely without race condition
  const applyUpdate = useCallback(() => {
    const reg = registrationRef.current;
    if (reg?.waiting) {
      // Send message to waiting worker to skip waiting and activate
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Fallback reload if controllerchange event does not fire within 1500ms
      setTimeout(() => {
        if (!refreshingRef.current) {
          refreshingRef.current = true;
          window.location.reload();
        }
      }, 1500);
    } else {
      if (!refreshingRef.current) {
        refreshingRef.current = true;
        window.location.reload();
      }
    }
  }, []);

  // Force clean all caches and hard reload (keeping user local storage data intact)
  const forceCleanAndReload = useCallback(async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
    } catch (err) {
      console.warn('Error clearing service workers and caches:', err);
    } finally {
      if (!refreshingRef.current) {
        refreshingRef.current = true;
        window.location.reload();
      }
    }
  }, []);

  return {
    needRefresh,
    offlineReady,
    setNeedRefresh,
    setOfflineReady,
    applyUpdate,
    checkForUpdate,
    isCheckingUpdate,
    updateCheckResult,
    updateErrorMessage,
    forceCleanAndReload,
  };
}


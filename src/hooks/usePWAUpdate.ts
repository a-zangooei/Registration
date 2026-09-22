import { useState, useEffect, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function usePWAUpdate() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateCheckResult, setUpdateCheckResult] = useState<'latest' | 'updated' | null>(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        registrationRef.current = r;

        // 1. Immediately check for update on app startup if online
        if (navigator.onLine) {
          r.update().catch((e) => console.warn('SW initial update check:', e));
        }

        // 2. Check for update when the PWA is brought to foreground (visibilitychange)
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && navigator.onLine) {
            r.update().catch((e) => console.warn('SW visibility update check:', e));
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 3. Periodic check every 15 minutes
        const intervalId = setInterval(() => {
          if (navigator.onLine) {
            r.update().catch((e) => console.warn('SW periodic check:', e));
          }
        }, 15 * 60 * 1000);

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          clearInterval(intervalId);
        };
      }
    },
    onRegisterError(error) {
      console.warn('Service Worker registration error:', error);
    },
  });

  // Automatically reload when the new Service Worker takes control (controllerchange)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // Manual Check for Updates
  const checkForUpdate = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    setIsCheckingUpdate(true);
    setUpdateCheckResult(null);

    try {
      const reg = registrationRef.current || (await navigator.serviceWorker.getRegistration());
      if (reg) {
        registrationRef.current = reg;
        await reg.update();

        // Check if an update is waiting or installing
        if (reg.waiting || reg.installing) {
          setNeedRefresh(true);
          setUpdateCheckResult('updated');
        } else {
          // No update found, current version is up to date
          setUpdateCheckResult('latest');
        }
      } else {
        setUpdateCheckResult('latest');
      }
    } catch (err) {
      console.warn('Error checking for PWA update:', err);
      setUpdateCheckResult('latest');
    } finally {
      setIsCheckingUpdate(false);
      // Reset result after 4 seconds
      setTimeout(() => {
        setUpdateCheckResult(null);
      }, 4000);
    }
  }, [setNeedRefresh]);

  // Apply update and reload
  const applyUpdate = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  // Force clean all caches and hard reload (in case of stubborn cached assets)
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
      window.location.reload();
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
    forceCleanAndReload,
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';

export function usePWAUpdate() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [needRefresh, setNeedRefresh] = useState<boolean>(false);
  const [offlineReady, setOfflineReady] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateCheckResult, setUpdateCheckResult] = useState<'latest' | 'updated' | null>(null);

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
        // In dev mode without sw.js or if registration fails, handle gracefully
        console.debug('ServiceWorker registration skipped or failed in dev mode:', err);
      }
    };

    registerAndListen();

    // Reload when the new Service Worker takes control (controllerchange)
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
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
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setUpdateCheckResult('latest');
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
  }, []);

  // Apply update and reload
  const applyUpdate = useCallback(() => {
    const reg = registrationRef.current;
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Also trigger reload
    window.location.reload();
  }, []);

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

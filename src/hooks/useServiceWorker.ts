import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          '/Basketball-Team-Manager/sw.js',
          { scope: '/Basketball-Team-Manager/' }
        );

        console.log('[App] Service Worker registered:', registration);

        // Check for updates every 60 seconds when online
        const checkForUpdates = () => {
          if (navigator.onLine) {
            registration.update().catch((err) => {
              console.error('[App] SW update check failed:', err);
            });
          }
        };

        // Check for updates periodically
        const updateInterval = setInterval(checkForUpdates, 60000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[App] New service worker found');

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is installed but waiting to activate
                console.log('[App] New service worker installed and waiting');
                setWaitingWorker(newWorker);
                setShowUpdateBanner(true);
              }
            });
          }
        });

        // Handle controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[App] Controller changed, reloading page');
          window.location.reload();
        });

        // Initial update check
        checkForUpdates();

        return () => {
          clearInterval(updateInterval);
        };
      } catch (error) {
        console.error('[App] Service Worker registration failed:', error);
      }
    };

    registerSW();
  }, []);

  const updateServiceWorker = () => {
    if (waitingWorker) {
      console.log('[App] Sending SKIP_WAITING message to service worker');
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateBanner(false);
    }
  };

  const dismissUpdate = () => {
    setShowUpdateBanner(false);
  };

  return {
    showUpdateBanner,
    updateServiceWorker,
    dismissUpdate,
  };
}

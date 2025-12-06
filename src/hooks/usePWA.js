import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Register service worker
    const registerServiceWorker = async () => {
      // 🛑 SERVICE WORKER COMPLETELY DISABLED (sw.js file deleted)
      console.log('🚧 Service Worker DISABLED - file deleted.');
      
      // Unregister ANY existing service workers
      if ('serviceWorker' in navigator) {
         navigator.serviceWorker.getRegistrations().then(registrations => {
           for(let registration of registrations) {
             console.log('💀 Unregistering SW:', registration);
             registration.unregister();
           }
         });
      }
      return;
      
      // OLD CODE (DISABLED):
      // if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      //   console.log('🚧 Service Worker disabled on localhost to prevent caching issues.');
      //   if ('serviceWorker' in navigator) {
      //      navigator.serviceWorker.getRegistrations().then(registrations => {
      //        for(let registration of registrations) { registration.unregister(); }
      //      });
      //   }
      //   return;
      // }
      //
      // if ('serviceWorker' in navigator) {
      //   try {
      //     const registration = await navigator.serviceWorker.register('/sw.js');
      //     console.log('Service Worker registered:', registration);
      //   } catch (error) {
      //     console.error('Service Worker registration failed:', error);
      //   }
      // }
    };

    // Initialize
    checkIfInstalled();
    registerServiceWorker();

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install app function
  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // Send notification
  const sendNotification = (title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/web-app-manifest-192x192.png',
        badge: '/web-app-manifest-192x192.png',
        ...options
      });
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    requestNotificationPermission,
    sendNotification
  };
}; 
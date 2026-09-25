import { useState, useEffect, useCallback } from 'react';

export interface OnlineStatusState {
  isOnline: boolean;
  isChecking: boolean;
  lastCheckFailed: boolean;
  lastCheckedAt: Date | null;
  checkConnectivity: () => Promise<boolean>;
}

export function useOnlineStatus(): OnlineStatusState {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastCheckFailed, setLastCheckFailed] = useState<boolean>(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    setLastCheckedAt(new Date());

    // 1. Fast check with browser navigator
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setIsChecking(false);
      setLastCheckFailed(true);
      return false;
    }

    // 2. Active network probe to ensure actual internet reachability
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Probe current origin or a reliable public endpoint
      const response = await fetch(`${window.location.origin}/?ping=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Any HTTP response means the device is communicating with the server
      const healthy = response.ok || response.status < 500;
      setIsOnline(healthy);
      setLastCheckFailed(!healthy);
      setIsChecking(false);
      return healthy;
    } catch {
      // Network fetch error, timeout, or DNS resolution failure
      setIsOnline(false);
      setLastCheckFailed(true);
      setIsChecking(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      // When browser signals online, verify actively
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastCheckFailed(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setLastCheckFailed(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnectivity]);

  // Periodic auto-check when offline so app recovers automatically when Wi-Fi connects
  useEffect(() => {
    if (isOnline) return;

    const intervalId = setInterval(() => {
      checkConnectivity();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isOnline, checkConnectivity]);

  return {
    isOnline,
    isChecking,
    lastCheckFailed,
    lastCheckedAt,
    checkConnectivity,
  };
}

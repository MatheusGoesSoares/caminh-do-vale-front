import { useState, useEffect, useCallback, useRef } from 'react';

type ConnectionStatus = 'connected' | 'disconnected' | 'syncing';

interface ConnectionState {
  status: ConnectionStatus;
  lastSyncAt: Date | null;
  markSynced: () => void;
  markSyncing: () => void;
}

export function useConnectionStatus(): ConnectionState {
  const [status, setStatus] = useState<ConnectionStatus>(
    navigator.onLine ? 'connected' : 'disconnected'
  );
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function handleOnline() {
      setStatus('connected');
    }
    function handleOffline() {
      setStatus('disconnected');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const markSynced = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    setLastSyncAt(new Date());
    if (navigator.onLine) {
      setStatus('connected');
    }
  }, []);

  const markSyncing = useCallback(() => {
    setStatus('syncing');
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      setStatus(navigator.onLine ? 'connected' : 'disconnected');
    }, 10_000);
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return { status, lastSyncAt, markSynced, markSyncing };
}

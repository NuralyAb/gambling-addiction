import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from './AuthContext';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface SyncContextType {
  syncing: boolean;
  lastSynced: Date | null;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const syncNow = useCallback(async () => {
    if (!user || syncing) return;
    setSyncing(true);
    try {
      // Invalidate all cached queries to re-fetch fresh data
      await queryClient.invalidateQueries();
      setLastSynced(new Date());
    } finally {
      setSyncing(false);
    }
  }, [user, syncing, queryClient]);

  return (
    <SyncContext.Provider value={{ syncing, lastSynced, syncNow }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used inside SyncProvider');
  return ctx;
}

export { supabase };

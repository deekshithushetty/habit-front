import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client';

const QUERY_CACHE_KEY = 'taskflow-react-query-cache';

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const queryPersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    if (!canUseStorage()) return;
    window.localStorage.setItem(QUERY_CACHE_KEY, JSON.stringify(client));
  },
  restoreClient: async () => {
    if (!canUseStorage()) return undefined;

    const cached = window.localStorage.getItem(QUERY_CACHE_KEY);
    if (!cached) return undefined;

    try {
      return JSON.parse(cached) as PersistedClient;
    } catch {
      window.localStorage.removeItem(QUERY_CACHE_KEY);
      return undefined;
    }
  },
  removeClient: async () => {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(QUERY_CACHE_KEY);
  },
};

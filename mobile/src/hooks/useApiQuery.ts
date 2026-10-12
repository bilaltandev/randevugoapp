import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { SessionExpiredError, type AuthClient } from '@/api/authClient';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/errorMessage';

type Result<T> = { source: unknown; data: T | null; error: string | null };

/**
 * Loads data with the signed-in client and keeps it fresh: reloads quietly whenever the screen regains
 * focus (e.g. after an edit screen closes). An ended session is handled by AuthProvider, not shown here.
 * `fetcher` must be stable (a module function, or useCallback with its inputs); a new fetcher starts over.
 */
export function useApiQuery<T>(fetcher: (client: AuthClient) => Promise<T>) {
  const { client } = useAuth();
  // Results remember which fetcher produced them, so a changed fetcher shows "loading" without a reset.
  const [result, setResult] = useState<Result<T> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const fetchNow = useCallback(async () => {
    if (!client) return;
    const id = ++requestId.current;
    // Called through a resolved promise so even a fetcher that throws synchronously updates state
    // asynchronously (never during the effect that started it).
    await Promise.resolve(client)
      .then(fetcher)
      .then(
        (data) => {
          if (id === requestId.current) setResult({ source: fetcher, data, error: null });
        },
        (e) => {
          if (id === requestId.current && !(e instanceof SessionExpiredError)) {
            setResult({ source: fetcher, data: null, error: errorMessage(e) });
          }
        }
      );
  }, [client, fetcher]);

  useEffect(() => {
    fetchNow();
  }, [fetchNow]);

  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      fetchNow();
    }, [fetchNow])
  );

  const current = result?.source === fetcher ? result : null;
  const data = current?.data ?? null;
  const error = current?.error ?? null;

  return {
    data,
    /** Local update after a successful write, so the screen doesn't wait for a reload. */
    setData: (update: (data: T | null) => T | null) =>
      setResult((r) => (r && r.source === fetcher ? { ...r, data: update(r.data) } : r)),
    loading: data === null && !error,
    error,
    refreshing,
    refresh: async () => {
      setRefreshing(true);
      await fetchNow();
      setRefreshing(false);
    },
    retry: () => {
      setResult(null);
      fetchNow();
    },
  };
}

/**
 * Runs a write with the signed-in client. Resolves true on success; on failure resolves false after
 * storing a user-facing message in `error`.
 */
export function useApiMutation() {
  const { client } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: (client: AuthClient) => Promise<unknown>): Promise<boolean> => {
      if (!client) return false;
      setBusy(true);
      setError(null);
      try {
        await action(client);
        return true;
      } catch (e) {
        if (!(e instanceof SessionExpiredError)) setError(errorMessage(e));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [client]
  );

  return { run, busy, error, setError };
}

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { SessionExpiredError } from '@/api/authClient';
import { fetchAppointments, updateAppointmentStatus, type AppointmentQuery } from '@/api/appointments';
import { useAuth } from '@/auth/AuthProvider';
import type { Appointment, AppointmentStatus } from '@/lib/appointments';
import { errorMessage } from '@/lib/errorMessage';

const PAGE_SIZE = 30;

type Loaded = { key: string; items: Appointment[] | null; hasMore: boolean; error: string | null };

/**
 * Loads appointments for a query and keeps them fresh: reloads quietly whenever the screen regains focus,
 * so a change made in one tab shows up in the others. A session that ended is handled by AuthProvider
 * (back to the login screen), so it is not shown as a screen error here.
 *
 * With `paged`, the list comes in pages of PAGE_SIZE (`loadMore`); a quiet reload refreshes as many rows
 * as are already shown.
 */
export function useAppointments(query: AppointmentQuery & { paged?: boolean }) {
  const { client } = useAuth();
  const { date, status, search, paged, from, to } = query;
  const key = JSON.stringify([date, status, search, paged, from, to]);

  // Results remember the query they belong to, so a new query shows "loading" without a reset.
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestId = useRef(0);
  const shown = useRef(0);

  const fetchNow = useCallback(async () => {
    if (!client) return;
    const id = ++requestId.current;
    try {
      const limit = paged ? Math.min(Math.max(shown.current, PAGE_SIZE), 100) : undefined;
      const page = await fetchAppointments(client, { date, status, search, from, to, limit, offset: 0 });
      if (id !== requestId.current) return;
      shown.current = page.appointments.length;
      // Servers without the range filter return everything; keep only the asked range.
      const items = !date && (from || to) ? page.appointments.filter((a) => (!from || a.date >= from) && (!to || a.date <= to)) : page.appointments;
      setLoaded({ key, items, hasMore: page.hasMore, error: null });
    } catch (e) {
      if (id === requestId.current && !(e instanceof SessionExpiredError)) {
        setLoaded({ key, items: null, hasMore: false, error: errorMessage(e) });
      }
    }
  }, [client, date, status, search, paged, from, to, key]);

  useEffect(() => {
    shown.current = 0; // a new query starts from the first page
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

  const current = loaded?.key === key ? loaded : null;
  const items = current?.items ?? null;
  const error = current?.error ?? null;
  const hasMore = current?.hasMore ?? false;

  const loadMore = async () => {
    if (!client || !paged || !hasMore || loadingMore || !items) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const page = await fetchAppointments(client, { date, status, search, limit: PAGE_SIZE, offset: items.length });
      if (id !== requestId.current) return; // the list was reloaded meanwhile
      setLoaded((l) => {
        if (!l || l.key !== key) return l;
        const seen = new Set((l.items ?? []).map((a) => a.id));
        const merged = [...(l.items ?? []), ...page.appointments.filter((a) => !seen.has(a.id))];
        shown.current = merged.length;
        return { ...l, items: merged, hasMore: page.hasMore };
      });
    } catch (e) {
      if (!(e instanceof SessionExpiredError)) setLoaded((l) => (l && l.key === key ? { ...l, error: errorMessage(e) } : l));
    } finally {
      setLoadingMore(false);
    }
  };

  /** PATCHes the status, then updates the local copy. Throws a user-facing message on failure. */
  const setStatus = useCallback(
    async (id: string, next: AppointmentStatus) => {
      if (!client) return;
      try {
        await updateAppointmentStatus(client, id, next);
      } catch (e) {
        if (e instanceof SessionExpiredError) return;
        throw new Error(errorMessage(e));
      }
      setLoaded((l) => (l?.items ? { ...l, items: l.items.map((a) => (a.id === id ? { ...a, status: next } : a)) } : l));
    },
    [client]
  );

  return {
    items,
    loading: items === null && !error,
    error,
    refreshing,
    refresh: async () => {
      setRefreshing(true);
      await fetchNow();
      setRefreshing(false);
    },
    retry: () => {
      setLoaded(null);
      shown.current = 0;
      fetchNow();
    },
    setStatus,
    hasMore,
    loadingMore,
    loadMore,
  };
}

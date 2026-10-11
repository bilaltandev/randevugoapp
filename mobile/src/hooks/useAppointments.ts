import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, NetworkError, SessionExpiredError } from '@/api/authClient';
import { fetchAppointments, updateAppointmentStatus, type AppointmentQuery } from '@/api/appointments';
import { useAuth } from '@/auth/AuthProvider';
import type { Appointment, AppointmentStatus } from '@/lib/appointments';

export function errorMessage(error: unknown): string {
  if (error instanceof NetworkError) return 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.';
  if (error instanceof ApiError) return error.message || 'İşlem tamamlanamadı.';
  return 'Beklenmeyen bir hata oluştu.';
}

/**
 * Loads appointments for a query and keeps them fresh: reloads quietly whenever the screen regains focus,
 * so a change made in one tab shows up in the others. A session that ended is handled by AuthProvider
 * (back to the login screen), so it is not shown as a screen error here.
 */
export function useAppointments(query: AppointmentQuery) {
  const { client } = useAuth();
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);
  const { date, status } = query;

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent') => {
      if (!client) return;
      const id = ++requestId.current;
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'initial') setItems(null);
      try {
        const data = await fetchAppointments(client, { date, status });
        if (id === requestId.current) {
          setItems(data);
          setError(null);
        }
      } catch (e) {
        if (id === requestId.current && !(e instanceof SessionExpiredError)) setError(errorMessage(e));
      } finally {
        if (id === requestId.current) setRefreshing(false);
      }
    },
    [client, date, status]
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      load('silent');
    }, [load])
  );

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
      setItems((current) => current?.map((a) => (a.id === id ? { ...a, status: next } : a)) ?? current);
    },
    [client]
  );

  return {
    items,
    loading: items === null && !error,
    error,
    refreshing,
    refresh: () => load('refresh'),
    retry: () => load('initial'),
    setStatus,
  };
}

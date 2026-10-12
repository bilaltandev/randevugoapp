import type { AuthClient } from '@/api/authClient';
import type { Appointment, AppointmentStatus } from '@/lib/appointments';

// Existing web business API, called with the mobile Bearer token (getCurrentUser accepts it).

export type AppointmentQuery = {
  date?: string;
  status?: AppointmentStatus | 'ALL';
  /** Customer name or phone, matched on the server. */
  search?: string;
  /** Inclusive date range (YYYY-MM-DD), used when `date` is not given. */
  from?: string;
  to?: string;
};

export type AppointmentPage = { appointments: Appointment[]; hasMore: boolean };

/** Without `limit` the whole list comes back (hasMore false); with it, one page from `offset`. */
export async function fetchAppointments(
  client: AuthClient,
  query: AppointmentQuery & { limit?: number; offset?: number } = {}
): Promise<AppointmentPage> {
  const params = new URLSearchParams();
  if (query.date) params.set('date', query.date);
  if (!query.date && query.from) params.set('from', query.from);
  if (!query.date && query.to) params.set('to', query.to);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.limit) {
    params.set('limit', String(query.limit));
    params.set('offset', String(query.offset ?? 0));
  }
  const qs = params.toString();
  const body = await client.request<{ appointments: Appointment[]; hasMore?: boolean }>(`/api/appointments${qs ? `?${qs}` : ''}`);
  return { appointments: body.appointments ?? [], hasMore: body.hasMore === true };
}

export async function updateAppointmentStatus(client: AuthClient, id: string, status: AppointmentStatus): Promise<void> {
  await client.request('/api/appointments', { method: 'PATCH', body: { id, status } });
}

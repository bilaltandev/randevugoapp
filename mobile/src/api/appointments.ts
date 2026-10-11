import type { AuthClient } from '@/api/authClient';
import type { Appointment, AppointmentStatus } from '@/lib/appointments';

// Existing web business API, called with the mobile Bearer token (getCurrentUser accepts it).

export type AppointmentQuery = { date?: string; status?: AppointmentStatus | 'ALL' };

export async function fetchAppointments(client: AuthClient, query: AppointmentQuery = {}): Promise<Appointment[]> {
  const params = new URLSearchParams();
  if (query.date) params.set('date', query.date);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  const qs = params.toString();
  const body = await client.request<{ appointments: Appointment[] }>(`/api/appointments${qs ? `?${qs}` : ''}`);
  return body.appointments ?? [];
}

export async function updateAppointmentStatus(client: AuthClient, id: string, status: AppointmentStatus): Promise<void> {
  await client.request('/api/appointments', { method: 'PATCH', body: { id, status } });
}

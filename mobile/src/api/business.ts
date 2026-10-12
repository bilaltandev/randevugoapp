import type { AuthClient } from '@/api/authClient';
import type { Appointment, AppointmentStatus } from '@/lib/appointments';

// The web panel's business APIs, called with the mobile Bearer token (getCurrentUser accepts it).
// Shapes list only the fields the app uses.

export type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  employeeServices: { employee: { id: string; name: string } }[];
};

export type Employee = {
  id: string;
  name: string;
  specialty: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  employeeServices: { service: { id: string; name: string } }[];
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  totalAppointments: number;
  totalSpent: number;
  createdAt: string;
  appointments: { id: string; date: string; startTime: string; status: AppointmentStatus; service: { name: string } | null }[];
};

export type WorkingHour = {
  id: string;
  employeeId: string | null;
  dayOfWeek: number; // 0 = Pazar … 6 = Cumartesi
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStartTime: string | null;
  breakEndTime: string | null;
};

export type BusinessSettings = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string;
  address: string;
  city: string;
  whatsappNumber: string | null;
  enableStaffSelection: boolean;
  sector: string;
  logo: string | null;
  workingHours: WorkingHour[];
};

// ---- Services ----

export async function fetchServices(client: AuthClient): Promise<Service[]> {
  return (await client.request<{ services: Service[] }>('/api/services')).services ?? [];
}

export type ServiceInput = { name: string; description: string | null; durationMinutes: number; price: number };

export async function createService(client: AuthClient, input: ServiceInput & { employeeIds: string[] }) {
  await client.request('/api/services', { method: 'POST', body: input });
}

export async function updateService(
  client: AuthClient,
  id: string,
  input: Partial<ServiceInput> & { isActive?: boolean; employeeIds?: string[] }
) {
  await client.request('/api/services', { method: 'PUT', body: { id, ...input } });
}

export async function deleteService(client: AuthClient, id: string) {
  await client.request(`/api/services?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---- Employees ----

export async function fetchEmployees(client: AuthClient): Promise<Employee[]> {
  return (await client.request<{ employees: Employee[] }>('/api/employees')).employees ?? [];
}

export type EmployeeInput = { name: string; specialty: string; phone: string | null; email: string | null };

export async function createEmployee(client: AuthClient, input: EmployeeInput & { serviceIds: string[] }) {
  await client.request('/api/employees', { method: 'POST', body: input });
}

export async function updateEmployee(
  client: AuthClient,
  id: string,
  input: Partial<EmployeeInput> & { isActive?: boolean; serviceIds?: string[] }
) {
  await client.request('/api/employees', { method: 'PUT', body: { id, ...input } });
}

export async function deleteEmployee(client: AuthClient, id: string) {
  await client.request(`/api/employees?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---- Customers ----

export async function fetchCustomers(client: AuthClient): Promise<Customer[]> {
  return (await client.request<{ customers: Customer[] }>('/api/customers')).customers ?? [];
}

export async function updateCustomer(client: AuthClient, id: string, input: { notes?: string | null; phone?: string; email?: string | null }) {
  await client.request('/api/customers', { method: 'PATCH', body: { id, ...input } });
}

// ---- Business settings & working hours ----

export async function fetchSettings(client: AuthClient): Promise<BusinessSettings> {
  return (await client.request<{ business: BusinessSettings }>('/api/business/settings')).business;
}

export type SettingsInput = Partial<Pick<BusinessSettings, 'name' | 'description' | 'phone' | 'address' | 'city' | 'whatsappNumber' | 'enableStaffSelection' | 'sector'>> & {
  workingHours?: WorkingHour[];
};

export async function updateSettings(client: AuthClient, input: SettingsInput) {
  await client.request('/api/business/settings', { method: 'PUT', body: input });
}

// ---- Booking ----

export async function fetchAvailableSlots(
  client: AuthClient,
  query: { businessId: string; date: string; serviceId: string; employeeId: string }
): Promise<{ slots: string[]; message?: string }> {
  const qs = new URLSearchParams(query).toString();
  const body = await client.request<{ slots?: string[]; message?: string }>(`/api/appointments/available-slots?${qs}`);
  return { slots: body.slots ?? [], message: body.message };
}

export type NewAppointment = {
  businessId: string;
  serviceId: string;
  employeeId: string; // an id or "any"
  date: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  isBlockedSlot?: boolean;
};

export async function createAppointment(client: AuthClient, input: NewAppointment): Promise<Appointment> {
  return (await client.request<{ appointment: Appointment }>('/api/appointments', { method: 'POST', body: input })).appointment;
}

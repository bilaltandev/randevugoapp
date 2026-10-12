"use client";

import React, { useEffect, useState } from "react";
import { CalendarCheck2, Search, MessageSquare, CheckCircle2, Plus } from "lucide-react";
import { formatCurrency, formatPhoneNumber, cn } from "@/lib/utils";
import { getSectorDetails } from "@/lib/appointmentStatus";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { table } from "@/components/ui/table";
import { localDateKey } from "../calendar/TimeGrid";

interface AppointmentsClientProps {
  businessId: string;
  initialAppointments: any[];
  services: any[];
  employees: any[];
}

export default function AppointmentsClient({
  businessId,
  initialAppointments,
  services,
  employees,
}: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [date, setDate] = useState(() => localDateKey(new Date()));
  const [time, setTime] = useState("11:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Durum güncellenemedi.");
      }
    } catch (e) {
      console.error(e);
      alert("Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.");
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          serviceId,
          employeeId,
          date,
          startTime: time,
          customerName: name,
          customerPhone: phone,
          notes,
        }),
      });
      const data = await res.json();
      if (data.appointment) {
        setAppointments((prev) => [data.appointment, ...prev]);
        setIsNewModalOpen(false);
        setName("");
        setPhone("");
        setNotes("");
      } else {
        // e.g. 409 EMPLOYEE_TIME_CONFLICT: the API explains what to change.
        setFormError(data.error || "Rezervasyon oluşturulamadı.");
      }
    } catch (e) {
      console.error(e);
      setFormError("Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = appointments.filter((appt) => {
    const matchesTab = activeTab === "ALL" || appt.status === activeTab;
    const matchesSearch =
      !searchQuery ||
      appt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.customerPhone.includes(searchQuery) ||
      appt.service?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const countBy = (status: string) => appointments.filter((a) => a.status === status).length;

  // "Today" comes from the visitor's clock, so grouping waits for mount (server time zone may differ).
  const [todayKey, setTodayKey] = useState<string | null>(null);
  useEffect(() => setTodayKey(localKey(new Date())), []);

  const groups = groupByWhen(filtered, todayKey);

  // Sector extras (guests, table, plate); fall back to the linked table for older bookings.
  const extrasFor = (appt: any): string[] => {
    const details = getSectorDetails(appt.sectorData);
    if (details.length === 0 && appt.table) {
      details.push(appt.table.area?.name ? `${appt.table.area.name} · ${appt.table.name}` : appt.table.name);
    }
    return details;
  };

  const whatsappHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

  const renderActions = (appt: any) => (
    <>
      {appt.status === "PENDING" && (
        <Button size="sm" variant="primary" onClick={() => handleUpdateStatus(appt.id, "CONFIRMED")}>
          Onayla
        </Button>
      )}
      {appt.status === "CONFIRMED" && (
        <Button size="sm" onClick={() => handleUpdateStatus(appt.id, "COMPLETED")}>
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          Tamamla
        </Button>
      )}
      {appt.status !== "CANCELLED" && (
        <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(appt.id, "CANCELLED")}>
          İptal et
        </Button>
      )}
    </>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rezervasyonlar"
        description="Geçmiş ve gelecek tüm randevuları filtreleyin, onaylayın veya iptal edin."
        actions={
          <Button onClick={() => { setFormError(null); setIsNewModalOpen(true); }}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Manuel randevu ekle
          </Button>
        }
      />

      <Panel flush>
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:px-5 md:flex-row md:items-center md:justify-between">
          <Segmented
            aria-label="Duruma göre filtrele"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: "ALL", label: "Tümü", count: appointments.length },
              { value: "PENDING", label: "Bekleyen", count: countBy("PENDING") },
              { value: "CONFIRMED", label: "Onaylanan", count: countBy("CONFIRMED") },
              { value: "COMPLETED", label: "Tamamlanan", count: countBy("COMPLETED") },
              { value: "CANCELLED", label: "İptal", count: countBy("CANCELLED") },
            ]}
          />

          <div className="relative w-full md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <Input
              type="search"
              placeholder="İsim, telefon veya hizmet..."
              aria-label="Rezervasyon ara"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="Kayıt bulunamadı"
            description="Seçili filtreye veya aramaya uygun rezervasyon yok."
          />
        ) : (
          <>
            {/* Mobile: list rows */}
            <div className="md:hidden">
              {groups.map((group) => (
                <section key={group.label} aria-label={group.label}>
                  {group.label && (
                    <h3 className="sticky top-0 z-[1] flex items-center gap-2 border-b border-line bg-surface-muted/95 px-4 py-2 text-xs font-semibold text-ink-2 backdrop-blur-sm">
                      {group.label}
                      <span className="font-medium text-ink-3 tabular-nums">{group.items.length}</span>
                    </h3>
                  )}
                  <ul className="divide-y divide-line border-b border-line last:border-b-0">
                    {group.items.map((appt) => {
                      const extras = extrasFor(appt);
                      const cancelled = appt.status === "CANCELLED";
                      return (
                        <li key={appt.id} className={cn("space-y-2.5 px-4 py-3", appt.isBlockedSlot && "slot-blocked")}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "truncate text-sm font-medium text-ink",
                                  cancelled && "text-ink-3 line-through",
                                )}
                              >
                                {appt.customerName}
                              </p>
                              <p className="text-sm text-ink-3 tabular-nums">
                                {formatDay(appt.date)}, {appt.startTime}
                                {appt.endTime ? `–${appt.endTime}` : ""}
                              </p>
                            </div>
                            <StatusBadge status={appt.status} blocked={appt.isBlockedSlot} />
                          </div>

                          <p className="text-sm text-ink-2">
                            {[appt.service?.name, appt.employee?.name, ...extras].filter(Boolean).join(" · ")}
                            {appt.price > 0 && <span className="tabular-nums"> · {formatCurrency(appt.price)}</span>}
                          </p>

                          {appt.notes && <p className="text-sm text-ink-3">“{appt.notes}”</p>}

                          {!appt.isBlockedSlot && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <a
                                href={whatsappHref(appt.customerPhone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={buttonClasses("secondary", "sm")}
                              >
                                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                                WhatsApp
                              </a>
                              <span className="flex-1" />
                              {renderActions(appt)}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>

            {/* Desktop: table */}
            <div className={cn(table.wrapper, "hidden md:block")}>
              <table className={table.table}>
                <thead className={table.head}>
                  <tr>
                    <th className={table.th}>Tarih ve saat</th>
                    <th className={table.th}>Müşteri</th>
                    <th className={table.th}>Hizmet</th>
                    <th className={table.th}>Uzman</th>
                    <th className={table.th}>Durum</th>
                    <th className={cn(table.th, "text-right")}>İşlemler</th>
                  </tr>
                </thead>
                {groups.map((group) => (
                  <tbody key={group.label} className={cn(table.body, "border-b border-line last:border-b-0")}>
                    {group.label && (
                      <tr>
                        <th
                          colSpan={6}
                          scope="colgroup"
                          className="bg-surface-muted/60 px-4 py-2 text-left text-xs font-semibold text-ink-2 sm:px-5"
                        >
                          {group.label}
                          <span className="ml-2 font-medium text-ink-3 tabular-nums">{group.items.length}</span>
                        </th>
                      </tr>
                    )}
                    {group.items.map((appt) => {
                      const extras = extrasFor(appt);
                      const cancelled = appt.status === "CANCELLED";
                      return (
                        <tr key={appt.id} className={cn(table.row, appt.isBlockedSlot && "slot-blocked")}>
                          <td className={cn(table.td, "whitespace-nowrap tabular-nums")}>
                            <div className="font-medium text-ink">{formatDay(appt.date)}</div>
                            <div className="text-ink-3">
                              {appt.startTime}
                              {appt.endTime ? `–${appt.endTime}` : ""}
                            </div>
                          </td>

                          <td className={table.td}>
                            <div className={cn("font-medium text-ink", cancelled && "text-ink-3 line-through")}>
                              {appt.customerName}
                            </div>
                            {!appt.isBlockedSlot && (
                              <div className="text-ink-3 tabular-nums">{formatPhoneNumber(appt.customerPhone)}</div>
                            )}
                            {appt.notes && (
                              <div className="mt-0.5 max-w-[220px] truncate text-xs text-ink-3">“{appt.notes}”</div>
                            )}
                          </td>

                          <td className={table.td}>
                            <div className="text-ink">{appt.service?.name}</div>
                            <div className="text-ink-3">
                              {[...extras, appt.price > 0 ? formatCurrency(appt.price) : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          </td>

                          <td className={cn(table.td, "text-ink-2")}>{appt.employee?.name || "—"}</td>

                          <td className={cn(table.td, "whitespace-nowrap")}>
                            <StatusBadge status={appt.status} blocked={appt.isBlockedSlot} />
                          </td>

                          <td className={cn(table.td, "whitespace-nowrap text-right")}>
                            {!appt.isBlockedSlot && (
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={whatsappHref(appt.customerPhone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={buttonClasses("ghost", "sm", "w-8 px-0")}
                                  title="WhatsApp'tan yaz"
                                  aria-label={`${appt.customerName} ile WhatsApp'tan yazış`}
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </a>
                                {renderActions(appt)}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
              </table>
            </div>
          </>
        )}
      </Panel>

      {/* Manual Appointment Modal */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Manuel rezervasyon">
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <Field label="Müşteri ad soyad *" htmlFor="appt-name">
            <Input
              id="appt-name"
              type="text"
              required
              placeholder="Can Yılmaz"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Telefon numarası *" htmlFor="appt-phone">
            <Input
              id="appt-phone"
              type="tel"
              required
              placeholder="0532 111 22 33"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Hizmet" htmlFor="appt-service">
              <Select id="appt-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatCurrency(s.price)})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Uzman" htmlFor="appt-employee">
              <Select id="appt-employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tarih" htmlFor="appt-date">
              <Input id="appt-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Saat" htmlFor="appt-time">
              <Input id="appt-time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </div>

          <Field label="Not" htmlFor="appt-notes">
            <Textarea id="appt-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            {submitting ? "Oluşturuluyor..." : "Rezervasyonu kaydet"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function localKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "14 Eki Çar" from a stored "YYYY-MM-DD". */
function formatDay(date: string) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return `${d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} ${d.toLocaleDateString("tr-TR", { weekday: "short" })}`;
}

const byStart = (a: any, b: any) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);

/**
 * Upcoming first (nearest on top), then the past (most recent on top).
 * Before the client knows "today", everything stays in one unlabeled group.
 */
function groupByWhen(list: any[], todayKey: string | null): { label: string; items: any[] }[] {
  if (!todayKey) return [{ label: "", items: list }];
  const shift = (days: number) => {
    const d = new Date(`${todayKey}T00:00:00`);
    d.setDate(d.getDate() + days);
    return localKey(d);
  };
  const tomorrow = shift(1);
  const weekEnd = shift(7);
  const buckets: Record<string, any[]> = { Bugün: [], Yarın: [], "Önümüzdeki 7 gün": [], "Daha ileri": [], Geçmiş: [] };
  for (const a of list) {
    if (a.date === todayKey) buckets["Bugün"].push(a);
    else if (a.date === tomorrow) buckets["Yarın"].push(a);
    else if (a.date > tomorrow && a.date <= weekEnd) buckets["Önümüzdeki 7 gün"].push(a);
    else if (a.date > weekEnd) buckets["Daha ileri"].push(a);
    else buckets["Geçmiş"].push(a);
  }
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({
      label,
      items: label === "Geçmiş" ? [...items].sort(byStart).reverse() : [...items].sort(byStart),
    }));
}

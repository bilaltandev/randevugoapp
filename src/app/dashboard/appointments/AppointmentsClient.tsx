"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CalendarCheck2, ChevronRight, Search, MessageSquare, CheckCircle2, Phone, Plus } from "lucide-react";
import { formatCurrency, formatPhoneNumber, cn } from "@/lib/utils";
import { getSectorDetails } from "@/lib/appointmentStatus";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SheetAction, SheetRows, SideSheet } from "@/components/ui/SideSheet";
import { Segmented } from "@/components/ui/Segmented";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { eventTone, localDateKey } from "../calendar/TimeGrid";

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
  // By id, so the sheet follows status changes.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = appointments.find((a) => a.id === selectedId);
  const closeSheet = useCallback(() => setSelectedId(null), []);

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
        actions={
          <Button onClick={() => { setFormError(null); setIsNewModalOpen(true); }}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Manuel randevu ekle
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
            className="rounded-full border-transparent bg-surface-muted pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="ios-group">
          <EmptyState icon={CalendarCheck2} title="Kayıt bulunamadı" description="Seçili filtreye veya aramaya uygun rezervasyon yok." />
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.label} aria-label={group.label || "Rezervasyonlar"}>
            {group.label && (
              <h3 className="ios-section-title">
                {group.label} <span className="font-normal tabular-nums">· {group.items.length}</span>
              </h3>
            )}
            <ul className="ios-list ios-group [--ios-inset:104px]">
              {group.items.map((appt) => {
                const cancelled = appt.status === "CANCELLED";
                const summary = [appt.service?.name, appt.employee?.name, ...extrasFor(appt)].filter(Boolean).join(" · ");
                if (appt.isBlockedSlot) {
                  return (
                    <li key={appt.id} className="slot-blocked flex items-center gap-3 px-4 py-3">
                      <div className="w-[68px] shrink-0 tabular-nums">
                        <p className="text-[15px] font-semibold text-ink-2">{appt.startTime}</p>
                        <p className="whitespace-nowrap text-[11px] text-ink-3">{formatDay(appt.date)}</p>
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm text-ink-2">{appt.notes || "Kapalı saat"}</p>
                      <StatusBadge blocked />
                    </li>
                  );
                }
                return (
                  <li key={appt.id} className="flex items-center gap-2 pr-3 transition-colors hover:bg-surface-muted/60">
                    <button type="button" onClick={() => setSelectedId(appt.id)} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left">
                      <div className="w-[68px] shrink-0 tabular-nums">
                        <p className={cn("text-[15px] font-semibold text-ink", cancelled && "text-ink-3")}>{appt.startTime}</p>
                        <p className="whitespace-nowrap text-[11px] text-ink-3">{formatDay(appt.date)}</p>
                      </div>
                      <span className={cn("h-2 w-2 shrink-0 rounded-full bg-(--tone)", eventTone(appt).replace("line-through", ""))} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-[15px] font-medium text-ink", cancelled && "text-ink-3 line-through")}>{appt.customerName}</p>
                        <p className="truncate text-[13px] text-ink-3">
                          {summary}
                          {appt.price > 0 && <span className="tabular-nums"> · {formatCurrency(appt.price)}</span>}
                        </p>
                      </div>
                    </button>
                    <span className="hidden sm:inline-flex">
                      <StatusBadge status={appt.status} />
                    </span>
                    {appt.status === "PENDING" && (
                      <Button size="sm" variant="primary" className="hidden md:inline-flex" onClick={() => handleUpdateStatus(appt.id, "CONFIRMED")}>
                        Onayla
                      </Button>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {selected && (
        <SideSheet title="Rezervasyon" onClose={closeSheet}>
          <div className="space-y-5">
            <div>
              <p className="font-display text-[26px] font-semibold leading-tight tracking-[-0.03em] text-ink">{selected.customerName}</p>
              <div className="mt-2">
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div className="flex justify-center gap-2">
              <SheetAction icon={Phone} label="Ara" href={`tel:${selected.customerPhone}`} />
              <SheetAction icon={MessageSquare} label="WhatsApp" href={whatsappHref(selected.customerPhone)} external />
            </div>

            <SheetRows
              rows={[
                ["Tarih", formatDay(selected.date)],
                ["Saat", `${selected.startTime}${selected.endTime ? `–${selected.endTime}` : ""}`],
                ["Hizmet", selected.service?.name],
                ["Uzman", selected.employee?.name],
                ...extrasFor(selected).map((detail, i): [string, string] => [i === 0 ? "Detay" : " ", detail]),
                ["Telefon", formatPhoneNumber(selected.customerPhone)],
                ["Tutar", formatCurrency(selected.price)],
              ]}
            />

            {selected.notes && (
              <div>
                <p className="px-1 pb-1 text-[13px] font-medium text-ink-3">Müşteri notu</p>
                <p className="rounded-[14px] bg-surface-muted/60 px-3.5 py-2.5 text-sm text-ink-2">{selected.notes}</p>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">{renderActions(selected)}</div>
          </div>
        </SideSheet>
      )}

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

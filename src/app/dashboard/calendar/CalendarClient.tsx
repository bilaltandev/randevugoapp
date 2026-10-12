"use client";

import React, { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { TimeGrid, localDateKey } from "./TimeGrid";

interface CalendarClientProps {
  businessId: string;
  initialAppointments: any[];
  services: any[];
  employees: any[];
}

export default function CalendarClient({
  businessId,
  initialAppointments,
  services,
  employees,
}: CalendarClientProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // "Yeni randevu" shortcuts link here with ?new=1 to open the create dialog directly.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const openedFromLink = searchParams.get("new") === "1";
  const closeNewModal = () => {
    setIsNewModalOpen(false);
    if (openedFromLink) router.replace(pathname, { scroll: false });
  };
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

  // New appointment form state
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newServiceId, setNewServiceId] = useState(services[0]?.id || "");
  const [newEmployeeId, setNewEmployeeId] = useState(employees[0]?.id || "");
  const [newDate, setNewDate] = useState(() => localDateKey(new Date()));
  const [newStartTime, setNewStartTime] = useState("10:00");
  const [newNotes, setNewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Block slot form state
  const [blockDate, setBlockDate] = useState(() => localDateKey(new Date()));
  const [blockEmployeeId, setBlockEmployeeId] = useState(employees[0]?.id || "");
  const [blockError, setBlockError] = useState<string | null>(null);
  const [blockTime, setBlockTime] = useState("12:00");
  const [blockReason, setBlockReason] = useState("Öğle Molası / Kişisel İş");


  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Submit new appointment
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
          serviceId: newServiceId,
          employeeId: newEmployeeId,
          date: newDate,
          startTime: newStartTime,
          customerName: newCustName,
          customerPhone: newCustPhone,
          notes: newNotes,
        }),
      });
      const data = await res.json();
      if (data.appointment) {
        setAppointments((prev) => [data.appointment, ...prev]);
        closeNewModal();
        setNewCustName("");
        setNewCustPhone("");
        setNewNotes("");
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

  // Submit block slot
  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockError(null);
    const srv = services[0];
    const emp = employees.find((x) => x.id === blockEmployeeId) ?? employees[0];
    if (!srv || !emp) {
      setBlockError("Saat kapatmak için en az bir hizmet ve bir çalışan tanımlı olmalıdır.");
      return;
    }
    setSubmitting(true);
    try {

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          serviceId: srv.id,
          employeeId: emp.id,
          date: blockDate,
          startTime: blockTime,
          customerName: `[KAPALI: ${blockReason}]`,
          customerPhone: "0000000000",
          notes: blockReason,
          isBlockedSlot: true,
        }),
      });
      const data = await res.json();
      if (data.appointment) {
        setAppointments((prev) => [data.appointment, ...prev]);
        setIsBlockModalOpen(false);
      } else {
        setBlockError(data.error || "Saat kapatılamadı.");
      }
    } catch (e) {
      console.error(e);
      setBlockError("Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  // Update Status
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        );
        if (selectedAppt) {
          setSelectedAppt((prev: any) => ({ ...prev, status: newStatus }));
        }
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Durum güncellenemedi.");
      }
    } catch (e) {
      console.error(e);
      alert("Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.");
    }
  };

  // Helper to generate days of current week
  const getDaysOfWeek = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(current.setDate(diff));

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      weekDays.push(nextDay);
    }
    return weekDays;
  };

  const weekDays = getDaysOfWeek(currentDate);

  const todayKey = localDateKey(new Date());

  // Click on an empty spot in the grid: open "Yeni rezervasyon" prefilled with that day and time.
  const handleCreateAt = (dateKey: string, time: string) => {
    setNewDate(dateKey);
    setNewStartTime(time);
    setFormError(null);
    setIsNewModalOpen(true);
  };

  // Month grid: Monday-first, padded so day 1 sits under its weekday.
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const rangeLabel =
    viewMode === "week"
      ? weekStart.getMonth() === weekEnd.getMonth()
        ? `${weekStart.getDate()}–${weekEnd.getDate()} ${weekEnd.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}`
        : `${weekStart.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}`
      : viewMode === "day"
      ? `${currentDate.toLocaleDateString("tr-TR", { weekday: "long" })}, ${currentDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}`
      : currentDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Takvim"
        description="Randevuları gün, hafta veya ay görünümünde takip edin."
        actions={
          <>
            <Button onClick={() => { setBlockError(null); setIsBlockModalOpen(true); }}>
              <Lock className="w-4 h-4" aria-hidden="true" />
              Saat kapat
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-control border border-line-strong bg-surface shadow-[0_1px_2px_rgba(13,17,23,0.05)]">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-9 w-9 items-center justify-center text-ink-2 hover:bg-surface-muted hover:text-ink rounded-l-control"
              aria-label="Önceki"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="h-9 border-x border-line px-3 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              Bugün
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex h-9 w-9 items-center justify-center text-ink-2 hover:bg-surface-muted hover:text-ink rounded-r-control"
              aria-label="Sonraki"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="ml-1 font-display text-lg font-bold tracking-[-0.02em] text-ink first-letter:uppercase sm:text-xl" aria-live="polite">
            {rangeLabel}
          </h2>
        </div>

        <Segmented
          aria-label="Görünüm"
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: "day", label: "Gün" },
            { value: "week", label: "Hafta" },
            { value: "month", label: "Ay" },
          ]}
        />
      </div>

      {/* VIEW: WEEK / DAY (time grid) */}
      {(viewMode === "week" || viewMode === "day") && (
        <Panel flush className="overflow-hidden">
          <TimeGrid
            days={viewMode === "week" ? weekDays : [currentDate]}
            appointments={appointments}
            onSelect={setSelectedAppt}
            onCreateAt={handleCreateAt}
          />
        </Panel>
      )}

      {/* VIEW: MONTHLY */}
      {viewMode === "month" && (
        <Panel className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-ink-3">
              {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} aria-hidden="true" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const dayList = appointments
                  .filter((a) => a.date === dateKey && !a.isBlockedSlot && a.status !== "CANCELLED")
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                const isToday = dateKey === todayKey;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      setCurrentDate(new Date(year, month, dayNum, 12));
                      setViewMode("day");
                    }}
                    className="flex min-h-[104px] flex-col gap-1 rounded-control border border-line bg-surface p-1.5 text-left transition-colors hover:border-line-strong hover:bg-surface-muted"
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                        isToday ? "bg-brand text-on-brand" : "text-ink"
                      )}
                    >
                      {dayNum}
                    </span>
                    {dayList.slice(0, 3).map((a) => (
                      <span
                        key={a.id}
                        className={cn(
                          "block truncate rounded-[5px] px-1.5 py-0.5 text-[11px] font-medium",
                          a.status === "PENDING" ? "bg-pending-soft text-pending" : "bg-brand-soft text-brand-ink"
                        )}
                      >
                        <span className="tabular-nums">{a.startTime}</span> {a.customerName}
                      </span>
                    ))}
                    {dayList.length > 3 && <span className="px-1.5 text-[11px] text-ink-3">+{dayList.length - 3} daha</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </Panel>
      )}

      {/* MODAL: New Appointment */}
      <Modal isOpen={isNewModalOpen || openedFromLink} onClose={closeNewModal} title="Yeni rezervasyon">
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <Field label="Müşteri adı soyadı *" htmlFor="cal-name">
            <Input
              id="cal-name"
              type="text"
              required
              placeholder="Mehmet Can"
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
            />
          </Field>

          <Field label="Telefon numarası *" htmlFor="cal-phone">
            <Input
              id="cal-phone"
              type="tel"
              required
              placeholder="0532 111 22 33"
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Hizmet" htmlFor="cal-service">
              <Select id="cal-service" value={newServiceId} onChange={(e) => setNewServiceId(e.target.value)}>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes} dk - {formatCurrency(s.price)})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Uzman" htmlFor="cal-employee">
              <Select id="cal-employee" value={newEmployeeId} onChange={(e) => setNewEmployeeId(e.target.value)}>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tarih" htmlFor="cal-date">
              <Input id="cal-date" type="date" required value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </Field>
            <Field label="Saat" htmlFor="cal-time">
              <Input
                id="cal-time"
                type="time"
                required
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Not / açıklama" htmlFor="cal-notes">
            <Textarea id="cal-notes" rows={2} value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
          </Field>

          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            {submitting ? "Ekleniyor..." : "Rezervasyonu kaydet"}
          </Button>
        </form>
      </Modal>

      {/* MODAL: Block Slot (Saat Kapat) */}
      <Modal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} title="Saat kapat / mola ekle">
        <form onSubmit={handleBlockSlot} className="space-y-4">
          <p className="text-sm text-ink-3">Kapatılan saat aralığında müşteriler online randevu alamaz.</p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tarih" htmlFor="block-date">
              <Input id="block-date" type="date" required value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
            </Field>
            <Field label="Saat" htmlFor="block-time">
              <Input id="block-time" type="time" required value={blockTime} onChange={(e) => setBlockTime(e.target.value)} />
            </Field>
          </div>

          {employees.length > 1 && (
            <Field label="Uzman" htmlFor="block-employee">
              <Select id="block-employee" value={blockEmployeeId} onChange={(e) => setBlockEmployeeId(e.target.value)}>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Kapatma sebebi" htmlFor="block-reason">
            <Input
              id="block-reason"
              type="text"
              required
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
          </Field>

          {blockError && (
            <p role="alert" className="text-sm text-danger">
              {blockError}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            <Lock className="w-4 h-4" aria-hidden="true" />
            {submitting ? "Kapatılıyor..." : "Bu saati kapat"}
          </Button>
        </form>
      </Modal>

      {/* MODAL: Appointment Detail */}
      {selectedAppt && (
        <Modal isOpen={!!selectedAppt} onClose={() => setSelectedAppt(null)} title="Rezervasyon detayı">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">{selectedAppt.customerName}</p>
              <StatusBadge status={selectedAppt.status} blocked={selectedAppt.isBlockedSlot} />
            </div>

            <dl className="divide-y divide-line rounded-control border border-line text-sm">
              {[
                ["Telefon", selectedAppt.customerPhone],
                ["Hizmet", selectedAppt.service?.name],
                ["Uzman", selectedAppt.employee?.name],
                ["Tarih ve saat", `${selectedAppt.date} · ${selectedAppt.startTime}`],
                ["Tutar", formatCurrency(selectedAppt.price)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 px-3 py-2">
                  <dt className="text-ink-3">{label}</dt>
                  <dd className="text-right font-medium text-ink tabular-nums">{value || "—"}</dd>
                </div>
              ))}
              {selectedAppt.notes && (
                <div className="px-3 py-2">
                  <dt className="text-ink-3">Müşteri notu</dt>
                  <dd className="mt-1 text-ink-2">{selectedAppt.notes}</dd>
                </div>
              )}
            </dl>

            <div className="flex flex-wrap gap-2">
              {selectedAppt.status !== "CONFIRMED" && (
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => handleStatusChange(selectedAppt.id, "CONFIRMED")}
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Onayla
                </Button>
              )}
              {selectedAppt.status !== "COMPLETED" && (
                <Button className="flex-1" onClick={() => handleStatusChange(selectedAppt.id, "COMPLETED")}>
                  Tamamla
                </Button>
              )}
              {selectedAppt.status !== "CANCELLED" && (
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => handleStatusChange(selectedAppt.id, "CANCELLED")}
                >
                  <XCircle className="w-4 h-4" aria-hidden="true" />
                  İptal et
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

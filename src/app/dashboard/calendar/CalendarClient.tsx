"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  Scissors,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/Modal";

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
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

  // New appointment form state
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newServiceId, setNewServiceId] = useState(services[0]?.id || "");
  const [newEmployeeId, setNewEmployeeId] = useState(employees[0]?.id || "");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newStartTime, setNewStartTime] = useState("10:00");
  const [newNotes, setNewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Block slot form state
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split("T")[0]);
  const [blockTime, setBlockTime] = useState("12:00");
  const [blockReason, setBlockReason] = useState("Öğle Molası / Kişisel İş");

  const todayStr = currentDate.toISOString().split("T")[0];

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
        setIsNewModalOpen(false);
        setNewCustName("");
        setNewCustPhone("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit block slot
  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const srv = services[0];
      const emp = employees[0];
      if (!srv || !emp) return;

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
      }
    } catch (e) {
      console.error(e);
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
      }
    } catch (e) {
      console.error(e);
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

  const hoursList = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  return (
    <div className="space-y-6">
      {/* Calendar Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-[#F8F9FC] dark:bg-slate-950 border border-[#E4E7EC] dark:border-slate-800 p-1 text-xs">
            <button
              onClick={() => setViewMode("day")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                viewMode === "day"
                  ? "bg-[#6246EA] text-white font-semibold shadow-xs"
                  : "text-[#667085] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200"
              }`}
            >
              Günlük
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                viewMode === "week"
                  ? "bg-[#6246EA] text-white font-semibold shadow-xs"
                  : "text-[#667085] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200"
              }`}
            >
              Haftalık
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                viewMode === "month"
                  ? "bg-[#6246EA] text-white font-semibold shadow-xs"
                  : "text-[#667085] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200"
              }`}
            >
              Aylık
            </button>
          </div>

          <button
            onClick={handleToday}
            className="rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs font-semibold text-[#344054] dark:text-slate-300 hover:bg-[#F8F9FC] transition-colors shadow-xs"
          >
            Bugün
          </button>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/80 p-2 text-[#667085] dark:text-slate-400 hover:bg-[#F8F9FC] hover:text-[#111827] transition-colors shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-[#111827] dark:text-slate-200 min-w-[160px] text-center">
            {currentDate.toLocaleDateString("tr-TR", {
              month: "long",
              year: "numeric",
              ...(viewMode === "day" ? { day: "numeric" } : {}),
            })}
          </span>
          <button
            onClick={handleNext}
            className="rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/80 p-2 text-[#667085] dark:text-slate-400 hover:bg-[#F8F9FC] hover:text-[#111827] transition-colors shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBlockModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4E7EC] dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-[#344054] dark:text-slate-300 hover:bg-[#F8F9FC] transition-colors shadow-xs"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Saat Kapat</span>
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#6246EA] hover:bg-[#5136D6] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#6246EA]/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Randevu</span>
          </button>
        </div>
      </div>

      {/* VIEW: WEEKLY */}
      {viewMode === "week" && (
        <div className="rounded-3xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-[#E4E7EC] dark:border-slate-800 bg-[#F8F9FC] dark:bg-slate-950/60 text-center text-xs">
            {weekDays.map((d, i) => {
              const isToday =
                d.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];
              return (
                <div
                  key={i}
                  className={`py-3.5 px-1 border-r border-[#E4E7EC] dark:border-slate-800/80 last:border-r-0 transition-colors ${
                    isToday
                      ? "bg-[#ECE8FF] text-[#6246EA] font-bold"
                      : "text-[#667085] dark:text-slate-400"
                  }`}
                >
                  <span className="block text-[11px] uppercase tracking-wider font-semibold">
                    {d.toLocaleDateString("tr-TR", { weekday: "short" })}
                  </span>
                  <span
                    className={`text-base font-bold mt-0.5 block ${
                      isToday ? "text-[#6246EA]" : "text-[#111827] dark:text-slate-200"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grid of days */}
          <div className="grid grid-cols-7 min-h-[520px] divide-x divide-[#E4E7EC] dark:divide-slate-800/80 bg-white dark:bg-slate-950/20">
            {weekDays.map((d, idx) => {
              const dateKey = d.toISOString().split("T")[0];
              const dayAppts = appointments.filter((a) => a.date === dateKey);

              return (
                <div key={idx} className="p-2 space-y-2">
                  {dayAppts.length === 0 ? (
                    <div className="text-[11px] text-[#98A2B3] dark:text-slate-600 text-center pt-8 font-medium">
                      Boş
                    </div>
                  ) : (
                    dayAppts.map((appt) => (
                      <div
                        key={appt.id}
                        onClick={() => setSelectedAppt(appt)}
                        className={`cursor-pointer rounded-2xl p-2.5 text-xs transition-all hover:scale-[1.02] shadow-xs ${
                          appt.isBlockedSlot
                            ? "bg-slate-100 border border-slate-300 text-slate-700 dark:bg-slate-800/80 dark:border-amber-500/30 dark:text-amber-300"
                            : appt.status === "CONFIRMED"
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-500/30 dark:text-emerald-200 hover:border-emerald-400"
                            : appt.status === "COMPLETED"
                            ? "bg-[#F4F3FF] border border-[#DDD6FE] text-[#312E81] dark:bg-indigo-950/40 dark:border-indigo-500/30 dark:text-indigo-200 hover:border-[#6246EA]"
                            : appt.status === "CANCELLED"
                            ? "bg-rose-50/80 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-500/20 dark:text-rose-300 opacity-75"
                            : "bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-500/25 dark:text-amber-200 hover:border-amber-400"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <span>{appt.startTime}</span>
                          <span
                            className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md ${
                              appt.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                                : appt.status === "COMPLETED"
                                ? "bg-[#ECE8FF] text-[#6246EA] dark:bg-indigo-900/50 dark:text-indigo-300"
                                : appt.status === "CANCELLED"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                            }`}
                          >
                            {appt.status === "CONFIRMED"
                              ? "Onaylı"
                              : appt.status === "COMPLETED"
                              ? "Tamamlandı"
                              : appt.status === "CANCELLED"
                              ? "İptal"
                              : "Bekliyor"}
                          </span>
                        </div>
                        <div
                          className={`font-bold truncate mt-1 text-xs ${
                            appt.status === "CANCELLED"
                              ? "line-through text-rose-900 dark:text-rose-300"
                              : "text-[#111827] dark:text-white"
                          }`}
                        >
                          {appt.customerName}
                        </div>
                        <div
                          className={`text-[10px] truncate mt-0.5 ${
                            appt.status === "CANCELLED"
                              ? "line-through text-rose-600/70"
                              : "text-[#667085] dark:text-slate-300"
                          }`}
                        >
                          {appt.service?.name}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: DAILY */}
      {viewMode === "day" && (
        <div className="rounded-3xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#111827] dark:text-slate-100 mb-4">
            {currentDate.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })} Randevuları
          </h3>

          <div className="space-y-3">
            {appointments.filter((a) => a.date === todayStr).length === 0 ? (
              <div className="p-8 text-center text-[#667085] dark:text-slate-400 text-xs border border-dashed border-[#E4E7EC] dark:border-slate-800 rounded-2xl">
                Bu gün için kayıtlı randevu bulunmuyor.
              </div>
            ) : (
              appointments
                .filter((a) => a.date === todayStr)
                .map((appt) => (
                  <div
                    key={appt.id}
                    onClick={() => setSelectedAppt(appt)}
                    className="cursor-pointer flex items-center justify-between p-4 rounded-2xl bg-[#F8F9FC] dark:bg-slate-950/60 border border-[#E4E7EC] dark:border-slate-800 hover:border-[#6246EA]/30 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-center font-bold text-[#6246EA] text-base">
                        {appt.startTime}
                      </div>
                      <div>
                        <span className="font-bold text-[#111827] dark:text-slate-100 block text-sm">
                          {appt.customerName}
                        </span>
                        <span className="text-xs text-[#667085] dark:text-slate-400">
                          {appt.service?.name} • Uzman: {appt.employee?.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-sm">
                        {formatCurrency(appt.price)}
                      </span>
                      <span className="text-xs text-[#667085] dark:text-slate-400 font-semibold">{appt.status}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* VIEW: MONTHLY */}
      {viewMode === "month" && (
        <div className="rounded-3xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#667085] dark:text-slate-400 mb-3">
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {[...Array(30)].map((_, i) => {
              const dayNum = i + 1;
              const dateKey = `${currentDate.getFullYear()}-${String(
                currentDate.getMonth() + 1
              ).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const count = appointments.filter((a) => a.date === dateKey).length;

              return (
                <div
                  key={i}
                  className={`min-h-[70px] rounded-xl border p-2 text-left transition-colors ${
                    count > 0
                      ? "border-[#D9D6FE] bg-[#F4F3FF] dark:border-indigo-500/30 dark:bg-indigo-950/20"
                      : "border-[#E4E7EC] bg-white dark:border-slate-800/80 dark:bg-slate-950/40"
                  }`}
                >
                  <span className="text-xs font-bold text-[#111827] dark:text-slate-300">{dayNum}</span>
                  {count > 0 && (
                    <span className="mt-1 block text-[10px] text-[#6246EA] font-bold bg-[#ECE8FF] px-1.5 py-0.5 rounded-md border border-[#D9D6FE] w-max">
                      {count} randevu
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: New Appointment */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Yeni Rezervasyon Oluştur"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Müşteri Adı Soyadı *
            </label>
            <input
              type="text"
              required
              placeholder="Mehmet Can"
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Telefon Numarası *
            </label>
            <input
              type="tel"
              required
              placeholder="0532 111 22 33"
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hizmet
              </label>
              <select
                value={newServiceId}
                onChange={(e) => setNewServiceId(e.target.value)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                    {s.name} ({s.durationMinutes} dk - {formatCurrency(s.price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Uzman
              </label>
              <select
                value={newEmployeeId}
                onChange={(e) => setNewEmployeeId(e.target.value)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tarih
              </label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Saat
              </label>
              <input
                type="time"
                required
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Not / Açıklama
            </label>
            <textarea
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#6246EA] py-3 text-sm font-semibold text-white shadow-lg shadow-[#6246EA]/25 hover:bg-[#5235D9] transition-all"
          >
            {submitting ? "Ekleniyor..." : "Rezervasyonu Kaydet"}
          </button>
        </form>
      </Modal>

      {/* MODAL: Block Slot (Saat Kapat) */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title="Saat Kapat / Mola Ekle"
      >
        <form onSubmit={handleBlockSlot} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kapatılan saat aralığında müşteriler online randevu alamaz.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tarih
              </label>
              <input
                type="date"
                required
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Saat
              </label>
              <input
                type="time"
                required
                value={blockTime}
                onChange={(e) => setBlockTime(e.target.value)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Kapatma Sebebi
            </label>
            <input
              type="text"
              required
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-500 transition-all"
          >
            {submitting ? "Kapatılıyor..." : "Bu Saati Kapat"}
          </button>
        </form>
      </Modal>

      {/* MODAL: Appointment Detail */}
      {selectedAppt && (
        <Modal
          isOpen={!!selectedAppt}
          onClose={() => setSelectedAppt(null)}
          title="Rezervasyon Detayı"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#F8F9FC] dark:bg-slate-950/60 border border-[#E4E7EC] dark:border-slate-800 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Müşteri:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedAppt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Telefon:</span>
                <span className="text-slate-800 dark:text-slate-200">{selectedAppt.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Hizmet:</span>
                <span className="text-[#6246EA] dark:text-indigo-400 font-semibold">{selectedAppt.service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Uzman:</span>
                <span className="text-slate-800 dark:text-slate-200">{selectedAppt.employee?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Tarih & Saat:</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">{selectedAppt.date} • {selectedAppt.startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Tutar:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(selectedAppt.price)}</span>
              </div>
              {selectedAppt.notes && (
                <div className="pt-2 border-t border-[#E4E7EC] dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Müşteri Notu:</span>
                  <p className="text-slate-700 dark:text-slate-300 italic">{selectedAppt.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              {selectedAppt.status !== "CONFIRMED" && (
                <button
                  onClick={() => handleStatusChange(selectedAppt.id, "CONFIRMED")}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm"
                >
                  Onayla
                </button>
              )}
              {selectedAppt.status !== "COMPLETED" && (
                <button
                  onClick={() => handleStatusChange(selectedAppt.id, "COMPLETED")}
                  className="flex-1 rounded-xl bg-[#6246EA] py-2.5 text-xs font-semibold text-white hover:bg-[#5235D9] shadow-sm"
                >
                  Tamamla
                </button>
              )}
              {selectedAppt.status !== "CANCELLED" && (
                <button
                  onClick={() => handleStatusChange(selectedAppt.id, "CANCELLED")}
                  className="flex-1 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20"
                >
                  İptal Et
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

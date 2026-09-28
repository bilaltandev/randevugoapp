"use client";

import React, { useState } from "react";
import {
  CalendarCheck2,
  Search,
  Filter,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Plus,
  Scissors,
  Star,
} from "lucide-react";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import { Modal } from "@/components/Modal";

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
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("11:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
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
      }
    } catch (e) {
      console.error(e);
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Rezervasyon Yönetimi
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Tüm geçmiş ve gelecek randevularınızı filtreleyin, onaylayın veya iptal edin.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Manuel Randevu Ekle</span>
        </button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "ALL", label: "Tümü", count: appointments.length },
            { id: "PENDING", label: "Bekleyen", count: appointments.filter((a) => a.status === "PENDING").length },
            { id: "CONFIRMED", label: "Onaylanan", count: appointments.filter((a) => a.status === "CONFIRMED").length },
            { id: "COMPLETED", label: "Tamamlanan", count: appointments.filter((a) => a.status === "COMPLETED").length },
            { id: "CANCELLED", label: "İptal", count: appointments.filter((a) => a.status === "CANCELLED").length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 opacity-70 text-[10px]">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="İsim, telefon veya hizmet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Appointments List / Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <CalendarCheck2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            Kriterlere uygun rezervasyon kaydı bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Tarih & Saat</th>
                  <th className="py-3.5 px-4">Müşteri</th>
                  <th className="py-3.5 px-4">Hizmet & Tutar</th>
                  <th className="py-3.5 px-4">Uzman</th>
                  <th className="py-3.5 px-4">Durum</th>
                  <th className="py-3.5 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((appt) => (
                  <tr
                    key={appt.id}
                    className="hover:bg-slate-850/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-100">{appt.date}</div>
                      <div className="text-indigo-400 font-medium">{appt.startTime} - {appt.endTime}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        {appt.customerName}
                      </div>
                      <div className="text-slate-400">{formatPhoneNumber(appt.customerPhone)}</div>
                      {appt.notes && (
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                          "{appt.notes}"
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{appt.service?.name}</div>
                      <div className="font-semibold text-emerald-400">{formatCurrency(appt.price)}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {appt.employee?.name}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {appt.status === "CONFIRMED" && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                          Onaylandı
                        </span>
                      )}
                      {appt.status === "PENDING" && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium">
                          Bekliyor
                        </span>
                      )}
                      {appt.status === "COMPLETED" && (
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-medium">
                          Tamamlandı
                        </span>
                      )}
                      {appt.status === "CANCELLED" && (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-medium">
                          İptal Edildi
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp */}
                        <a
                          href={`https://wa.me/${appt.customerPhone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          title="WhatsApp'tan Yaz"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>

                        {appt.status === "PENDING" && (
                          <button
                            onClick={() => handleUpdateStatus(appt.id, "CONFIRMED")}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 font-semibold text-white hover:bg-emerald-500"
                          >
                            Onayla
                          </button>
                        )}

                        {appt.status === "CONFIRMED" && (
                          <button
                            onClick={() => handleUpdateStatus(appt.id, "COMPLETED")}
                            className="rounded-lg bg-indigo-600 px-2.5 py-1 font-semibold text-white hover:bg-indigo-500"
                          >
                            Tamamla
                          </button>
                        )}

                        {appt.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleUpdateStatus(appt.id, "CANCELLED")}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 font-medium text-rose-400 hover:bg-rose-500/20"
                            title="İptal Et"
                          >
                            İptal
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Appointment Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Manuel Rezervasyon Oluştur"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Müşteri Ad Soyad *</label>
            <input
              type="text"
              required
              placeholder="Can Yılmaz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Telefon Numarası *</label>
            <input
              type="tel"
              required
              placeholder="0532 111 22 33"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Hizmet</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900">
                    {s.name} ({formatCurrency(s.price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Uzman</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-slate-900">
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tarih</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Saat</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Not</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
          >
            {submitting ? "Oluşturuluyor..." : "Rezervasyonu Kaydet"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

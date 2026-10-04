"use client";

import React, { useState } from "react";
import {
  Users2,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Scissors,
} from "lucide-react";
import { Modal } from "@/components/Modal";

interface EmployeesClientProps {
  businessId: string;
  initialEmployees: any[];
  services: any[];
}

export default function EmployeesClient({
  businessId,
  initialEmployees,
  services,
}: EmployeesClientProps) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [photo, setPhoto] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setName("");
    setSpecialty("");
    setPhoto("");
    setPhone("");
    setEmail("");
    setSelectedServiceIds(services.map((s) => s.id)); // Default all
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setEditingEmp(emp);
    setName(emp.name);
    setSpecialty(emp.specialty);
    setPhoto(emp.photo || "");
    setPhone(emp.phone || "");
    setEmail(emp.email || "");
    setSelectedServiceIds(emp.employeeServices?.map((es: any) => es.serviceId) || []);
    setIsModalOpen(true);
  };

  const handleToggleService = (sId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingEmp) {
        // Edit
        const res = await fetch("/api/employees", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingEmp.id,
            name,
            specialty,
            photo,
            phone,
            email,
          }),
        });
        const data = await res.json();
        if (data.employee) {
          setEmployees((prev) =>
            prev.map((e) => (e.id === data.employee.id ? { ...e, ...data.employee } : e))
          );
          setIsModalOpen(false);
        }
      } else {
        // Create
        const res = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            specialty,
            photo,
            phone,
            email,
            serviceIds: selectedServiceIds,
          }),
        });
        const data = await res.json();
        if (data.employee) {
          setEmployees((prev) => [...prev, data.employee]);
          setIsModalOpen(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu çalışanı silmek istediğinizden emin misiniz?")) return;
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] dark:text-slate-100">
            Çalışan & Ekip Yönetimi
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 mt-0.5">
            Ekip üyelerinizi, uzmanlık alanlarını ve verdikleri hizmetleri buradan yapılandırın.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6246EA] hover:bg-[#5136D6] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#6246EA]/25 transition-all active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Çalışan Ekle</span>
        </button>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-6 backdrop-blur-xl hover:border-[#6246EA]/30 transition-all shadow-sm"
          >
            <div>
              <div className="flex items-center gap-3.5 mb-3.5">
                {emp.photo ? (
                  <img
                    src={emp.photo}
                    alt={emp.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-[#E4E7EC] dark:border-slate-700 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-100 text-[#6246EA] dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center font-bold text-base sm:text-lg border border-purple-200 dark:border-indigo-500/30 shrink-0">
                    {emp.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-[#111827] dark:text-slate-100 truncate">{emp.name}</h3>
                  <p className="text-xs text-[#6246EA] dark:text-indigo-400 font-semibold truncate">{emp.specialty}</p>
                  <span className="inline-block mt-0.5 text-[10px] text-[#667085] dark:text-slate-400">
                    {emp._count?.appointments || 0} toplam randevu
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[#667085] dark:text-slate-400 mb-4 bg-[#F8F9FC] dark:bg-slate-950/40 p-2.5 rounded-xl border border-[#E4E7EC] dark:border-slate-850">
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#6246EA] shrink-0" />
                    <a href={`tel:${emp.phone}`} className="hover:text-[#111827] dark:hover:text-white transition-colors truncate">
                      {emp.phone}
                    </a>
                  </div>
                )}
                {emp.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
                    <a href={`mailto:${emp.email}`} className="hover:text-[#111827] dark:hover:text-white transition-colors truncate">
                      {emp.email}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3.5 border-t border-[#E4E7EC] dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Aktif
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="p-1.5 rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-800 text-[#667085] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-100 hover:bg-[#F8F9FC] transition-colors shadow-xs"
                  title="Düzenle"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(emp.id)}
                  className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors shadow-xs"
                  title="Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmp ? "Çalışan Bilgilerini Düzenle" : "Yeni Çalışan Ekle"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Ad Soyad *</label>
            <input
              type="text"
              required
              placeholder="Örn: Can Kaya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-600 focus:border-[#6246EA] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Uzmanlık Alanı *</label>
            <input
              type="text"
              required
              placeholder="Örn: Baş Stilist & Fade Kesim"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-600 focus:border-[#6246EA] focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Telefon</label>
              <input
                type="tel"
                placeholder="0532 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-600 focus:border-[#6246EA] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">E-Posta</label>
              <input
                type="email"
                placeholder="can@isletme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-600 focus:border-[#6246EA] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Profil Fotoğrafı URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-600 focus:border-[#6246EA] focus:outline-none transition-colors"
            />
          </div>

          {!editingEmp && (
            <div>
              <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-2">
                Verdiği Hizmetler
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {services.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 p-2 rounded-xl bg-[#F8F9FC] dark:bg-slate-950/40 border border-[#E4E7EC] dark:border-slate-800 cursor-pointer hover:border-[#6246EA]/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedServiceIds.includes(s.id)}
                      onChange={() => handleToggleService(s.id)}
                      className="rounded text-[#6246EA] focus:ring-[#6246EA]"
                    />
                    <span className="text-[#344054] dark:text-slate-200 text-xs font-medium">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#6246EA] py-3 text-sm font-semibold text-white shadow-lg shadow-[#6246EA]/25 hover:bg-[#5235D9] transition-all disabled:opacity-50"
          >
            {submitting ? "Kaydediliyor..." : editingEmp ? "Değişiklikleri Kaydet" : "Çalışanı Ekle"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

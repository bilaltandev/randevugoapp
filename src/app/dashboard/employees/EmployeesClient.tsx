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
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Çalışan & Ekip Yönetimi
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Ekip üyelerinizi, uzmanlık alanlarını ve verdikleri hizmetleri buradan yapılandırın.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Çalışan Ekle</span>
        </button>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-center gap-4 mb-4">
                {emp.photo ? (
                  <img
                    src={emp.photo}
                    alt={emp.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-500/30">
                    {emp.name.slice(0, 1)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base text-slate-100">{emp.name}</h3>
                  <p className="text-xs text-indigo-400 font-medium">{emp.specialty}</p>
                  <span className="inline-block mt-1 text-[10px] text-slate-400">
                    {emp._count?.appointments || 0} toplam randevu
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{emp.phone}</span>
                  </div>
                )}
                {emp.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Aktif
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                  title="Düzenle"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(emp.id)}
                  className="p-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors"
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
            <label className="block font-semibold text-slate-300 mb-1">Ad Soyad *</label>
            <input
              type="text"
              required
              placeholder="Örn: Can Kaya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Uzmanlık Alanı *</label>
            <input
              type="text"
              required
              placeholder="Örn: Baş Stilist & Fade Kesim"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Telefon</label>
              <input
                type="tel"
                placeholder="0532 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">E-Posta</label>
              <input
                type="email"
                placeholder="can@isletme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Profil Fotoğrafı URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {!editingEmp && (
            <div>
              <label className="block font-semibold text-slate-300 mb-2">
                Verdiği Hizmetler
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {services.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer hover:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedServiceIds.includes(s.id)}
                      onChange={() => handleToggleService(s.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-200">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
          >
            {submitting ? "Kaydediliyor..." : editingEmp ? "Değişiklikleri Kaydet" : "Çalışanı Ekle"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Users2, Plus, Edit2, Trash2, Phone, Mail } from "lucide-react";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input } from "@/components/ui/Field";

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
    <div className="space-y-5">
      <PageHeader
        title="Çalışanlar"
        description="Ekip üyelerinizi, uzmanlık alanlarını ve verdikleri hizmetleri yönetin."
        actions={
          <Button variant="primary" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Çalışan ekle
          </Button>
        }
      />

      {employees.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Users2}
            title="Henüz çalışan eklenmemiş"
            description="Randevuların doğru kişiye atanması için ekibinizi ekleyin."
            actions={
              <Button variant="primary" size="sm" onClick={handleOpenAdd}>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Çalışan ekle
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => (
            <section key={emp.id} className="flex flex-col rounded-panel border border-line bg-surface">
              <div className="flex items-start gap-3 p-4">
                <Avatar name={emp.name} src={emp.photo} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-ink">{emp.name}</h3>
                  {emp.specialty && <p className="truncate text-sm text-ink-2">{emp.specialty}</p>}
                  <p className="mt-0.5 text-xs text-ink-3 tabular-nums">
                    {emp._count?.appointments || 0} randevu
                  </p>
                </div>
              </div>

              {(emp.phone || emp.email) && (
                <div className="space-y-1 px-4 pb-4 text-sm text-ink-3">
                  {emp.phone && (
                    <a href={`tel:${emp.phone}`} className="flex items-center gap-2 truncate hover:text-ink">
                      <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {emp.phone}
                    </a>
                  )}
                  {emp.email && (
                    <a href={`mailto:${emp.email}`} className="flex items-center gap-2 truncate hover:text-ink">
                      <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {emp.email}
                    </a>
                  )}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-line px-4 py-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                  Aktif
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 px-0"
                    onClick={() => handleOpenEdit(emp)}
                    title="Düzenle"
                    aria-label={`${emp.name} bilgilerini düzenle`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 px-0 hover:text-danger"
                    onClick={() => handleDelete(emp.id)}
                    title="Sil"
                    aria-label={`${emp.name} adlı çalışanı sil`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmp ? "Çalışanı düzenle" : "Yeni çalışan"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Ad soyad *" htmlFor="emp-name">
            <Input
              id="emp-name"
              type="text"
              required
              placeholder="Örn: Can Kaya"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Uzmanlık alanı *" htmlFor="emp-specialty">
            <Input
              id="emp-specialty"
              type="text"
              required
              placeholder="Örn: Baş Stilist & Fade Kesim"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Telefon" htmlFor="emp-phone">
              <Input
                id="emp-phone"
                type="tel"
                placeholder="0532 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label="E-posta" htmlFor="emp-email">
              <Input
                id="emp-email"
                type="email"
                placeholder="can@isletme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Profil fotoğrafı URL" htmlFor="emp-photo">
            <Input
              id="emp-photo"
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
            />
          </Field>

          {!editingEmp && (
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink-2">Verdiği hizmetler</legend>
              <div className="max-h-40 divide-y divide-line overflow-y-auto rounded-control border border-line">
                {services.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-muted"
                  >
                    <input
                      type="checkbox"
                      checked={selectedServiceIds.includes(s.id)}
                      onChange={() => handleToggleService(s.id)}
                      className="h-4 w-4 rounded accent-brand"
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            {submitting ? "Kaydediliyor..." : editingEmp ? "Değişiklikleri kaydet" : "Çalışanı ekle"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

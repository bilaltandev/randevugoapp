"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Users2, Plus, Edit2, Trash2, Phone, Mail, Link2, UserMinus, MessageCircle } from "lucide-react";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Input } from "@/components/ui/Field";
import type { Plan } from "@/lib/plans";
import { CopyButton, TeamInvitePanel, TeamPlanNotice, teamRequest, untilLabel, whatsAppUrl } from "./TeamInvitePanel";

interface EmployeesClientProps {
  businessId: string;
  businessName: string;
  ownerEmail: string;
  initialEmployees: any[];
  services: any[];
  plan: Plan;
  memberLimit: number;
  initialOpenCodes: number;
}

export default function EmployeesClient({
  businessId,
  businessName,
  ownerEmail,
  initialEmployees,
  services,
  plan,
  memberLimit,
  initialOpenCodes,
}: EmployeesClientProps) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [openCodes, setOpenCodes] = useState(initialOpenCodes);
  // The invite link just made for a staff record; shown once in its own window.
  const [linkFor, setLinkFor] = useState<{ emp: any; url: string; expiresAt: string } | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const team = plan === "TEAM";
  const members = employees.filter((e) => e.memberEmail).length;
  // PERSON: one person takes the bookings, so a second record needs the TEAM plan.
  const canAdd = team || employees.length === 0;
  const isOwner = (emp: any) => !!emp.email && !emp.memberEmail && emp.email.toLowerCase() === ownerEmail.toLowerCase();

  // Someone joining with a code shows up here: refresh when the owner comes back to this tab.
  const reload = useCallback(async () => {
    try {
      const data = await teamRequest<{ employees: any[] }>("/api/employees");
      setEmployees((prev) =>
        data.employees.map((fresh) => ({ ...fresh, _count: prev.find((e) => e.id === fresh.id)?._count }))
      );
    } catch {
      // Keep what is on screen; the next visit loads it again.
    }
  }, []);

  useEffect(() => {
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, [reload]);

  const handleCreateLink = async (emp: any) => {
    setRowBusy(emp.id);
    setRowError(null);
    try {
      const { path, expiresAt } = await teamRequest<{ path: string; expiresAt: string }>("/api/team/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: emp.id }),
      });
      setLinkFor({ emp, url: `${window.location.origin}${path}`, expiresAt });
      setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, inviteExpiresAt: expiresAt } : e)));
    } catch (e) {
      setRowError((e as Error).message);
    } finally {
      setRowBusy(null);
    }
  };

  const handleRevokeLink = async (emp: any) => {
    setRowBusy(emp.id);
    setRowError(null);
    try {
      await teamRequest(`/api/team/invites?employeeId=${encodeURIComponent(emp.id)}`, { method: "DELETE" });
      setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, inviteExpiresAt: null } : e)));
    } catch (e) {
      setRowError((e as Error).message);
    } finally {
      setRowBusy(null);
    }
  };

  const handleRemoveMember = async (emp: any) => {
    if (!confirm(`${emp.name} ekipten çıkarılsın mı?\n\nHesabı kapanır ve uygulamadan çıkış yapılır. Çalışan kaydı ve geçmiş randevuları kalır.`)) return;
    setRowBusy(emp.id);
    setRowError(null);
    try {
      await teamRequest(`/api/team/members?employeeId=${encodeURIComponent(emp.id)}`, { method: "DELETE" });
      setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, memberEmail: null, inviteExpiresAt: null } : e)));
    } catch (e) {
      setRowError((e as Error).message);
    } finally {
      setRowBusy(null);
    }
  };

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
    setFormError(null);
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
    setFormError(null);
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
    setFormError(null);
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
            serviceIds: selectedServiceIds,
          }),
        });
        const data = await res.json();
        if (data.employee) {
          setEmployees((prev) =>
            prev.map((e) => (e.id === data.employee.id ? { ...e, ...data.employee } : e))
          );
          setIsModalOpen(false);
        } else {
          setFormError(data.error || "Değişiklikler kaydedilemedi.");
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
        } else {
          setFormError(data.error || "Çalışan eklenemedi.");
        }
      }
    } catch (e) {
      console.error(e);
      setFormError("Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.");
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
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Silme işlemi tamamlanamadı.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        accent="violet"
        title="Çalışanlar"
        description="Ekip üyelerinizi, uzmanlık alanlarını ve verdikleri hizmetleri yönetin."
        actions={
          canAdd ? (
            <Button variant={team ? "secondary" : "primary"} onClick={handleOpenAdd}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              {team ? "Hesapsız çalışan ekle" : "Çalışan ekle"}
            </Button>
          ) : undefined
        }
      />

      {team ? (
        <TeamInvitePanel
          businessName={businessName}
          members={members}
          memberLimit={memberLimit}
          openCodes={openCodes}
          onOpenCodesChange={setOpenCodes}
        />
      ) : (
        <TeamPlanNotice />
      )}

      {rowError && (
        <p role="alert" className="rounded-control border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
          {rowError}
        </p>
      )}

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
            <section key={emp.id} className="ios-group flex flex-col">
              <div className="flex items-start gap-3 p-4">
                <Avatar name={emp.name} src={emp.photo} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-ink">{emp.name}</h3>
                  {emp.specialty && <p className="truncate text-sm text-ink-2">{emp.specialty}</p>}
                  <p className="mt-0.5 text-xs text-ink-3 tabular-nums">
                    {emp._count?.appointments || 0} randevu
                  </p>
                </div>
              </div>

              {(emp.phone || emp.email) && (
                <div className="mb-auto space-y-1 px-4 pb-4 text-sm text-ink-3">
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

              {team && !isOwner(emp) && emp.isActive !== false && (
                <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
                  {emp.memberEmail ? (
                    <Button size="sm" variant="ghost" disabled={rowBusy === emp.id} onClick={() => handleRemoveMember(emp)} className="hover:text-danger">
                      <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                      Ekipten çıkar
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" disabled={rowBusy === emp.id} onClick={() => handleCreateLink(emp)}>
                        <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {emp.inviteExpiresAt ? "Yeni davet bağlantısı" : "Davet bağlantısı"}
                      </Button>
                      {emp.inviteExpiresAt && (
                        <Button size="sm" variant="ghost" disabled={rowBusy === emp.id} onClick={() => handleRevokeLink(emp)}>
                          İptal et
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-line px-4 py-2">
                <EmployeeStatus emp={emp} owner={isOwner(emp)} />
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

          {formError && (
            <p role="alert" className="rounded-control border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            {submitting ? "Kaydediliyor..." : editingEmp ? "Değişiklikleri kaydet" : "Çalışanı ekle"}
          </Button>
        </form>
      </Modal>

      {/* Invite link for one staff record: the token is only available right after it is made */}
      <Modal isOpen={linkFor !== null} onClose={() => setLinkFor(null)} title={linkFor ? `${linkFor.emp.name} için davet` : "Davet"}>
        {linkFor && (
          <div className="space-y-4">
            <p className="text-sm text-ink-2">
              Bu bağlantıyı {linkFor.emp.name} ile paylaşın. Açıp hesabını oluşturduğunda bu çalışan kaydına bağlanır ve randevuları kendi hesabına düşer.
            </p>
            <p className="break-all rounded-control border border-line bg-surface-muted px-3 py-2 font-mono text-xs text-ink">{linkFor.url}</p>
            <p className="text-xs text-ink-3">
              Tek kullanımlık, {untilLabel(linkFor.expiresAt)} tarihine kadar geçerli. Bu pencere kapanınca bağlantı bir daha gösterilmez, gerekirse yenisini oluşturursunuz.
            </p>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={linkFor.url} label="Bağlantıyı kopyala" primary />
              <a
                href={whatsAppUrl(`${businessName} ekibine katılmak için bu bağlantıdan hesabınızı oluşturun: ${linkFor.url}`)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("secondary")}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/** One word on who this record is: the owner, a member with an account, invited, or plain staff. */
function EmployeeStatus({ emp, owner }: { emp: any; owner: boolean }) {
  const dot = "h-1.5 w-1.5 rounded-full";
  const text = "inline-flex items-center gap-1.5 text-xs";
  if (emp.isActive === false) {
    return (
      <span className={`${text} text-ink-3`}>
        <span className={`${dot} bg-ink-3`} aria-hidden="true" />
        Pasif
      </span>
    );
  }
  if (owner) {
    return (
      <span className={`${text} text-ink-3`}>
        <span className={`${dot} bg-brand`} aria-hidden="true" />
        İşletme sahibi
      </span>
    );
  }
  if (emp.memberEmail) {
    return (
      <span className={`${text} font-semibold text-brand`} title={emp.memberEmail}>
        <span className={`${dot} bg-brand`} aria-hidden="true" />
        Ekipte
      </span>
    );
  }
  if (emp.inviteExpiresAt) {
    return (
      <span className={`${text} font-semibold text-pending`}>
        <span className={`${dot} bg-pending`} aria-hidden="true" />
        Davet gönderildi · {untilLabel(emp.inviteExpiresAt)}
      </span>
    );
  }
  return (
    <span className={`${text} text-ink-3`}>
      <span className={`${dot} bg-brand`} aria-hidden="true" />
      Aktif
    </span>
  );
}

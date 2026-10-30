"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthError } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordRules } from "@/components/auth/PasswordRules";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { WEAK_PASSWORD, isStrongPassword } from "@/lib/passwordPolicy";

type ProfileUser = { name: string; email: string; phone: string | null };

function Saved({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-brand-ink">
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      {children}
    </p>
  );
}

function ProfileForm({ initialUser }: { initialUser: ProfileUser }) {
  const router = useRouter();
  const [savedEmail, setSavedEmail] = useState(initialUser.email);
  const [name, setName] = useState(initialUser.name);
  const [email, setEmail] = useState(initialUser.email);
  const [phone, setPhone] = useState(initialUser.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const emailChanged = email.trim().toLowerCase() !== savedEmail;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, currentPassword: emailChanged ? currentPassword : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Profil güncellenemedi.");
        return;
      }
      setSavedEmail(data.user.email);
      setCurrentPassword("");
      setSaved(true);
      router.refresh();
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Kişisel bilgiler" description="Giriş e-postanız ve size ulaşacağımız bilgiler.">
      {error && <AuthError>{error}</AuthError>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Ad soyad *" htmlFor="profile-name">
          <Input id="profile-name" required maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="E-posta adresi *" htmlFor="profile-email">
          <Input id="profile-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {emailChanged && (
          <Field label="Mevcut şifre *" htmlFor="profile-current" hint="E-postanızı değiştirmek için gereklidir.">
            <PasswordInput id="profile-current" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </Field>
        )}
        <Field label="Telefon numarası *" htmlFor="profile-phone">
          <Input id="profile-phone" type="tel" required autoComplete="tel" placeholder="0532 000 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          {saved && <Saved>Profiliniz güncellendi.</Saved>}
        </div>
      </form>
    </Panel>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!isStrongPassword(newPassword)) {
      setError(WEAK_PASSWORD);
      return;
    }
    if (newPassword !== repeat) {
      setError("Yeni şifreler birbiriyle aynı değil.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Şifre değiştirilemedi.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setRepeat("");
      setSaved(true);
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Şifre" description="Şifre değişince bu tarayıcı dışındaki tüm oturumlarınız kapanır.">
      {error && <AuthError>{error}</AuthError>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Mevcut şifre *" htmlFor="password-current">
          <PasswordInput id="password-current" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </Field>
        <Field label="Yeni şifre *" htmlFor="password-new">
          <PasswordInput id="password-new" required autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </Field>
        <PasswordRules password={newPassword} />
        <Field label="Yeni şifre (tekrar) *" htmlFor="password-repeat">
          <PasswordInput id="password-repeat" required autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {saving ? "Değiştiriliyor..." : "Şifreyi değiştir"}
          </Button>
          {saved && <Saved>Şifreniz değiştirildi.</Saved>}
        </div>
      </form>
    </Panel>
  );
}

export default function ProfileClient({ initialUser }: { initialUser: ProfileUser }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Profil" description="Hesap bilgilerinizi ve şifrenizi yönetin." />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm initialUser={initialUser} />
        <PasswordForm />
      </div>
    </div>
  );
}

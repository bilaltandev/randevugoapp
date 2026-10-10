"use client";

import React, { useState } from "react";
import { KeyRound, Loader2, Save, UserCog } from "lucide-react";

export interface AdminProfile {
  name: string;
  email: string;
  phone: string | null;
}

interface AdminProfileSettingsProps {
  admin: AdminProfile;
  onProfileUpdated: (profile: AdminProfile) => void;
  notify: (type: "success" | "error", text: string) => void;
}

const MIN_PASSWORD_LENGTH = 8;

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:outline-none";
const LABEL_CLASS = "text-[11px] font-semibold text-slate-400 block mb-1.5";
const CARD_CLASS = "rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl";
const SUBMIT_CLASS =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

export function AdminProfileSettings({ admin, onProfileUpdated, notify }: AdminProfileSettingsProps) {
  // Profile form
  const [name, setName] = useState(admin.name);
  const [email, setEmail] = useState(admin.email);
  const [phone, setPhone] = useState(admin.phone ?? "");
  const [profilePassword, setProfilePassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const emailChanged = email.trim().toLowerCase() !== admin.email;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, currentPassword: profilePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify("error", data.error || "Profil güncellenemedi.");
        return;
      }
      onProfileUpdated({ name: data.user.name, email: data.user.email, phone: data.user.phone });
      setEmail(data.user.email);
      setProfilePassword("");
      notify("success", "Profil bilgileriniz güncellendi.");
    } catch {
      notify("error", "Bağlantı hatası oluştu.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      notify("error", `Yeni şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      notify("error", "Yeni şifreler eşleşmiyor.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify("error", data.error || "Şifre değiştirilemedi.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify("success", "Şifreniz başarıyla değiştirildi.");
    } catch {
      notify("error", "Bağlantı hatası oluştu.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={handleProfileSubmit} className={`${CARD_CLASS} space-y-4`}>
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-amber-400" />
            <span>Profil Bilgileri</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Yönetici hesabınızın ad, e-posta ve telefon bilgileri.</p>
        </div>

        <div>
          <label htmlFor="admin-name" className={LABEL_CLASS}>Ad Soyad</label>
          <input
            id="admin-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="admin-email" className={LABEL_CLASS}>E-posta</label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="admin-phone" className={LABEL_CLASS}>Telefon (isteğe bağlı)</label>
          <input
            id="admin-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="05xx xxx xx xx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        {emailChanged && (
          <div>
            <label htmlFor="admin-profile-password" className={LABEL_CLASS}>
              Mevcut şifre (e-posta değişikliği için gerekli)
            </label>
            <input
              id="admin-profile-password"
              type="password"
              required
              autoComplete="current-password"
              value={profilePassword}
              onChange={(e) => setProfilePassword(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        )}

        <button type="submit" disabled={savingProfile} className={SUBMIT_CLASS}>
          {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{savingProfile ? "Kaydediliyor..." : "Profili Kaydet"}</span>
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className={`${CARD_CLASS} space-y-4`}>
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <span>Şifre Değiştir</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Yeni şifreniz en az {MIN_PASSWORD_LENGTH} karakter olmalıdır.
          </p>
        </div>

        <div>
          <label htmlFor="admin-current-password" className={LABEL_CLASS}>Mevcut şifre</label>
          <input
            id="admin-current-password"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="admin-new-password" className={LABEL_CLASS}>Yeni şifre</label>
          <input
            id="admin-new-password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="admin-confirm-password" className={LABEL_CLASS}>Yeni şifre (tekrar)</label>
          <input
            id="admin-confirm-password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <button type="submit" disabled={savingPassword} className={SUBMIT_CLASS}>
          {savingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
          <span>{savingPassword ? "Değiştiriliyor..." : "Şifreyi Değiştir"}</span>
        </button>
      </form>
    </div>
  );
}

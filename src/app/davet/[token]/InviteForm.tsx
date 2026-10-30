"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthError } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordRules } from "@/components/auth/PasswordRules";
import { PrivacyConsent } from "@/components/auth/PrivacyConsent";
import { WEAK_PASSWORD, isStrongPassword } from "@/lib/passwordPolicy";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

// 16px on phones so iOS doesn't zoom into focused fields.
const AUTH_INPUT = "h-10 text-base sm:text-sm";

export function InviteForm({ token, defaultName }: { token: string; defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [noticeAccepted, setNoticeAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState<{ businessName: string; email: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isStrongPassword(password)) {
      setError(WEAK_PASSWORD);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/team/invites/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, privacyNoticeAccepted: noticeAccepted }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Davet kabul edilemedi.");
      } else {
        setJoined({ businessName: data.businessName, email: data.email });
      }
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (joined) {
    return (
      <div className="rounded-control border border-line bg-surface p-4" role="status">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-ink">{joined.businessName} ekibine katıldınız.</p>
            <p className="text-ink-2">
              Mobil uygulamayı açın ve <strong className="font-medium text-ink">{joined.email}</strong> adresi ile oluşturduğunuz
              şifreyle giriş yapın.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && <AuthError>{error}</AuthError>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Ad soyad *" htmlFor="inv-name">
          <Input
            id="inv-name"
            type="text"
            required
            maxLength={80}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={AUTH_INPUT}
          />
        </Field>
        <Field label="E-posta adresi *" htmlFor="inv-email">
          <Input
            id="inv-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="ornek@eposta.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={AUTH_INPUT}
          />
        </Field>
        <Field label="Telefon *" htmlFor="inv-phone">
          <Input
            id="inv-phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="0532 000 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={AUTH_INPUT}
          />
        </Field>
        <Field label="Şifre belirleyin *" htmlFor="inv-password">
          <PasswordInput
            id="inv-password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={AUTH_INPUT}
          />
        </Field>
        <PasswordRules password={password} />
        <PrivacyConsent id="inv-notice" checked={noticeAccepted} onChange={setNoticeAccepted} />
        <Button type="submit" variant="primary" disabled={loading} className="h-10 w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Katılınıyor...
            </>
          ) : (
            "Ekibe katıl"
          )}
        </Button>
      </form>
    </>
  );
}

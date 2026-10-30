"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthShell, AuthError } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "İstek gönderilemedi.");
      else setSent(true);
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Şifremi unuttum"
      description={sent ? undefined : "E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim."}
      footer={
        <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
          Girişe dön
        </Link>
      }
    >
      {sent ? (
        <div className="flex items-start gap-3 rounded-control border border-line bg-surface p-4 text-sm" role="status">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <p className="text-ink-2">
            Bu adrese ait bir hesap varsa sıfırlama bağlantısı birkaç dakika içinde gelir. Gelen kutunuzu ve spam klasörünü kontrol edin.
          </p>
        </div>
      ) : (
        <>
          {error && <AuthError>{error}</AuthError>}
          <form onSubmit={submit} className="space-y-4">
            <Field label="E-posta adresi" htmlFor="forgot-email">
              <Input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder="ornek@isletme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-base sm:text-sm"
              />
            </Field>
            <Button type="submit" variant="primary" disabled={loading} className="h-10 w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Gönderiliyor...
                </>
              ) : (
                "Sıfırlama bağlantısı gönder"
              )}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}

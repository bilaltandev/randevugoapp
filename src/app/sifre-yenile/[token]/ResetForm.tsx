"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthShell, AuthError } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

const MIN_PASSWORD = 8;

export function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD) {
      setError(`Şifre en az ${MIN_PASSWORD} karakter olmalıdır.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Şifre değiştirilemedi.");
      else setDone(true);
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={done ? "Şifreniz değiştirildi" : "Yeni şifre belirleyin"}
      footer={
        <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
          Girişe dön
        </Link>
      }
    >
      {done ? (
        <div className="flex items-start gap-3 rounded-control border border-line bg-surface p-4 text-sm" role="status">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <p className="text-ink-2">Web sitesinde veya mobil uygulamada yeni şifrenizle giriş yapabilirsiniz. Açık oturumlarınız kapatıldı.</p>
        </div>
      ) : (
        <>
          {error && <AuthError>{error}</AuthError>}
          <form onSubmit={submit} className="space-y-4">
            <Field label="Yeni şifre" htmlFor="reset-password" hint={`En az ${MIN_PASSWORD} karakter.`}>
              <PasswordInput
                id="reset-password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 text-base sm:text-sm"
              />
            </Field>
            <Button type="submit" variant="primary" disabled={loading} className="h-10 w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Kaydediliyor...
                </>
              ) : (
                "Şifreyi değiştir"
              )}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { AuthShell, AuthError } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

// 16px on phones so iOS doesn't zoom into focused fields.
const AUTH_INPUT = "h-10 text-base sm:text-sm";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Giriş yapılamadı.");
      } else {
        window.location.href = "/admin";
      }
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-3">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Yönetim paneli
        </span>
      }
      title="Yönetici girişi"
      description="Platform yönetim paneline erişmek için yönetici hesabınızla giriş yapın."
      footer={
        <>
          İşletme sahibi misiniz?{" "}
          <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
            İşletme girişi
          </Link>
        </>
      }
    >
      {error && <AuthError>{error}</AuthError>}

      <form onSubmit={handleLogin} className="space-y-4">
        <Field label="E-posta adresi" htmlFor="admin-login-email">
          <Input
            id="admin-login-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="yonetici@randevugo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={AUTH_INPUT}
          />
        </Field>

        <Field label="Şifre" htmlFor="admin-login-password">
          <PasswordInput
            id="admin-login-password"
            required
            autoComplete="current-password"
            placeholder="Şifreniz"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={AUTH_INPUT}
          />
        </Field>

        <Button type="submit" variant="primary" disabled={loading} className="h-10 w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Giriş yapılıyor...
            </>
          ) : (
            <>
              Yönetici olarak giriş yap
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

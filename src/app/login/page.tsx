"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthShell, AuthError } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

// 16px on phones so iOS doesn't zoom into focused fields.
const AUTH_INPUT = "h-10 text-base sm:text-sm";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Giriş yapılamadı.");
      } else {
        const role = data.user?.role?.toUpperCase();
        if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "SUPERADMIN") {
          window.location.href = "/admin";
        } else if (role === "SUPPORT") {
          window.location.href = "/support";
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch (err) {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="İşletme girişi"
      description="Randevularınızı ve işletmenizi yönetmek için giriş yapın."
      footer={
        <>
          Henüz hesabınız yok mu?{" "}
          <Link href="/register" className="font-medium text-brand hover:text-brand-hover">
            3 gün ücretsiz deneyin
          </Link>
        </>
      }
    >
      {error && <AuthError>{error}</AuthError>}

      <form onSubmit={handleLogin} className="space-y-4">
        <Field label="E-posta adresi" htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="ornek@isletme.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={AUTH_INPUT}
          />
        </Field>

        <Field label="Şifre" htmlFor="login-password">
          <PasswordInput
            id="login-password"
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
              Giriş yap
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Sparkles, CheckCircle2, Scissors, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    const targetEmail = customEmail || email;
    const targetPass = customPass || password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Giriş yapılamadı.");
      } else {
        if (data.user?.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch (err) {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(undefined, demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-3 group">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-black shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Image
                src="/brand/mascot-logo.png"
                alt="RandevuGo Logo"
                fill
                sizes="44px"
                className="object-cover"
                unoptimized
              />
            </div>
            <Image
              src="/brand/randevugo-text-logo.png"
              alt="RandevuGo"
              width={160}
              height={26}
              priority
              className="h-7 w-auto object-contain"
              unoptimized
            />
          </Link>
          <h2 className="text-xl font-semibold text-slate-200">İşletme Girişi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Randevularınızı ve işletmenizi yönetmek için giriş yapın
          </p>
        </div>

        {/* Quick Demo Accounts Banner */}
        <div className="mb-6 rounded-2xl border border-indigo-500/25 bg-indigo-950/30 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-2.5">
            <Sparkles className="w-4 h-4" />
            <span>Hızlı Test İçin Tek Tıkla Giriş:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo("ahmet@berber.com", "123456")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              <span>Ahmet Berber</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("admin@randevugo.com", "123456")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sistem Admin</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
          {error && (
            <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-Posta Adresi
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="ahmet@berber.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-98"
            >
              <span>{loading ? "Giriş Yapılıyor..." : "Giriş Yap"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Henüz işletme hesabınız yok mu?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              3 Gün Ücretsiz Başlayın →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

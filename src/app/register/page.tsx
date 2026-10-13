"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { SECTORS, cn } from "@/lib/utils";
import { AuthShell, AuthError } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { choiceClasses } from "@/components/ui/choice";

// 16px on phones so iOS doesn't zoom into focused fields.
const AUTH_INPUT = "h-10 text-base sm:text-sm";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // User details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Business details
  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState("BERBER");
  const [city, setCity] = useState("İstanbul");
  const [address, setAddress] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // "Hazır ekibe katıl": a team member signs up with the owner's invite code (one step, mobile app afterwards).
  const [mode, setMode] = useState<"business" | "join">("business");
  const [inviteCode, setInviteCode] = useState("");
  const [joinedTeam, setJoinedTeam] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto slug generation preview
  const previewSlug = businessName
    ? businessName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
    : "isletmeniz";

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !name || !email || !password) {
      setError("Lütfen davet kodunu ve zorunlu alanları doldurunuz.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/team/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode, name, email, password, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Ekibe katılınamadı.");
      else setJoinedTeam(data.businessName);
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Lütfen zorunlu alanları doldurunuz.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName) {
      setError("Lütfen işletme adını giriniz.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          businessName,
          sector,
          city,
          address,
          whatsappNumber: whatsappNumber || phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kayıt tamamlanamadı.");
      } else {
        // Next: the plan cards with "3 gün ücretsiz deneyin" under them.
        router.push("/dashboard/subscription?hosgeldin=1");
        router.refresh();
      }
    } catch (err) {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const stepIndicator = (
    <div>
      <div className="flex items-center justify-between text-xs text-ink-3">
        <span>
          Adım {step} / 2 · {step === 1 ? "Hesap bilgileri" : "İşletme bilgileri"}
        </span>
        <span className="text-brand-ink">3 gün ücretsiz · kredi kartı gerekmez</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5" aria-hidden="true">
        <span className="h-1 rounded-full bg-brand" />
        <span className={cn("h-1 rounded-full", step === 2 ? "bg-brand" : "bg-line")} />
      </div>
    </div>
  );

  const modeSwitch = (
    <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Kayıt türü">
      {([
        ["business", "Yeni işletme"],
        ["join", "Hazır ekibe katıl"],
      ] as const).map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={mode === id}
          onClick={() => {
            setMode(id);
            setError("");
          }}
          className={choiceClasses(mode === id, "h-9 px-3 text-sm")}
        >
          {label}
        </button>
      ))}
    </div>
  );

  if (mode === "join") {
    return (
      <AuthShell
        eyebrow={modeSwitch}
        title={joinedTeam ? "Ekibe katıldınız" : "Ekibe katılın"}
        description={
          joinedTeam
            ? undefined
            : "İşletme sahibinin size verdiği davet kodunu girin. Size alınan randevuları mobil uygulamada görürsünüz."
        }
        footer={
          <>
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
              Giriş yapın
            </Link>
          </>
        }
      >
        {joinedTeam ? (
          <div className="flex items-start gap-3 rounded-control border border-line bg-surface p-4 text-sm" role="status">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
            <p className="text-ink-2">
              <strong className="font-medium text-ink">{joinedTeam}</strong> ekibine katıldınız. Mobil uygulamayı açın ve{" "}
              <strong className="font-medium text-ink">{email}</strong> adresi ile oluşturduğunuz şifreyle giriş yapın.
            </p>
          </div>
        ) : (
          <>
            {error && <AuthError>{error}</AuthError>}
            <form onSubmit={handleJoin} className="space-y-4">
              <Field label="Davet kodu *" htmlFor="join-code">
                <Input
                  id="join-code"
                  type="text"
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                  placeholder="K7M2-QXAB"
                  maxLength={12}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className={cn(AUTH_INPUT, "tracking-widest")}
                />
              </Field>
              <Field label="Ad soyad *" htmlFor="join-name">
                <Input id="join-name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={AUTH_INPUT} />
              </Field>
              <Field label="E-posta adresi *" htmlFor="join-email">
                <Input
                  id="join-email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={AUTH_INPUT}
                />
              </Field>
              <Field label="Şifre *" htmlFor="join-password" hint="En az 8 karakter.">
                <PasswordInput
                  id="join-password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={AUTH_INPUT}
                />
              </Field>
              <Field label="Telefon numarası" htmlFor="join-phone">
                <Input id="join-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={AUTH_INPUT} />
              </Field>
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
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={
        step === 1 ? (
          <div className="space-y-4">
            {modeSwitch}
            {stepIndicator}
          </div>
        ) : (
          stepIndicator
        )
      }
      title={step === 1 ? "Hesabınızı oluşturun" : "İşletmenizi tanıtın"}
      description={
        step === 1
          ? "Birkaç dakikada işletmenizi online rezervasyona açın."
          : "Bu bilgiler rezervasyon sayfanızda görünür; sonradan değiştirebilirsiniz."
      }
      footer={
        <>
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
            Giriş yapın
          </Link>
        </>
      }
    >
      {error && <AuthError>{error}</AuthError>}

      {step === 1 ? (
        <form onSubmit={handleNext} className="space-y-4">
          <Field label="Ad soyad *" htmlFor="reg-name">
            <Input
              id="reg-name"
              type="text"
              required
              autoComplete="name"
              placeholder="Ahmet Yılmaz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={AUTH_INPUT}
            />
          </Field>

          <Field label="E-posta adresi *" htmlFor="reg-email">
            <Input
              id="reg-email"
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

          <Field label="Şifre *" htmlFor="reg-password" hint="En az 6 karakter önerilir.">
            <PasswordInput
              id="reg-password"
              required
              autoComplete="new-password"
              placeholder="Şifre belirleyin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={AUTH_INPUT}
            />
          </Field>

          <Field label="Telefon numarası" htmlFor="reg-phone">
            <Input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              placeholder="0532 000 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={AUTH_INPUT}
            />
          </Field>

          <Button type="submit" variant="primary" className="h-10 w-full">
            Devam et
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <Field
            label="İşletme adı *"
            htmlFor="reg-business"
            hint={
              <>
                Rezervasyon adresiniz: <span className="font-medium text-ink-2">calendlygo.com/{previewSlug}</span>
              </>
            }
          >
            <Input
              id="reg-business"
              type="text"
              required
              autoComplete="organization"
              placeholder="Örn: Ahmet Berber & Stil"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className={AUTH_INPUT}
            />
          </Field>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium text-ink-2">Sektör *</legend>
            <div className="grid grid-cols-2 gap-2">
              {SECTORS.map((sec) => (
                <button
                  type="button"
                  key={sec.id}
                  aria-pressed={sector === sec.id}
                  onClick={() => setSector(sec.id)}
                  className={choiceClasses(sector === sec.id, "flex h-10 items-center gap-2 px-3 text-left")}
                >
                  <span
                    className={cn(
                      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                      sector === sec.id ? "border-brand bg-brand" : "border-line-strong"
                    )}
                    aria-hidden="true"
                  >
                    {sector === sec.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="truncate">{sec.name}</span>
                </button>
              ))}
            </div>
          </fieldset>


          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Şehir" htmlFor="reg-city">
              <Input
                id="reg-city"
                type="text"
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={AUTH_INPUT}
              />
            </Field>
            <Field label="WhatsApp numarası" htmlFor="reg-wa">
              <Input
                id="reg-wa"
                type="tel"
                placeholder="0532 000 00 00"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className={AUTH_INPUT}
              />
            </Field>
          </div>

          <Field label="Açık adres" htmlFor="reg-address">
            <Textarea
              id="reg-address"
              rows={2}
              autoComplete="street-address"
              placeholder="Mahalle, cadde, no, ilçe"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="text-base sm:text-sm"
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <Button onClick={() => setStep(1)} disabled={loading} className="h-10">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Geri
            </Button>
            <Button type="submit" variant="primary" disabled={loading} className="h-10 flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Hesap oluşturuluyor...
                </>
              ) : (
                "Ücretsiz denemeyi başlat"
              )}
            </Button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

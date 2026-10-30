import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { Aurora } from "@/components/Aurora";

const HIGHLIGHTS = [
  "Online rezervasyonlar 7/24 açık, takviminiz her zaman güncel",
  "Müşteri, hizmet ve çalışan yönetimi tek panelde",
  "İşletmenize özel rezervasyon sayfası dakikalar içinde hazır",
];

interface AuthShellProps {
  title: string;
  description?: React.ReactNode;
  /** Small line above the title, e.g. a step indicator. */
  eyebrow?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Shared frame for the sign-in and sign-up screens: a glass form over slow light, brand panel on large screens. */
export function AuthShell({ title, description, eyebrow, children, footer }: AuthShellProps) {
  return (
    <div className="auth-shell relative min-h-dvh overflow-hidden bg-canvas text-ink lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)]">
      {/* Form column */}
      <main className="relative flex min-h-dvh flex-col px-4 py-6 sm:px-8 lg:min-h-0">
        <Aurora />
        <Link
          href="/"
          className="relative inline-flex items-center gap-2 self-start rounded-control lg:hidden"
          aria-label="CalendlyGo ana sayfa"
        >
          {/* Light background here: the icon on its dark tile (the cut-out mark washes out on white). */}
          <span className="relative h-10 w-10 overflow-hidden rounded-[11px] bg-black shadow-raised">
            <Image src="/brand/calendlygo-icon-192.png" alt="" fill sizes="40px" className="object-cover" unoptimized />
          </span>
          <span className="text-base font-semibold tracking-tight">CalendlyGo</span>
        </Link>

        <div className="auth-rise relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="auth-card p-6 sm:p-8">
            <div className="mb-6">
              {eyebrow && <div className="mb-4">{eyebrow}</div>}
              <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-ink">{title}</h1>
              {description && <p className="mt-2 text-sm leading-6 text-ink-3">{description}</p>}
            </div>

            {children}

            {footer && <div className="mt-7 border-t border-line pt-5 text-center text-sm text-ink-3">{footer}</div>}
          </div>
        </div>

        <p className="relative text-center text-xs text-ink-3">© {new Date().getFullYear()} CalendlyGo</p>
      </main>

      {/* Brand panel (large screens) */}
      <aside className="dark admin-shell relative hidden flex-col justify-between overflow-hidden p-12 text-slate-300 lg:flex">
        <Aurora />
        <Link href="/" className="relative inline-flex items-center gap-3 self-start rounded-control" aria-label="CalendlyGo ana sayfa">
          <span className="relative h-12 w-12 rounded-control">
            <Image src="/brand/calendlygo-mark.png" alt="" fill sizes="48px" className="object-contain" unoptimized />
          </span>
          <Image
            src="/brand/calendlygo-text-logo.png"
            alt="CalendlyGo"
            width={150}
            height={24}
            priority
            className="h-6 w-auto object-contain"
            unoptimized
          />
        </Link>

        <div className="relative max-w-md">
          <p className="font-display text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.035em] text-white">
            Randevularınız.
            <br />
            <span className="text-slate-400">Tek yerde, zahmetsizce.</span>
          </p>
          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6">
                <Check className="mt-1 h-4 w-4 shrink-0 text-[#34D399]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-400">Berber, güzellik, klinik, restoran ve oto servis işletmeleri için.</p>
      </aside>
    </div>
  );
}

/** Inline error message shared by the auth forms. */
export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mb-4 rounded-control border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger"
    >
      {children}
    </p>
  );
}

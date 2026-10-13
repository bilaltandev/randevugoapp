import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";

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

/** Shared frame for /login and /register: form column + brand panel on large screens. */
export function AuthShell({ title, description, eyebrow, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-canvas text-ink lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
      {/* Form column */}
      <main className="flex min-h-dvh flex-col px-4 py-6 sm:px-8 lg:min-h-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2 self-start rounded-control lg:hidden"
          aria-label="CalendlyGo ana sayfa"
        >
          <span className="relative h-8 w-8 overflow-hidden rounded-control bg-black">
            <Image src="/brand/calendlygo-mark.png" alt="" fill sizes="32px" className="object-cover" unoptimized />
          </span>
          <span className="text-base font-semibold tracking-tight">CalendlyGo</span>
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="mb-6">
            {eyebrow && <div className="mb-3">{eyebrow}</div>}
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
            {description && <p className="mt-1.5 text-sm text-ink-3">{description}</p>}
          </div>

          {children}

          {footer && <div className="mt-8 border-t border-line pt-5 text-center text-sm text-ink-3">{footer}</div>}
        </div>

        <p className="text-center text-xs text-ink-3">© {new Date().getFullYear()} CalendlyGo</p>
      </main>

      {/* Brand panel (large screens) */}
      <aside className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-text lg:flex">
        <Link href="/" className="inline-flex items-center gap-3 self-start rounded-control" aria-label="CalendlyGo ana sayfa">
          <span className="relative h-10 w-10 overflow-hidden rounded-control bg-black">
            <Image src="/brand/calendlygo-mark.png" alt="" fill sizes="40px" className="object-cover" unoptimized />
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

        <div className="max-w-sm">
          <p className="text-2xl font-semibold leading-snug tracking-tight text-sidebar-text-strong">
            Randevularınızı tek yerden, zahmetsizce yönetin.
          </p>
          <ul className="mt-6 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sidebar-raised">
                  <Check className="h-3 w-3 text-[#34D399]" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs">Berber, güzellik, klinik, restoran ve oto servis işletmeleri için.</p>
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

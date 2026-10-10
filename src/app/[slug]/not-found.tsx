import Link from "next/link";
import { SearchX } from "lucide-react";

export default function BusinessNotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 text-ink">
      <div className="max-w-sm text-center">
        <SearchX className="mx-auto h-8 w-8 text-ink-3" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">İşletme bulunamadı</h1>
        <p className="mt-2 text-sm text-ink-3">
          Aradığınız rezervasyon sayfası kaldırılmış ya da adresi değişmiş olabilir. Bağlantıyı kontrol edip tekrar
          deneyin.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-control border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
        >
          Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}

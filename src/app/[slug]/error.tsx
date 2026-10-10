"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function BusinessPageError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 text-ink">
      <div className="max-w-sm text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-ink-3" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Sayfa şu an yüklenemedi</h1>
        <p className="mt-2 text-sm text-ink-3">
          Geçici bir sorun oluştu. Birkaç saniye sonra tekrar deneyebilirsiniz.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-control bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Tekrar dene
        </button>
      </div>
    </main>
  );
}

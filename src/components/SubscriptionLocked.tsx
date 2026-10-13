import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Shown in place of every dashboard page (except subscription and support) once the trial or plan is over. */
export function SubscriptionLocked() {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-panel border border-line bg-surface p-6 text-center shadow-panel sm:mt-16 sm:p-8">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-ink">Deneme süreniz veya aboneliğiniz sona erdi</h1>
      <p className="mt-2 text-sm text-ink-3">
        Panel ve online randevu sayfanız bir paket satın alana kadar kapalıdır. Müşterileriniz şu an randevu alamıyor.
      </p>
      <Button href="/dashboard/subscription" variant="primary" className="mt-6 w-full">
        Paketleri gör ve satın al
      </Button>
    </div>
  );
}

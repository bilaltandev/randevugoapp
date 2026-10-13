import React from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SubscriptionAlertProps {
  status?: string;
  daysRemaining?: number;
  trialEndDate?: string;
}

/** Trial countdown on the overview. Expired businesses never see it: the dashboard shows the lock screen. */
export function SubscriptionAlert({ status = "trial", daysRemaining = 3 }: SubscriptionAlertProps) {
  if (status !== "trial") return null;

  return (
    <div className="flex flex-col gap-3 rounded-panel border border-pending-line bg-pending-soft px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5 text-sm">
        <Clock className="w-4 h-4 shrink-0 text-pending" aria-hidden="true" />
        <p className="text-ink">
          <span className="font-medium">
            {daysRemaining > 0
              ? `Ücretsiz denemenizin bitmesine ${daysRemaining} gün kaldı.`
              : "Ücretsiz denemeniz bugün sona eriyor."}
          </span>{" "}
          <span className="text-ink-2">Süre bitince panel ve randevu sayfanız kapanır.</span>
        </p>
      </div>
      <Button href="/dashboard/subscription" variant="primary" size="sm" className="self-start sm:self-auto">
        Paket satın al
      </Button>
    </div>
  );
}

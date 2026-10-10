"use client";

import React, { useState } from "react";
import { Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SubscriptionAlertProps {
  status?: string;
  daysRemaining?: number;
  trialEndDate?: string;
}

export function SubscriptionAlert({
  status = "trial",
  daysRemaining = 3,
}: SubscriptionAlertProps) {
  const [upgrading, setUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleQuickUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "PayTR", planType: "PRO" }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Aboneliğiniz 89 TL / Ay üzerinden başarıyla aktif edildi!");
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpgrading(false);
    }
  };

  if (successMsg) {
    return (
      <div role="status" className="flex items-center gap-2.5 rounded-panel border border-brand-line bg-brand-soft px-4 py-3 text-sm text-brand-ink">
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{successMsg}</span>
      </div>
    );
  }

  if (status === "expired" || status === "cancelled") {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-panel border border-danger-line bg-danger-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 w-4 h-4 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-ink">Aboneliğinizin süresi doldu</p>
            <p className="mt-0.5 text-sm text-ink-2">
              Müşterileriniz şu an randevu oluşturamıyor. Aylık 89 TL ile kesintisiz devam edebilirsiniz.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="primary" onClick={handleQuickUpgrade} disabled={upgrading}>
            {upgrading ? "İşleniyor…" : "Aboneliği başlat"}
          </Button>
          <Button href="/dashboard/subscription">Detaylar</Button>
        </div>
      </div>
    );
  }

  if (status === "trial") {
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
            <span className="text-ink-2">Pro planı aylık 89 TL.</span>
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleQuickUpgrade} disabled={upgrading} className="self-start sm:self-auto">
          {upgrading ? "Aktif ediliyor…" : "Pro'ya geç"}
        </Button>
      </div>
    );
  }

  return null;
}

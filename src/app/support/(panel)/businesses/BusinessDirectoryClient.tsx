"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Field";
import { SUBSCRIPTION_LABELS } from "@/components/support/BusinessSummary";
import { SECTORS } from "@/lib/utils";

interface DirectoryBusiness {
  id: string;
  name: string;
  sector: string;
  phone: string;
  city: string;
  isActive: boolean;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string | null;
  subscriptionStatus: string | null;
  openTickets: number;
}

const digits = (v: string) => v.replace(/\D/g, "");

export default function BusinessDirectoryClient({ businesses }: { businesses: DirectoryBusiness[] }) {
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");
    if (!q) return businesses;
    const qDigits = digits(q);
    return businesses.filter((b) => {
      const text = [b.name, b.ownerName, b.ownerEmail, b.city].some((v) =>
        v.toLocaleLowerCase("tr-TR").includes(q)
      );
      // Phone numbers are matched on digits so "0532 123" finds "+90 532 123...".
      const phone =
        qDigits.length >= 3 && [b.phone, b.ownerPhone ?? ""].some((p) => digits(p).includes(qDigits));
      return text || phone;
    });
  }, [businesses, search]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="İşletmeler"
        description="Yardım edeceğiniz işletmeyi ad, sahip, e-posta veya telefonla bulun."
      />

      <div className="relative sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
        <Input
          type="search"
          aria-label="İşletme ara"
          placeholder="İşletme, sahip, e-posta veya telefon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-base sm:text-sm"
        />
      </div>

      <Panel flush>
        {visible.length === 0 ? (
          <EmptyState icon={Building2} title="Eşleşen işletme bulunamadı" />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/support/businesses/${b.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">{b.name}</span>
                      {!b.isActive && (
                        <span className="rounded-control border border-danger-line bg-danger-soft px-1.5 py-px text-[11px] font-medium text-danger">
                          Pasif
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-3">
                      {[b.ownerName, b.ownerEmail, SECTORS.find((s) => s.id === b.sector)?.name, b.city]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-ink-3">
                    {b.openTickets > 0 && (
                      <span className="rounded-control border border-pending-line bg-pending-soft px-1.5 py-0.5 font-medium text-pending">
                        {b.openTickets} açık talep
                      </span>
                    )}
                    <span className="hidden sm:inline">
                      {b.subscriptionStatus ? SUBSCRIPTION_LABELS[b.subscriptionStatus] ?? b.subscriptionStatus : "Abonelik yok"}
                    </span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

"use client";

import React, { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Contact2, Search, MessageSquare, Phone } from "lucide-react";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SheetAction, SheetRows, SideSheet } from "@/components/ui/SideSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Textarea } from "@/components/ui/Field";

interface CustomersClientProps {
  businessId: string;
  initialCustomers: any[];
}

export default function CustomersClient({
  businessId,
  initialCustomers,
}: CustomersClientProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  // The command palette links here with ?q=<name> to open the list filtered to one customer.
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const closeSheet = useCallback(() => setSelectedCust(null), []);

  const handleOpenNotes = (cust: any) => {
    setSelectedCust(cust);
    setNotes(cust.notes || "");
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust) return;
    setSavingNotes(true);
    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCust.id, notes }),
      });
      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === selectedCust.id ? { ...c, notes } : c))
        );
        setSelectedCust(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotes(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const whatsappHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

  // Alphabetical sections, like the iOS Contacts app.
  const letters: { letter: string; items: any[] }[] = [];
  for (const cust of [...filtered].sort((a, b) => a.name.localeCompare(b.name, "tr-TR"))) {
    const letter = cust.name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "#";
    const last = letters[letters.length - 1];
    if (last?.letter === letter) last.items.push(cust);
    else letters.push({ letter, items: [cust] });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Müşteriler"
        actions={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <Input
              type="search"
              placeholder="Ad, telefon veya e-posta..."
              aria-label="Müşteri ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full border-transparent bg-surface-muted pl-9"
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <div className="ios-group">
          <EmptyState
            icon={Contact2}
            title={search ? "Aramaya uygun müşteri yok" : "Henüz müşteri yok"}
            description={search ? undefined : "İlk rezervasyonla birlikte müşteriler burada listelenir."}
          />
        </div>
      ) : (
        letters.map(({ letter, items }) => (
          <section key={letter} aria-label={letter}>
            <h3 className="ios-section-title">{letter}</h3>
            <ul className="ios-list ios-group [--ios-inset:64px]">
              {items.map((cust) => (
                <li key={cust.id}>
                  <button
                    type="button"
                    onClick={() => handleOpenNotes(cust)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-muted/60"
                  >
                    <Avatar name={cust.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-ink">{cust.name}</span>
                      <span className="block truncate text-[13px] text-ink-3 tabular-nums">{formatPhoneNumber(cust.phone)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-medium text-ink tabular-nums">{formatCurrency(cust.totalSpent)}</span>
                      <span className="block text-xs text-ink-3">{cust.totalAppointments} randevu</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {selectedCust && (
        <SideSheet title="Müşteri" onClose={closeSheet}>
          <form onSubmit={handleSaveNotes} className="space-y-5">
            <div className="flex flex-col items-center text-center">
              <Avatar name={selectedCust.name} size="lg" />
              <p className="mt-3 font-display text-[24px] font-semibold leading-tight tracking-[-0.03em] text-ink">{selectedCust.name}</p>
              <p className="mt-0.5 text-sm text-ink-3 tabular-nums">{formatPhoneNumber(selectedCust.phone)}</p>
            </div>

            <div className="flex justify-center gap-2">
              <SheetAction icon={Phone} label="Ara" href={`tel:${selectedCust.phone}`} />
              <SheetAction icon={MessageSquare} label="WhatsApp" href={whatsappHref(selectedCust.phone)} external />
            </div>

            <SheetRows
              rows={[
                ["Randevu", selectedCust.totalAppointments],
                ["Toplam harcama", formatCurrency(selectedCust.totalSpent)],
                ["E-posta", selectedCust.email],
              ]}
            />

            <div>
              <label htmlFor="customer-note" className="block px-1 pb-1 text-[13px] font-medium text-ink-3">
                Size özel not
              </label>
              <Textarea
                id="customer-note"
                rows={4}
                placeholder="Örn: Saç dipleri alerjik, sert wax istemiyor. Çay ikramı tercih ediyor."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <p className="px-1 pt-1 text-xs text-ink-3">Müşteri bu notu göremez.</p>
            </div>

            <Button type="submit" variant="primary" disabled={savingNotes} className="w-full">
              {savingNotes ? "Kaydediliyor..." : "Notu kaydet"}
            </Button>
          </form>
        </SideSheet>
      )}
    </div>
  );
}

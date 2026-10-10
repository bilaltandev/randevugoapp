"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Contact2, Search, MessageSquare, FileEdit, Phone } from "lucide-react";
import { formatCurrency, formatPhoneNumber, cn } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Textarea } from "@/components/ui/Field";
import { table } from "@/components/ui/table";

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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Müşteriler"
        description="Randevu alan müşterilerin geçmişi, toplam harcaması ve size özel notlarınız."
        actions={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <Input
              type="search"
              placeholder="Ad, telefon veya e-posta..."
              aria-label="Müşteri ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      />

      <Panel flush>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Contact2}
            title={search ? "Aramaya uygun müşteri yok" : "Henüz müşteri yok"}
            description={search ? undefined : "İlk rezervasyonla birlikte müşteriler burada listelenir."}
          />
        ) : (
          <>
            {/* Mobile: list rows */}
            <ul className="divide-y divide-line md:hidden">
              {filtered.map((cust) => (
                <li key={cust.id} className="space-y-2.5 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Avatar name={cust.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{cust.name}</p>
                      <a href={`tel:${cust.phone}`} className="text-sm text-ink-3 tabular-nums hover:text-ink">
                        {formatPhoneNumber(cust.phone)}
                      </a>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums text-ink">{formatCurrency(cust.totalSpent)}</p>
                      <p className="text-xs text-ink-3">{cust.totalAppointments} randevu</p>
                    </div>
                  </div>

                  {cust.notes && (
                    <p className="rounded-control bg-surface-muted px-2.5 py-1.5 text-sm text-ink-2">{cust.notes}</p>
                  )}

                  <div className="flex items-center gap-1.5">
                    <a href={`tel:${cust.phone}`} className={buttonClasses("secondary", "sm", "flex-1")}>
                      <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                      Ara
                    </a>
                    <a
                      href={whatsappHref(cust.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClasses("secondary", "sm", "flex-1")}
                    >
                      <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                      WhatsApp
                    </a>
                    <Button size="sm" variant="ghost" className="w-8 px-0" onClick={() => handleOpenNotes(cust)} aria-label="Notu düzenle">
                      <FileEdit className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className={cn(table.wrapper, "hidden md:block")}>
              <table className={table.table}>
                <thead className={table.head}>
                  <tr>
                    <th className={table.th}>Müşteri</th>
                    <th className={table.th}>İletişim</th>
                    <th className={cn(table.th, "text-right")}>Randevu</th>
                    <th className={cn(table.th, "text-right")}>Toplam harcama</th>
                    <th className={table.th}>Özel not</th>
                    <th className={cn(table.th, "text-right")}>İşlemler</th>
                  </tr>
                </thead>
                <tbody className={table.body}>
                  {filtered.map((cust) => (
                    <tr key={cust.id} className={table.row}>
                      <td className={table.td}>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={cust.name} size="sm" />
                          <span className="font-medium text-ink">{cust.name}</span>
                        </div>
                      </td>

                      <td className={table.td}>
                        <div className="tabular-nums text-ink">{formatPhoneNumber(cust.phone)}</div>
                        {cust.email && <div className="text-xs text-ink-3">{cust.email}</div>}
                      </td>

                      <td className={cn(table.td, "text-right tabular-nums")}>{cust.totalAppointments}</td>

                      <td className={cn(table.td, "text-right font-medium tabular-nums")}>
                        {formatCurrency(cust.totalSpent)}
                      </td>

                      <td className={table.td}>
                        {cust.notes ? (
                          <p className="max-w-[220px] truncate text-ink-2">{cust.notes}</p>
                        ) : (
                          <span className="text-ink-3">—</span>
                        )}
                      </td>

                      <td className={cn(table.td, "whitespace-nowrap text-right")}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-8 px-0"
                            onClick={() => handleOpenNotes(cust)}
                            title="Notu düzenle"
                            aria-label={`${cust.name} için notu düzenle`}
                          >
                            <FileEdit className="w-4 h-4" />
                          </Button>
                          <a
                            href={whatsappHref(cust.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonClasses("ghost", "sm", "w-8 px-0")}
                            title="WhatsApp'tan yaz"
                            aria-label={`${cust.name} ile WhatsApp'tan yazış`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>

      {/* Note Editor Modal */}
      {selectedCust && (
        <Modal isOpen={!!selectedCust} onClose={() => setSelectedCust(null)} title={`Müşteri notu: ${selectedCust.name}`}>
          <form onSubmit={handleSaveNotes} className="space-y-4">
            <p className="text-sm text-ink-3">
              Bu müşteriye özel tercihleri veya dikkat edilmesi gereken detayları kaydedin. Müşteri bu notu göremez.
            </p>

            <Textarea
              rows={4}
              aria-label="Müşteri notu"
              placeholder="Örn: Saç dipleri alerjik, sert wax istemiyor. Çay ikramı tercih ediyor."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <Button type="submit" variant="primary" disabled={savingNotes} className="w-full">
              {savingNotes ? "Kaydediliyor..." : "Notu kaydet"}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

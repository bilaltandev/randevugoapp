"use client";

import React, { useState } from "react";
import {
  Contact2,
  Search,
  MessageSquare,
  FileEdit,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import { Modal } from "@/components/Modal";

interface CustomersClientProps {
  businessId: string;
  initialCustomers: any[];
}

export default function CustomersClient({
  businessId,
  initialCustomers,
}: CustomersClientProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] dark:text-slate-100">
            Müşteri İlişkileri (CRM)
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 mt-0.5">
            İşletmenizden randevu alan tüm müşterilerin geçmişi, toplam harcaması ve özel notları.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#98A2B3] dark:text-slate-500" />
          <input
            type="text"
            placeholder="Müşteri adı veya telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/60 pl-10 pr-4 py-2.5 text-xs text-[#111827] dark:text-slate-200 placeholder-[#98A2B3] dark:placeholder-slate-500 focus:border-[#6246EA] focus:outline-none transition-colors shadow-xs"
          />
        </div>
      </div>

      {/* Customers List Container */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm backdrop-blur-xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[#667085] dark:text-slate-400 text-xs">
            <Contact2 className="w-10 h-10 text-[#98A2B3] dark:text-slate-600 mx-auto mb-3" />
            Henüz kayıtlı müşteri bulunmuyor veya arama sonucu boş.
          </div>
        ) : (
          <>
            {/* MOBILE CARD VIEW (block md:hidden) */}
            <div className="block md:hidden divide-y divide-[#E4E7EC] dark:divide-slate-800">
              {filtered.map((cust) => (
                <div key={cust.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6246EA] dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {cust.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#111827] dark:text-slate-100 text-sm">
                          {cust.name}
                        </div>
                        <a
                          href={`tel:${cust.phone}`}
                          className="text-xs text-[#667085] dark:text-slate-400 hover:text-[#6246EA] transition-colors"
                        >
                          {formatPhoneNumber(cust.phone)}
                        </a>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F8F9FC] dark:bg-slate-800 text-[#344054] dark:text-slate-300 border border-[#E4E7EC] dark:border-slate-700 shrink-0">
                      {cust.totalAppointments} Randevu
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-[#F8F9FC] dark:bg-slate-950/40 rounded-xl px-3 py-2 border border-[#E4E7EC] dark:border-slate-800">
                    <span className="text-[#667085] dark:text-slate-400">Toplam Harcama:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(cust.totalSpent)}
                    </span>
                  </div>

                  {cust.notes && (
                    <div className="text-xs bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-500/20 rounded-xl p-2.5 text-amber-900 dark:text-amber-200 italic">
                      "{cust.notes}"
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`tel:${cust.phone}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E4E7EC] dark:border-slate-700 bg-white dark:bg-slate-800/80 py-2 text-xs font-semibold text-[#344054] dark:text-slate-200 hover:bg-[#F8F9FC] transition-colors shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#6246EA]" />
                      <span>Ara</span>
                    </a>
                    <a
                      href={`https://wa.me/${cust.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      onClick={() => handleOpenNotes(cust)}
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-[#E4E7EC] dark:border-slate-700 bg-white dark:bg-slate-800/80 text-[#667085] dark:text-slate-300 hover:bg-[#F8F9FC] transition-colors shadow-xs"
                      title="Not Düzenle"
                    >
                      <FileEdit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#E4E7EC] dark:border-slate-800 bg-[#F8F9FC] dark:bg-slate-950/60 text-[#667085] dark:text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Müşteri</th>
                    <th className="py-3.5 px-4">Telefon & E-Posta</th>
                    <th className="py-3.5 px-4">Toplam Randevu</th>
                    <th className="py-3.5 px-4">Toplam Harcama</th>
                    <th className="py-3.5 px-4">Özel Not</th>
                    <th className="py-3.5 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC] dark:divide-slate-800/80">
                  {filtered.map((cust) => (
                    <tr key={cust.id} className="hover:bg-[#F8F9FC] dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#111827] dark:text-slate-100 text-sm flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#6246EA] dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                            {cust.name.slice(0, 1).toUpperCase()}
                          </div>
                          <span>{cust.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[#111827] dark:text-slate-200 font-medium">{formatPhoneNumber(cust.phone)}</div>
                        {cust.email && <div className="text-[11px] text-[#667085] dark:text-slate-500">{cust.email}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F8F9FC] dark:bg-slate-800 px-2.5 py-0.5 font-semibold text-[#344054] dark:text-slate-300 border border-[#E4E7EC] dark:border-slate-700">
                          {cust.totalAppointments} kez
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(cust.totalSpent)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {cust.notes ? (
                          <p className="text-xs text-[#344054] dark:text-slate-300 max-w-[200px] truncate italic">
                            "{cust.notes}"
                          </p>
                        ) : (
                          <span className="text-[#98A2B3] dark:text-slate-600 text-[11px]">Not eklenmemiş</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenNotes(cust)}
                            className="p-1.5 rounded-lg border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#667085] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-100 hover:bg-[#F8F9FC] dark:hover:bg-slate-800 transition-colors"
                            title="Not Düzenle"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>
                          <a
                            href={`https://wa.me/${cust.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#667085] dark:text-slate-400 hover:text-emerald-500 hover:bg-[#F8F9FC] dark:hover:bg-slate-800 transition-colors"
                            title="WhatsApp İletişim"
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
      </div>

      {/* Note Editor Modal */}
      {selectedCust && (
        <Modal
          isOpen={!!selectedCust}
          onClose={() => setSelectedCust(null)}
          title={`Müşteri Notu: ${selectedCust.name}`}
        >
          <form onSubmit={handleSaveNotes} className="space-y-4 text-xs">
            <p className="text-[#667085] dark:text-slate-400">
              Bu müşteriye özel tercihleri veya dikkat edilmesi gereken detayları kaydedin (Müşteri bu notu göremez).
            </p>

            <textarea
              rows={4}
              placeholder="Örn: Saç dipleri alerjik, sert wax istemiyor. Çay ikramı tercih ediyor."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3.5 text-sm text-[#111827] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-600 focus:border-[#6246EA] focus:outline-none transition-colors"
            />

            <button
              type="submit"
              disabled={savingNotes}
              className="w-full rounded-xl bg-[#6246EA] py-3 text-sm font-semibold text-white shadow-lg shadow-[#6246EA]/25 hover:bg-[#5235D9] transition-all disabled:opacity-50"
            >
              {savingNotes ? "Kaydediliyor..." : "Notu Kaydet"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

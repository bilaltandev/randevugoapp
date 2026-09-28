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
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Müşteri İlişkileri (CRM)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            İşletmenizden randevu alan tüm müşterilerin geçmişi, toplam harcaması ve özel notları.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Müşteri adı veya telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Contact2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            Henüz kayıtlı müşteri bulunmuyor veya arama sonucu boş.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Müşteri</th>
                  <th className="py-3.5 px-4">Telefon & E-Posta</th>
                  <th className="py-3.5 px-4">Toplam Randevu</th>
                  <th className="py-3.5 px-4">Toplam Harcama</th>
                  <th className="py-3.5 px-4">Özel Not</th>
                  <th className="py-3.5 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {cust.name.slice(0, 1)}
                        </div>
                        <span>{cust.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{formatPhoneNumber(cust.phone)}</div>
                      {cust.email && <div className="text-[11px] text-slate-500">{cust.email}</div>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 font-semibold text-slate-300">
                        {cust.totalAppointments} kez
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-400">
                        {formatCurrency(cust.totalSpent)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {cust.notes ? (
                        <p className="text-xs text-slate-300 max-w-[200px] truncate italic">
                          "{cust.notes}"
                        </p>
                      ) : (
                        <span className="text-slate-600 text-[11px]">Not eklenmemiş</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenNotes(cust)}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                          title="Not Düzenle"
                        >
                          <FileEdit className="w-4 h-4" />
                        </button>
                        <a
                          href={`https://wa.me/${cust.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
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
            <p className="text-slate-400">
              Bu müşteriye özel tercihleri veya dikkat edilmesi gereken detayları kaydedin (Müşteri bu notu göremez).
            </p>

            <textarea
              rows={4}
              placeholder="Örn: Saç dipleri alerjik, sert wax istemiyor. Çay ikramı tercih ediyor."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={savingNotes}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
            >
              {savingNotes ? "Kaydediliyor..." : "Notu Kaydet"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

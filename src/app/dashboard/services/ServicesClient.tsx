"use client";

import React, { useState } from "react";
import {
  Scissors,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/Modal";

interface ServicesClientProps {
  businessId: string;
  businessSector: string;
  initialServices: any[];
}

export default function ServicesClient({
  businessId,
  businessSector,
  initialServices,
}: ServicesClientProps) {
  const [services, setServices] = useState(initialServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [price, setPrice] = useState(300);
  const [image, setImage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // AI suggestions state
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  const handleOpenAdd = () => {
    setEditingService(null);
    setName("");
    setDescription("");
    setDurationMinutes(30);
    setPrice(300);
    setImage("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv: any) => {
    setEditingService(srv);
    setName(srv.name);
    setDescription(srv.description || "");
    setDurationMinutes(srv.durationMinutes);
    setPrice(srv.price);
    setImage(srv.image || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingService) {
        // Edit
        const res = await fetch("/api/services", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingService.id,
            name,
            description,
            durationMinutes,
            price,
            image,
          }),
        });
        const data = await res.json();
        if (data.service) {
          setServices((prev) =>
            prev.map((s) => (s.id === data.service.id ? data.service : s))
          );
          setIsModalOpen(false);
        }
      } else {
        // Create
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            durationMinutes,
            price,
            image,
          }),
        });
        const data = await res.json();
        if (data.service) {
          setServices((prev) => [data.service, ...prev]);
          setIsModalOpen(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu hizmeti silmek istediğinizden emin misiniz?")) return;
    try {
      const res = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGetAiSuggestions = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/ai/generate-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${businessSector} işletmesi için popüler hizmetler`,
          sector: businessSector,
        }),
      });
      const data = await res.json();
      if (data.data?.suggestedServices) {
        setAiSuggestions(data.data.suggestedServices);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleAddAiService = (aiSrv: any) => {
    setName(aiSrv.name);
    setDescription(aiSrv.description);
    setDurationMinutes(aiSrv.durationMinutes);
    setPrice(aiSrv.price);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] dark:text-slate-100">
            Hizmet & Fiyat Yönetimi
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 mt-0.5">
            İşletmenizin sunduğu tüm bakım, randevu ve paket hizmetlerini buradan düzenleyin.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleGetAiSuggestions}
            disabled={loadingAi}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-purple-200 dark:border-indigo-500/30 bg-purple-50 dark:bg-indigo-950/40 px-3.5 py-2.5 text-xs font-semibold text-[#6246EA] dark:text-indigo-300 hover:bg-purple-100 dark:hover:bg-indigo-900/50 transition-colors shadow-xs"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate">{loadingAi ? "Analiz..." : "AI Öner"}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#6246EA] hover:bg-[#5136D6] px-3.5 sm:px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#6246EA]/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">Hizmet Ekle</span>
          </button>
        </div>
      </div>

      {/* AI Suggestions Box (if fetched) */}
      {aiSuggestions.length > 0 && (
        <div className="rounded-2xl sm:rounded-3xl border border-[#6246EA]/20 dark:border-indigo-500/30 bg-purple-50/50 dark:bg-indigo-950/20 p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#6246EA] dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Sektörünüze Özel AI Hizmet Tavsiyeleri:
            </span>
            <button
              onClick={() => setAiSuggestions([])}
              className="text-[11px] text-[#667085] dark:text-slate-500 hover:text-[#111827] dark:hover:text-slate-300"
            >
              Gizle
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiSuggestions.map((s, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-[#E4E7EC] dark:border-slate-800 text-xs flex flex-col justify-between shadow-xs"
              >
                <div>
                  <h4 className="font-bold text-[#111827] dark:text-slate-100">{s.name}</h4>
                  <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-1 line-clamp-2">{s.description}</p>
                  <div className="flex items-center gap-2 mt-2 font-medium">
                    <span className="text-[#6246EA] dark:text-indigo-400 font-semibold">{s.durationMinutes} dk</span>
                    <span className="text-[#98A2B3]">•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(s.price)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleAddAiService(s)}
                  className="mt-3 text-left text-xs font-bold text-[#6246EA] dark:text-indigo-400 hover:underline"
                >
                  + Bu Hizmeti Ekle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {services.map((srv) => (
          <div
            key={srv.id}
            className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 hover:border-[#6246EA]/30 transition-all shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-bold text-base text-[#111827] dark:text-slate-100">{srv.name}</h3>
                <span className="shrink-0 font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                  {srv.price === 0 ? "Ücretsiz" : formatCurrency(srv.price)}
                </span>
              </div>

              {srv.description && (
                <p className="text-xs text-[#667085] dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                  {srv.description}
                </p>
              )}
            </div>

            <div className="pt-3.5 border-t border-[#E4E7EC] dark:border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#667085] dark:text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#6246EA] dark:text-indigo-400" />
                <span>{srv.durationMinutes} dakika</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(srv)}
                  className="p-1.5 rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-800 text-[#667085] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-100 hover:bg-[#F8F9FC] transition-colors shadow-xs"
                  title="Düzenle"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(srv.id)}
                  className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors shadow-xs"
                  title="Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? "Hizmeti Düzenle" : "Yeni Hizmet Ekle"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Hizmet Adı *</label>
            <input
              type="text"
              required
              placeholder="Örn: Klasik Saç Kesimi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-600 focus:border-[#6246EA] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Açıklama</label>
            <textarea
              rows={2}
              placeholder="Hizmetin kapsamı ve müşteriye sunulan detaylar"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2 text-sm text-[#111827] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-600 focus:border-[#6246EA] focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Süre (Dakika) *</label>
              <input
                type="number"
                min={5}
                step={5}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Fiyat (TL) *</label>
              <input
                type="number"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Görsel URL (İsteğe bağlı)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 placeholder-[#98A2B3] dark:placeholder-slate-600 focus:border-[#6246EA] focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#6246EA] py-3 text-sm font-semibold text-white shadow-lg shadow-[#6246EA]/25 hover:bg-[#5235D9] transition-all disabled:opacity-50"
          >
            {submitting ? "Kaydediliyor..." : editingService ? "Değişiklikleri Kaydet" : "Hizmeti Ekle"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

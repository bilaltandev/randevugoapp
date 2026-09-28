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
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Hizmet & Fiyat Yönetimi
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            İşletmenizin sunduğu tüm bakım, randevu ve paket hizmetlerini buradan düzenleyin.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleGetAiSuggestions}
            disabled={loadingAi}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/50 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{loadingAi ? "Analiz Ediliyor..." : "AI Hizmet Öner"}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Hizmet Ekle</span>
          </button>
        </div>
      </div>

      {/* AI Suggestions Box (if fetched) */}
      {aiSuggestions.length > 0 && (
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Sektörünüze Özel AI Hizmet Tavsiyeleri:
            </span>
            <button
              onClick={() => setAiSuggestions([])}
              className="text-[11px] text-slate-500 hover:text-slate-300"
            >
              Gizle
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {aiSuggestions.map((s, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-semibold text-slate-100">{s.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{s.description}</p>
                  <div className="flex items-center gap-2 mt-2 font-medium">
                    <span className="text-indigo-400">{s.durationMinutes} dk</span>
                    <span>•</span>
                    <span className="text-emerald-400">{formatCurrency(s.price)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleAddAiService(s)}
                  className="mt-3 text-left text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  + Bu Hizmeti Ekle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((srv) => (
          <div
            key={srv.id}
            className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-colors backdrop-blur-xl"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-base text-slate-100">{srv.name}</h3>
                <span className="shrink-0 font-bold text-sm text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                  {srv.price === 0 ? "Ücretsiz" : formatCurrency(srv.price)}
                </span>
              </div>

              {srv.description && (
                <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                  {srv.description}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{srv.durationMinutes} dakika</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(srv)}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                  title="Düzenle"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(srv.id)}
                  className="p-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors"
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
            <label className="block font-semibold text-slate-300 mb-1">Hizmet Adı *</label>
            <input
              type="text"
              required
              placeholder="Örn: Klasik Saç Kesimi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Açıklama</label>
            <textarea
              rows={2}
              placeholder="Hizmetin kapsamı ve müşteriye sunulan detaylar"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Süre (Dakika) *</label>
              <input
                type="number"
                min={5}
                step={5}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Fiyat (TL) *</label>
              <input
                type="number"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Görsel URL (İsteğe bağlı)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
          >
            {submitting ? "Kaydediliyor..." : editingService ? "Değişiklikleri Kaydet" : "Hizmeti Ekle"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

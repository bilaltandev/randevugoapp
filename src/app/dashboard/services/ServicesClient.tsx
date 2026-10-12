"use client";

import React, { useState } from "react";
import { Scissors, Plus, Edit2, Trash2, Clock, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Textarea } from "@/components/ui/Field";

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
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Silme işlemi tamamlanamadı.");
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
    <div className="space-y-5">
      <PageHeader
        title="Hizmetler"
        description="Sunduğunuz hizmetleri, sürelerini ve fiyatlarını buradan yönetin."
        actions={
          <>
            <Button onClick={handleGetAiSuggestions} disabled={loadingAi}>
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {loadingAi ? "Hazırlanıyor..." : "Öneri al"}
            </Button>
            <Button variant="primary" onClick={handleOpenAdd}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              Hizmet ekle
            </Button>
          </>
        }
      />

      {/* AI suggestions (if fetched) */}
      {aiSuggestions.length > 0 && (
        <Panel
          title="Sektörünüze uygun hizmet önerileri"
          description="Bir öneriyi seçtiğinizde form doldurulmuş olarak açılır; kaydetmeden önce düzenleyebilirsiniz."
          action={
            <Button size="sm" variant="ghost" onClick={() => setAiSuggestions([])}>
              Gizle
            </Button>
          }
          flush
        >
          <ul className="divide-y divide-line">
            {aiSuggestions.map((s, i) => (
              <li key={i} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{s.name}</p>
                  {s.description && <p className="line-clamp-1 text-sm text-ink-3">{s.description}</p>}
                </div>
                <span className="text-sm tabular-nums text-ink-2">
                  {s.durationMinutes} dk · {formatCurrency(s.price)}
                </span>
                <Button size="sm" onClick={() => handleAddAiService(s)}>
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  Ekle
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Services list */}
      <Panel flush>
        {services.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title="Henüz hizmet eklenmemiş"
            description="Müşterilerin rezervasyon sırasında seçebilmesi için en az bir hizmet ekleyin."
            actions={
              <Button variant="primary" size="sm" onClick={handleOpenAdd}>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Hizmet ekle
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {services.map((srv) => (
              <li key={srv.id} className="flex items-start gap-3 px-4 py-3 sm:items-center sm:gap-4 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{srv.name}</p>
                  {srv.description && <p className="mt-0.5 line-clamp-2 text-sm text-ink-3">{srv.description}</p>}
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-3 sm:hidden">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {srv.durationMinutes} dk · {srv.price === 0 ? "Ücretsiz" : formatCurrency(srv.price)}
                  </p>
                </div>

                <span className="hidden w-24 items-center gap-1.5 text-sm text-ink-3 tabular-nums sm:flex">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {srv.durationMinutes} dk
                </span>
                <span className="hidden w-24 text-right text-sm font-medium text-ink tabular-nums sm:block">
                  {srv.price === 0 ? "Ücretsiz" : formatCurrency(srv.price)}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 px-0"
                    onClick={() => handleOpenEdit(srv)}
                    title="Düzenle"
                    aria-label={`${srv.name} hizmetini düzenle`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 px-0 hover:text-danger"
                    onClick={() => handleDelete(srv.id)}
                    title="Sil"
                    aria-label={`${srv.name} hizmetini sil`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? "Hizmeti düzenle" : "Yeni hizmet"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Hizmet adı *" htmlFor="srv-name">
            <Input
              id="srv-name"
              type="text"
              required
              placeholder="Örn: Klasik Saç Kesimi"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Açıklama" htmlFor="srv-desc">
            <Textarea
              id="srv-desc"
              rows={2}
              placeholder="Hizmetin kapsamı ve müşteriye sunulan detaylar"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Süre (dakika) *" htmlFor="srv-duration">
              <Input
                id="srv-duration"
                type="number"
                min={5}
                step={5}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
              />
            </Field>
            <Field label="Fiyat (TL) *" htmlFor="srv-price">
              <Input
                id="srv-price"
                type="number"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              />
            </Field>
          </div>

          <Field label="Görsel URL" htmlFor="srv-image" hint="İsteğe bağlı">
            <Input
              id="srv-image"
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </Field>

          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            {submitting ? "Kaydediliyor..." : editingService ? "Değişiklikleri kaydet" : "Hizmeti ekle"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

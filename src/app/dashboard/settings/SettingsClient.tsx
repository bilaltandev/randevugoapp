"use client";

import React, { useState } from "react";
import {
  Settings,
  Building2,
  Phone,
  MapPin,
  Clock,
  Save,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { SECTORS } from "@/lib/utils";
import { LogoUploader } from "@/components/LogoUploader";

interface SettingsClientProps {
  initialBusiness: any;
}

const DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export default function SettingsClient({ initialBusiness }: SettingsClientProps) {
  const [business, setBusiness] = useState(initialBusiness);
  const [name, setName] = useState(initialBusiness.name);
  const [sector, setSector] = useState(initialBusiness.sector);
  const [phone, setPhone] = useState(initialBusiness.phone);
  const [address, setAddress] = useState(initialBusiness.address);
  const [city, setCity] = useState(initialBusiness.city || "İstanbul");
  const [whatsappNumber, setWhatsappNumber] = useState(initialBusiness.whatsappNumber || "");
  const [description, setDescription] = useState(initialBusiness.description || "");
  const [logo, setLogo] = useState(initialBusiness.logo || "");
  const [coverImage, setCoverImage] = useState(initialBusiness.coverImage || "");

  // Working Hours
  const [workingHours, setWorkingHours] = useState<any[]>(
    initialBusiness.workingHours || []
  );

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleWorkingHourChange = (idx: number, field: string, value: any) => {
    setWorkingHours((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/business/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sector,
          phone,
          address,
          city,
          whatsappNumber,
          description,
          logo,
          coverImage,
          workingHours,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">İşletme Ayarları</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            İşletme kimliği, haftalık çalışma saatleri ve iletişim detayları.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Kaydediliyor..." : savedSuccess ? "Kaydedildi! ✓" : "Değişiklikleri Kaydet"}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Ayarlarınız başarıyla kaydedildi!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Business Profile */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Genel İşletme Bilgileri</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">İşletme Adı *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">İşletme Sektörü</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                {SECTORS.map((sec) => (
                  <option key={sec.id} value={sec.id} className="bg-slate-900">
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Hakkımızda / Açıklama</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Logo Upload Section */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block font-semibold text-slate-300 mb-2">İşletme Logosu</label>
            <LogoUploader
              currentLogo={logo}
              businessName={name}
              onLogoChange={(newUrl) => setLogo(newUrl || "")}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Kapak Fotoğrafı URL</label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Contact and Location */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-400" />
            <span>İletişim & WhatsApp Bildirimleri</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Telefon Numarası</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">WhatsApp Randevu Hattı</label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="905321112233"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Şehir</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Açık Adres</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Working Hours Weekly Scheduler */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Haftalık Çalışma & Mola Saatleri</span>
          </h2>
          <p className="text-slate-400 mb-4">
            Rezervasyon motoru bu saat aralıklarına göre müşterilere uygun saat dilimlerini hesaplar.
          </p>

          <div className="divide-y divide-slate-800/80">
            {workingHours.map((wh, idx) => (
              <div
                key={wh.id || idx}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="w-32 flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={wh.isOpen}
                    onChange={(e) => handleWorkingHourChange(idx, "isOpen", e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={`font-semibold ${wh.isOpen ? "text-slate-100" : "text-slate-500 line-through"}`}>
                    {DAYS[wh.dayOfWeek]}
                  </span>
                </div>

                {wh.isOpen ? (
                  <div className="flex flex-wrap items-center gap-4 text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>Mesai:</span>
                      <input
                        type="time"
                        value={wh.openTime}
                        onChange={(e) => handleWorkingHourChange(idx, "openTime", e.target.value)}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-slate-200"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={wh.closeTime}
                        onChange={(e) => handleWorkingHourChange(idx, "closeTime", e.target.value)}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-slate-200"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span>Öğle Molası:</span>
                      <input
                        type="time"
                        value={wh.breakStartTime || "13:00"}
                        onChange={(e) => handleWorkingHourChange(idx, "breakStartTime", e.target.value)}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-slate-200"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={wh.breakEndTime || "14:00"}
                        onChange={(e) => handleWorkingHourChange(idx, "breakEndTime", e.target.value)}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-slate-200"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">Kapalı (Randevu alınamaz)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-indigo-600 px-8 py-3.5 text-xs font-bold text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all"
          >
            {saving ? "Kaydediliyor..." : "Tüm Ayarları Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}

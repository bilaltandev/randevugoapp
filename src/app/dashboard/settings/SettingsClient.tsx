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
  Users,
  UserCheck,
  AlertCircle,
  Check,
} from "lucide-react";
import { SECTORS, getDefaultStaffSelection } from "@/lib/utils";
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

  // Staff Selection Setting (ON / OFF)
  const [enableStaffSelection, setEnableStaffSelection] = useState<boolean>(
    initialBusiness.enableStaffSelection !== undefined
      ? Boolean(initialBusiness.enableStaffSelection)
      : getDefaultStaffSelection(initialBusiness.sector)
  );

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
          enableStaffSelection,
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827] dark:text-slate-100">İşletme Ayarları</h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 mt-0.5">
            İşletme kimliği, haftalık çalışma saatleri ve iletişim detayları.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6246EA] hover:bg-[#5136D6] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#6246EA]/25 disabled:opacity-50 transition-all active:scale-95 w-full sm:w-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Kaydediliyor..." : savedSuccess ? "Kaydedildi! ✓" : "Değişiklikleri Kaydet"}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Ayarlarınız başarıyla kaydedildi!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Business Profile */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-6 shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#111827] dark:text-slate-100 mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#6246EA]" />
            <span>Genel İşletme Bilgileri</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">İşletme Adı *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">İşletme Sektörü</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
              >
                {SECTORS.map((sec) => (
                  <option key={sec.id} value={sec.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Hakkımızda / Açıklama</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3 text-sm text-[#111827] dark:text-slate-100 placeholder-[#98A2B3] focus:border-[#6246EA] focus:outline-none transition-colors"
            />
          </div>

          {/* Logo Upload Section */}
          <div className="pt-2 border-t border-[#E4E7EC] dark:border-slate-800/80">
            <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-2">İşletme Logosu</label>
            <LogoUploader
              currentLogo={logo}
              businessName={name}
              onLogoChange={(newUrl) => setLogo(newUrl || "")}
            />
          </div>

          <div>
            <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Kapak Fotoğrafı URL</label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 placeholder-[#98A2B3] focus:border-[#6246EA] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Contact and Location */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-6 shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#111827] dark:text-slate-100 mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#6246EA]" />
            <span>İletişim & WhatsApp Bildirimleri</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Telefon Numarası</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">WhatsApp Randevu Hattı</label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="905321112233"
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Şehir</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-sm text-[#111827] dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#344054] dark:text-slate-300 mb-1">Açık Adres</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3 text-sm text-[#111827] dark:text-slate-100 focus:border-[#6246EA] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Staff Selection Configuration */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-6 shadow-sm space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-indigo-500/10 border border-purple-200 dark:border-indigo-500/20 text-[#6246EA] dark:text-indigo-400 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#111827] dark:text-slate-100 flex items-center gap-2">
                  <span>Rezervasyonlarda Uzman / Çalışan Seçimi</span>
                </h2>
                <p className="text-[#667085] dark:text-slate-400 text-xs mt-0.5">
                  Müşterilerinizin online rezervasyon esnasında personel seçip seçemeyeceğini kontrol edin.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => setEnableStaffSelection(!enableStaffSelection)}
              className={`relative inline-flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-sm shrink-0 w-full sm:w-auto ${
                enableStaffSelection
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-300"
                  : "bg-[#F8F9FC] border-[#E4E7EC] text-[#667085] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              <span>{enableStaffSelection ? "AÇIK (ON)" : "KAPALI (OFF)"}</span>
              <div
                className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                  enableStaffSelection ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                    enableStaffSelection ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Detailed explanation box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div
              className={`p-4 rounded-2xl border transition-all ${
                enableStaffSelection
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-500/30 dark:text-emerald-200"
                  : "bg-[#F8F9FC] border-[#E4E7EC] text-[#667085] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-400 opacity-60"
              }`}
            >
              <div className="font-bold text-xs mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Açık (ON) Durumunda:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-[#344054] dark:text-slate-300">
                <li>• Müşteri rezervasyon sırasında personel/uzman seçebilir.</li>
                <li>• Sadece o hizmeti veren çalışanlar filtrelenerek gösterilir.</li>
                <li>• Personelin kendi çalışma saatleri ve randevu takvimi dikkate alınır.</li>
              </ul>
            </div>

            <div
              className={`p-4 rounded-2xl border transition-all ${
                !enableStaffSelection
                  ? "bg-purple-50/60 border-purple-200 text-purple-950 dark:bg-indigo-950/30 dark:border-indigo-500/40 dark:text-indigo-200"
                  : "bg-[#F8F9FC] border-[#E4E7EC] text-[#667085] dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-400 opacity-60"
              }`}
            >
              <div className="font-bold text-xs mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#6246EA] dark:text-indigo-400" />
                <span>Kapalı (OFF) Durumunda:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-[#344054] dark:text-slate-300">
                <li>• Müşteri rezervasyon akışında uzman seçimi adımı tamamen gizlenir.</li>
                <li>• Rezervasyon doğrudan Hizmet → Tarih/Saat (veya Masa) olarak tamamlanır.</li>
                <li>• Randevular işletmeye düşer, dilediğiniz personele sonradan atayabilirsiniz.</li>
              </ul>
            </div>
          </div>

          {/* Sector recommendation notice */}
          <div className="rounded-xl bg-[#F8F9FC] dark:bg-slate-800/40 border border-[#E4E7EC] dark:border-slate-800 p-3 text-[11px] text-[#667085] dark:text-slate-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#111827] dark:text-slate-300">Sektör Varsayılanı: </span>
              {["RESTORAN", "RESTAURANT", "OTO_SERVIS"].includes(sector?.toUpperCase() || "") ? (
                <span>
                  Sektörünüz (<strong>{sector}</strong>) için bu ayarın <strong>KAPALI (OFF)</strong> olması önerilir.
                </span>
              ) : (
                <span>
                  Sektörünüz (<strong>{sector}</strong>) için bu ayarın <strong>AÇIK (ON)</strong> olması önerilir.
                </span>
              )}
              {" "}Son karar her zaman işletme sahibinindir, dilediğiniz zaman bu buton ile değiştirebilirsiniz.
            </div>
          </div>
        </div>

        {/* Working Hours Weekly Scheduler */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-6 shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#111827] dark:text-slate-100 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6246EA]" />
            <span>Haftalık Çalışma & Mola Saatleri</span>
          </h2>
          <p className="text-[#667085] dark:text-slate-400 mb-4">
            Rezervasyon motoru bu saat aralıklarına göre müşterilere uygun saat dilimlerini hesaplar.
          </p>

          <div className="divide-y divide-[#E4E7EC] dark:divide-slate-800/80">
            {workingHours.map((wh, idx) => (
              <div
                key={wh.id || idx}
                className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-[140px]">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wh.isOpen}
                      onChange={(e) => handleWorkingHourChange(idx, "isOpen", e.target.checked)}
                      className="rounded text-[#6246EA] focus:ring-[#6246EA] w-4 h-4"
                    />
                    <span className={`font-bold text-xs sm:text-sm ${wh.isOpen ? "text-[#111827] dark:text-slate-100" : "text-[#98A2B3] dark:text-slate-500 line-through"}`}>
                      {DAYS[wh.dayOfWeek]}
                    </span>
                  </label>
                  {!wh.isOpen && (
                    <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/40">
                      Kapalı
                    </span>
                  )}
                </div>

                {wh.isOpen ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full md:w-auto text-xs">
                    <div className="flex items-center justify-between sm:justify-start gap-2 bg-[#F8F9FC] dark:bg-slate-950/60 p-2 sm:px-3 rounded-xl border border-[#E4E7EC] dark:border-slate-800">
                      <span className="font-semibold text-[#344054] dark:text-slate-400 text-[11px] shrink-0">Mesai:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="time"
                          value={wh.openTime}
                          onChange={(e) => handleWorkingHourChange(idx, "openTime", e.target.value)}
                          className="rounded-lg border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-[#111827] dark:text-slate-200 text-xs font-medium focus:border-[#6246EA] focus:outline-none"
                        />
                        <span className="text-[#98A2B3]">-</span>
                        <input
                          type="time"
                          value={wh.closeTime}
                          onChange={(e) => handleWorkingHourChange(idx, "closeTime", e.target.value)}
                          className="rounded-lg border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-[#111827] dark:text-slate-200 text-xs font-medium focus:border-[#6246EA] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-2 bg-[#F8F9FC] dark:bg-slate-950/60 p-2 sm:px-3 rounded-xl border border-[#E4E7EC] dark:border-slate-800">
                      <span className="font-semibold text-[#344054] dark:text-slate-400 text-[11px] shrink-0">Mola:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="time"
                          value={wh.breakStartTime || "13:00"}
                          onChange={(e) => handleWorkingHourChange(idx, "breakStartTime", e.target.value)}
                          className="rounded-lg border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-[#111827] dark:text-slate-200 text-xs font-medium focus:border-[#6246EA] focus:outline-none"
                        />
                        <span className="text-[#98A2B3]">-</span>
                        <input
                          type="time"
                          value={wh.breakEndTime || "14:00"}
                          onChange={(e) => handleWorkingHourChange(idx, "breakEndTime", e.target.value)}
                          className="rounded-lg border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-[#111827] dark:text-slate-200 text-xs font-medium focus:border-[#6246EA] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-[#98A2B3] dark:text-slate-500 italic text-[11px] py-1">Online randevu kapalı</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#6246EA] hover:bg-[#5136D6] px-8 py-3.5 text-xs font-bold text-white shadow-md shadow-[#6246EA]/25 disabled:opacity-50 transition-all active:scale-95 w-full sm:w-auto"
          >
            {saving ? "Kaydediliyor..." : "Tüm Ayarları Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}

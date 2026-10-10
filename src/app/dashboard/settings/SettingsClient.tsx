"use client";

import React, { useState } from "react";
import { Save, CheckCircle2, Info, Check } from "lucide-react";
import { SECTORS, getDefaultStaffSelection, cn } from "@/lib/utils";
import { LogoUploader } from "@/components/LogoUploader";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea, inputClasses } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";

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

  const staffOffRecommended = ["RESTORAN", "RESTAURANT", "OTO_SERVIS"].includes(sector?.toUpperCase() || "");
  const sectorName = SECTORS.find((s) => s.id === sector)?.name ?? sector;
  const timeInput = inputClasses("h-8 w-[6.5rem] px-2 tabular-nums");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ayarlar"
        description="İşletme bilgileri, iletişim, rezervasyon tercihleri ve çalışma saatleri."
        actions={
          <Button variant="primary" onClick={handleSaveSettings} disabled={saving}>
            {savedSuccess ? <Check className="w-4 h-4" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            {saving ? "Kaydediliyor..." : savedSuccess ? "Kaydedildi" : "Değişiklikleri kaydet"}
          </Button>
        }
      />

      {savedSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-control border border-brand-line bg-brand-soft px-3 py-2 text-sm text-brand-ink"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Ayarlarınız kaydedildi.
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-5">
        {/* Business Profile */}
        <Panel title="İşletme bilgileri" description="Rezervasyon sayfanızda görünen temel bilgiler.">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="İşletme adı *" htmlFor="set-name">
                <Input id="set-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
              </Field>

              <Field label="Sektör" htmlFor="set-sector">
                <Select id="set-sector" value={sector} onChange={(e) => setSector(e.target.value)}>
                  {SECTORS.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Hakkımızda / açıklama" htmlFor="set-desc">
              <Textarea id="set-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>

            <div className="space-y-1.5 border-t border-line pt-4">
              <p className="text-sm font-medium text-ink-2">İşletme logosu</p>
              <LogoUploader
                currentLogo={logo}
                businessName={name}
                onLogoChange={(newUrl) => setLogo(newUrl || "")}
              />
            </div>

            <Field label="Kapak fotoğrafı URL" htmlFor="set-cover">
              <Input
                id="set-cover"
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </div>
        </Panel>

        {/* Contact and Location */}
        <Panel title="İletişim ve konum" description="Müşterilerin size ulaşacağı numaralar ve adres.">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Telefon numarası" htmlFor="set-phone">
                <Input id="set-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field label="WhatsApp randevu hattı" htmlFor="set-wa">
                <Input
                  id="set-wa"
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="905321112233"
                />
              </Field>
              <Field label="Şehir" htmlFor="set-city">
                <Input id="set-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} />
              </Field>
            </div>

            <Field label="Açık adres" htmlFor="set-address">
              <Textarea id="set-address" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
          </div>
        </Panel>

        {/* Staff Selection Configuration */}
        <Panel title="Rezervasyonda uzman seçimi">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p id="staff-toggle-label" className="text-sm font-medium text-ink">
                  Müşteriler personel seçebilsin
                </p>
                <p className="mt-0.5 text-sm text-ink-3">
                  {enableStaffSelection
                    ? "Müşteri hizmeti veren uzmanlar arasından seçim yapar; uzmanın kendi takvimi dikkate alınır."
                    : "Uzman seçimi adımı gizlenir; rezervasyon Hizmet → Tarih/Saat (veya Masa) olarak tamamlanır, atamayı sonradan siz yaparsınız."}
                </p>
              </div>

              <Switch
                checked={enableStaffSelection}
                onChange={setEnableStaffSelection}
                aria-labelledby="staff-toggle-label"
                className="mt-0.5"
              />
            </div>

            <p className="flex items-start gap-2 rounded-control bg-surface-muted px-3 py-2 text-sm text-ink-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
              <span>
                {sectorName} için önerilen ayar: <strong className="font-medium text-ink">{staffOffRecommended ? "Kapalı" : "Açık"}</strong>.
                Son karar sizindir; dilediğiniz zaman değiştirebilirsiniz.
              </span>
            </p>
          </div>
        </Panel>

        {/* Working Hours Weekly Scheduler */}
        <Panel
          title="Çalışma ve mola saatleri"
          description="Müşterilere gösterilen uygun saatler bu aralıklara göre hesaplanır."
          flush
        >
          <ul className="divide-y divide-line">
            {workingHours.map((wh, idx) => (
              <li
                key={wh.id || idx}
                className="flex flex-col gap-3 px-4 py-3 sm:px-5 md:flex-row md:items-center md:justify-between"
              >
                <label className="flex min-w-[150px] cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={wh.isOpen}
                    onChange={(e) => handleWorkingHourChange(idx, "isOpen", e.target.checked)}
                    className="h-4 w-4 rounded accent-brand"
                  />
                  <span className={cn("text-sm font-medium", wh.isOpen ? "text-ink" : "text-ink-3")}>
                    {DAYS[wh.dayOfWeek]}
                  </span>
                </label>

                {wh.isOpen ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-sm text-ink-3">Mesai</span>
                      <input
                        type="time"
                        aria-label={`${DAYS[wh.dayOfWeek]} açılış`}
                        value={wh.openTime}
                        onChange={(e) => handleWorkingHourChange(idx, "openTime", e.target.value)}
                        className={timeInput}
                      />
                      <span className="text-ink-3">–</span>
                      <input
                        type="time"
                        aria-label={`${DAYS[wh.dayOfWeek]} kapanış`}
                        value={wh.closeTime}
                        onChange={(e) => handleWorkingHourChange(idx, "closeTime", e.target.value)}
                        className={timeInput}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-sm text-ink-3">Mola</span>
                      <input
                        type="time"
                        aria-label={`${DAYS[wh.dayOfWeek]} mola başlangıcı`}
                        value={wh.breakStartTime || "13:00"}
                        onChange={(e) => handleWorkingHourChange(idx, "breakStartTime", e.target.value)}
                        className={timeInput}
                      />
                      <span className="text-ink-3">–</span>
                      <input
                        type="time"
                        aria-label={`${DAYS[wh.dayOfWeek]} mola bitişi`}
                        value={wh.breakEndTime || "14:00"}
                        onChange={(e) => handleWorkingHourChange(idx, "breakEndTime", e.target.value)}
                        className={timeInput}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-ink-3">Kapalı · online randevu alınmaz</span>
                )}
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Kaydediliyor..." : "Tüm ayarları kaydet"}
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Save, Check, ChevronsUpDown } from "lucide-react";
import { SECTORS, getDefaultStaffSelection, cn } from "@/lib/utils";
import { LogoUploader } from "@/components/LogoUploader";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { SettingsGroup, SettingsRow, settingsInput } from "@/components/ui/SettingsGroup";
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
  const [saveError, setSaveError] = useState<string | null>(null);

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
    setSaveError(null);

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
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Ayarlar kaydedilemedi.");
      }
    } catch (e) {
      console.error(e);
      setSaveError("Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  const staffOffRecommended = ["RESTORAN", "RESTAURANT", "OTO_SERVIS"].includes(sector?.toUpperCase() || "");
  const sectorName = SECTORS.find((s) => s.id === sector)?.name ?? sector;

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <PageHeader
        title="Ayarlar"
        actions={
          <Button variant="primary" onClick={handleSaveSettings} disabled={saving}>
            {savedSuccess ? <Check className="w-4 h-4" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            {saving ? "Kaydediliyor..." : savedSuccess ? "Kaydedildi" : "Kaydet"}
          </Button>
        }
      />

      {saveError && (
        <p role="alert" className="rounded-[14px] bg-danger-soft px-4 py-2.5 text-sm text-danger">
          {saveError}
        </p>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-7">
        <SettingsGroup title="İşletme" footer="Rezervasyon sayfanızda görünen temel bilgiler.">
          <SettingsRow label="İşletme adı">
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={settingsInput} />
          </SettingsRow>
          <SettingsRow label="Sektör">
            <select value={sector} onChange={(e) => setSector(e.target.value)} className={cn(settingsInput, "cursor-pointer appearance-none")}>
              {SECTORS.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
          </SettingsRow>
          <div className="px-4 py-3">
            <label htmlFor="set-desc" className="text-[15px] text-ink">
              Hakkımızda
            </label>
            <Textarea
              id="set-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 border-transparent bg-surface-muted/60"
            />
          </div>
        </SettingsGroup>

        <SettingsGroup title="Görseller">
          <div className="space-y-1.5 px-4 py-3">
            <p className="text-[15px] text-ink">Logo</p>
            <LogoUploader currentLogo={logo} businessName={name} onLogoChange={(newUrl) => setLogo(newUrl || "")} />
          </div>
          <SettingsRow label="Kapak fotoğrafı">
            <input type="url" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." className={settingsInput} />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="İletişim ve konum" footer="Müşterilerin size ulaşacağı numaralar ve adres.">
          <SettingsRow label="Telefon">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={settingsInput} />
          </SettingsRow>
          <SettingsRow label="WhatsApp">
            <input type="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="905321112233" className={settingsInput} />
          </SettingsRow>
          <SettingsRow label="Şehir">
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={settingsInput} />
          </SettingsRow>
          <SettingsRow label="Açık adres">
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={settingsInput} />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup
          title="Rezervasyon"
          footer={
            <>
              {enableStaffSelection
                ? "Müşteri hizmeti veren uzmanlar arasından seçim yapar; uzmanın kendi takvimi dikkate alınır."
                : "Uzman seçimi adımı gizlenir; atamayı sonradan siz yaparsınız."}{" "}
              {sectorName} için önerilen: {staffOffRecommended ? "Kapalı" : "Açık"}.
            </>
          }
        >
          <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-2">
            <span id="staff-toggle-label" className="text-[15px] text-ink">
              Müşteriler personel seçebilsin
            </span>
            <Switch checked={enableStaffSelection} onChange={setEnableStaffSelection} aria-labelledby="staff-toggle-label" />
          </div>
        </SettingsGroup>

        <SettingsGroup title="Çalışma saatleri" footer="Müşterilere gösterilen uygun saatler bu aralıklara göre hesaplanır.">
          {workingHours.map((wh, idx) => {
            const day = DAYS[wh.dayOfWeek];
            return (
              <div key={wh.id || idx} className="px-4 py-2.5">
                <div className="flex min-h-8 items-center justify-between gap-4">
                  <span className={cn("text-[15px]", wh.isOpen ? "text-ink" : "text-ink-3")}>{day}</span>
                  <Switch checked={wh.isOpen} onChange={(open) => handleWorkingHourChange(idx, "isOpen", open)} aria-label={`${day} açık`} />
                </div>
                {wh.isOpen && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <HoursRange
                      label="Mesai"
                      day={day}
                      from={wh.openTime}
                      to={wh.closeTime}
                      onFrom={(v) => handleWorkingHourChange(idx, "openTime", v)}
                      onTo={(v) => handleWorkingHourChange(idx, "closeTime", v)}
                    />
                    <HoursRange
                      label="Mola"
                      day={day}
                      from={wh.breakStartTime || "13:00"}
                      to={wh.breakEndTime || "14:00"}
                      onFrom={(v) => handleWorkingHourChange(idx, "breakStartTime", v)}
                      onTo={(v) => handleWorkingHourChange(idx, "breakEndTime", v)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </SettingsGroup>

        <Button type="submit" variant="primary" disabled={saving} className="w-full">
          {saving ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
        </Button>
      </form>
    </div>
  );
}

function HoursRange({
  label,
  day,
  from,
  to,
  onFrom,
  onTo,
}: {
  label: string;
  day: string;
  from: string;
  to: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  const time = "h-8 rounded-[8px] border-0 bg-surface-muted px-1.5 text-sm text-ink tabular-nums outline-none";
  return (
    <div className="flex items-center justify-between gap-2 rounded-[12px] bg-surface-muted/50 px-3 py-1.5">
      <span className="text-[13px] text-ink-3">{label}</span>
      <span className="flex items-center gap-1.5">
        <input type="time" aria-label={`${day} ${label} başlangıcı`} value={from} onChange={(e) => onFrom(e.target.value)} className={time} />
        <span className="text-ink-3">–</span>
        <input type="time" aria-label={`${day} ${label} bitişi`} value={to} onChange={(e) => onTo(e.target.value)} className={time} />
      </span>
    </div>
  );
}

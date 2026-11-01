"use client";

import React, { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { BrandMark, DEFAULT_LOGO_STYLE } from "@/components/booking-page/BrandMark";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { PAGE_SECTIONS, pageSectionOrder } from "@/lib/themes/sections";
import type { LogoStyle, PageSectionKey, ThemeConfig, ThemeOverrides } from "@/lib/themes/types";

function SaveRow({ busy, saved, onSave, onReset }: { busy: boolean; saved: boolean; onSave: () => void; onReset?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="primary" onClick={onSave} disabled={busy}>
        {busy ? "Kaydediliyor..." : "Kaydet"}
      </Button>
      {onReset && (
        <Button size="sm" variant="ghost" onClick={onReset} disabled={busy}>
          Varsayılana dön
        </Button>
      )}
      {saved && <span role="status" className="text-sm text-brand-ink">Kaydedildi</span>}
    </div>
  );
}

function useSave(save: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const run = async () => {
    setBusy(true);
    setSaved(false);
    try {
      await save();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setBusy(false);
    }
  };
  return { busy, saved, run };
}

function Range({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm font-medium text-ink-2">
        {label}
        <span className="tabular-nums text-ink-3">{value} px</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-11 w-full accent-(--rg-brand)"
      />
    </label>
  );
}

/** How the logo shows on the booking page, with an optional line of text beside it. */
export function LogoStyleEditor({
  logo,
  businessName,
  theme,
  themeOverrides,
  onUpdateOverrides,
}: {
  logo?: string | null;
  businessName: string;
  theme: ThemeConfig;
  themeOverrides: ThemeOverrides | null;
  onUpdateOverrides: (next: ThemeOverrides) => Promise<void>;
}) {
  const [draft, setDraft] = useState<LogoStyle>({ ...DEFAULT_LOGO_STYLE, ...themeOverrides?.logoStyle });
  const set = (patch: Partial<LogoStyle>) => setDraft((d) => ({ ...d, ...patch }));
  const { busy, saved, run } = useSave(() => onUpdateOverrides({ ...(themeOverrides || {}), logoStyle: draft }));

  return (
    <div className="mt-5 grid gap-5 border-t border-line pt-5 lg:grid-cols-2">
      <div className="space-y-4">
        <Field label="Logonun şekli">
          <Segmented
            fill
            aria-label="Logonun şekli"
            value={draft.shape}
            onChange={(shape) => set({ shape })}
            options={[
              { value: "none", label: "Arka plansız" },
              { value: "circle", label: "Daire" },
              { value: "square", label: "Kare" },
            ]}
          />
        </Field>
        <Field label="Alana sığdırma">
          <Segmented
            fill
            aria-label="Alana sığdırma"
            value={draft.fit}
            onChange={(fit) => set({ fit })}
            options={[
              { value: "contain", label: "Tamamı görünsün" },
              { value: "cover", label: "Alanı doldursun" },
            ]}
          />
        </Field>
        <Range label="Logo genişliği" value={draft.width} min={32} max={320} onChange={(width) => set({ width })} />

        <Field label="Logonun yanındaki yazı" htmlFor="logo-text" hint="İsteğe bağlı. Boş bırakılırsa üst çubukta işletme adı görünür.">
          <Input id="logo-text" value={draft.text ?? ""} maxLength={40} onChange={(e) => set({ text: e.target.value })} />
        </Field>
        <div className="flex items-center justify-between gap-3">
          <span id="logo-hide-name" className="text-sm font-medium text-ink-2">Üst çubukta işletme adını gizle</span>
          <Switch checked={!!draft.hideName} aria-labelledby="logo-hide-name" onChange={(hideName) => set({ hideName })} />
        </div>

        {draft.text?.trim() && (
          <div className="space-y-4 rounded-control border border-line p-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Yazı rengi" htmlFor="logo-text-color">
                <Input
                  id="logo-text-color"
                  type="color"
                  value={draft.textColor || theme.colors.text}
                  onChange={(e) => set({ textColor: e.target.value })}
                  className="h-10 p-1"
                />
              </Field>
              <Field label="Font" htmlFor="logo-text-font">
                <Select
                  id="logo-text-font"
                  value={draft.textFont ?? "theme"}
                  onChange={(e) => set({ textFont: e.target.value as LogoStyle["textFont"] })}
                >
                  <option value="theme">Tema fontu</option>
                  <option value="manrope">Manrope</option>
                  <option value="geist">Geist</option>
                  <option value="playfair">Playfair Display</option>
                  <option value="cormorant">Cormorant</option>
                </Select>
              </Field>
            </div>
            <Range label="Logoya uzaklık" value={draft.textGap ?? 12} min={0} max={48} onChange={(textGap) => set({ textGap })} />
            <Range label="Yazı boyutu" value={draft.textSize ?? 24} min={14} max={64} onChange={(textSize) => set({ textSize })} />
            <div className="flex flex-wrap gap-4">
              {([["bold", "Kalın"], ["italic", "İtalik"], ["uppercase", "BÜYÜK HARF"]] as const).map(([key, label]) => (
                <label key={key} className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-2">
                  <input type="checkbox" checked={!!draft[key]} onChange={(e) => set({ [key]: e.target.checked })} className="h-4 w-4 accent-(--rg-brand)" />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}
        <SaveRow
          busy={busy}
          saved={saved}
          onSave={run}
          onReset={themeOverrides?.logoStyle ? () => void onUpdateOverrides({ ...(themeOverrides || {}), logoStyle: undefined }).then(() => setDraft(DEFAULT_LOGO_STYLE)) : undefined}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink-2">Önizleme ({theme.name})</p>
        <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-control border border-line p-5" style={{ background: theme.colors.background, color: theme.colors.text }}>
          <BrandMark logo={logo} name={businessName} style={draft} limit={160} />
        </div>
        {!logo && <p className="mt-2 text-sm text-ink-3">Önizlemede görmek için yukarıdan logonuzu yükleyin.</p>}
      </div>
    </div>
  );
}

/** Words on the booking page that otherwise come from the sector or the service list. */
export function PageTextsPanel({
  themeOverrides,
  sectorLine,
  onUpdateOverrides,
}: {
  themeOverrides: ThemeOverrides | null;
  sectorLine: string;
  onUpdateOverrides: (next: ThemeOverrides) => Promise<void>;
}) {
  const [categoryText, setCategoryText] = useState(themeOverrides?.categoryText ?? "");
  const [ribbonText, setRibbonText] = useState(themeOverrides?.ribbonText ?? "");
  const [showRibbon, setShowRibbon] = useState(themeOverrides?.showRibbon !== false);
  const [cta, setCta] = useState(themeOverrides?.customCtaText === "Hemen Randevu Al" ? "" : themeOverrides?.customCtaText ?? "");
  const { busy, saved, run } = useSave(() =>
    onUpdateOverrides({
      ...(themeOverrides || {}),
      categoryText: categoryText.trim() || undefined,
      ribbonText: ribbonText.trim() || undefined,
      showRibbon,
      customCtaText: cta.trim() || undefined,
    })
  );

  return (
    <Panel title="Sayfa yazıları" description="Temanın üzerindeki yazıları kendi işinize göre değiştirin. Boş bırakılan alan otomatik doldurulur.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Üstteki küçük yazı" htmlFor="page-category" hint={`Boşsa: ${sectorLine}`}>
          <Input id="page-category" value={categoryText} maxLength={80} placeholder="Örn: Oto Servis · Adana" onChange={(e) => setCategoryText(e.target.value)} />
        </Field>
        <Field label="Randevu butonu yazısı" htmlFor="page-cta" hint="Boşsa: Randevu al">
          <Input id="page-cta" value={cta} maxLength={24} placeholder="Örn: Hemen rezervasyon yap" onChange={(e) => setCta(e.target.value)} />
        </Field>
        <div className="lg:col-span-2">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span id="page-ribbon-switch" className="text-sm font-medium text-ink-2">Kayan yazı (Noir Usta ve Pist)</span>
            <Switch checked={showRibbon} aria-labelledby="page-ribbon-switch" onChange={setShowRibbon} />
          </div>
          <Textarea
            id="page-ribbon"
            aria-label="Kayan yazı"
            rows={4}
            value={ribbonText}
            disabled={!showRibbon}
            placeholder={"Her satıra bir yazı\nPeriyodik bakım\nDetaylı temizlik"}
            onChange={(e) => setRibbonText(e.target.value)}
          />
          <p className="mt-1 text-sm text-ink-3">Her satır ayrı bir yazıdır. Boşsa hizmet adlarınız kayar.</p>
        </div>
      </div>
      <div className="mt-4">
        <SaveRow busy={busy} saved={saved} onSave={run} />
      </div>
    </Panel>
  );
}

/** The real order of the booking page: moving a row here moves that section for visitors. */
export function SectionOrderPanel({
  sectionOrder,
  hiddenSections,
  themeOverrides,
  onUpdateSections,
  onUpdateOverrides,
}: {
  sectionOrder: string[];
  hiddenSections: string[];
  themeOverrides: ThemeOverrides | null;
  onUpdateSections: (order: string[], hidden: string[]) => Promise<void>;
  onUpdateOverrides: (next: ThemeOverrides) => Promise<void>;
}) {
  const order = pageSectionOrder(sectionOrder);
  const [titles, setTitles] = useState<Partial<Record<PageSectionKey, string>>>(themeOverrides?.sectionTitles ?? {});
  const { busy, saved, run } = useSave(() => onUpdateOverrides({ ...(themeOverrides || {}), sectionTitles: titles }));

  const move = (index: number, delta: number) => {
    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    void onUpdateSections(["Hero", ...next, "Booking"], hiddenSections);
  };
  const toggle = (id: PageSectionKey) =>
    void onUpdateSections(sectionOrder, hiddenSections.includes(id) ? hiddenSections.filter((h) => h !== id) : [...hiddenSections, id]);

  return (
    <Panel title="Sayfa bölümleri" description="Bölümlerin yerini değiştirin, gizleyin veya başlığını düzenleyin. Sıra hemen kaydedilir." flush>
      <ol className="divide-y divide-line">
        {order.map((id, i) => {
          const def = PAGE_SECTIONS.find((s) => s.id === id)!;
          const hidden = hiddenSections.includes(id);
          return (
            <li key={id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
              <span className="w-5 shrink-0 text-right text-sm tabular-nums text-ink-3">{i + 1}</span>
              <div className="min-w-48 flex-1">
                <p className={hidden ? "text-sm font-medium text-ink-3 line-through" : "text-sm font-medium text-ink"}>{def.name}</p>
                <Input
                  aria-label={`${def.name} başlığı`}
                  className="mt-1.5"
                  value={titles[id] ?? ""}
                  maxLength={40}
                  placeholder={`Başlık: ${def.defaultTitle}`}
                  onChange={(e) => setTitles((t) => ({ ...t, [id]: e.target.value }))}
                />
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button size="sm" variant="ghost" className="w-9 px-0" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`${def.name} yukarı taşı`} title="Yukarı taşı">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="w-9 px-0" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={`${def.name} aşağı taşı`} title="Aşağı taşı">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                {!def.required && (
                  <Button size="sm" className="ml-1 w-[4.5rem]" onClick={() => toggle(id)}>
                    {hidden ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
                    {hidden ? "Göster" : "Gizle"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="border-t border-line px-4 py-3 sm:px-5">
        <SaveRow busy={busy} saved={saved} onSave={run} />
      </div>
    </Panel>
  );
}

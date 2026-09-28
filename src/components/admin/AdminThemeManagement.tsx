"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Tag,
  Shield,
  Crown,
  FlaskConical,
  Edit2,
  Check,
} from "lucide-react";
import { THEME_REGISTRY } from "@/lib/themes/registry";

interface ThemeItem {
  id: string;
  name: string;
  description: string;
  supportedCategories: string; // JSON string
  isActive: boolean;
  isPremium: boolean;
  isBeta: boolean;
  orderIndex: number;
}

const ALL_SECTORS = [
  { id: "BERBER", label: "Berber" },
  { id: "GUZELLIK", label: "Güzellik" },
  { id: "RESTORAN", label: "Restoran" },
  { id: "KLINIK", label: "Klinik" },
  { id: "OTO_SERVIS", label: "Oto Servis" },
  { id: "DIGER", label: "Diğer" },
];

export function AdminThemeManagement({ initialThemes = [] }: { initialThemes?: ThemeItem[] }) {
  const [themes, setThemes] = useState<ThemeItem[]>(initialThemes);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingCategoriesThemeId, setEditingCategoriesThemeId] = useState<string | null>(null);

  // Fetch themes on mount if none provided
  useEffect(() => {
    if (themes.length === 0) {
      fetchThemes();
    }
  }, []);

  const fetchThemes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/themes");
      if (res.ok) {
        const data = await res.json();
        setThemes(data.themes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTheme = async (id: string, updates: Partial<ThemeItem>) => {
    setLoadingId(id);
    try {
      const res = await fetch("/api/admin/themes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        const data = await res.json();
        setThemes((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...data.theme } : t))
        );
        setMessage("Tema ayarı başarıyla kaydedildi.");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const parseCategories = (catStr: string): string[] => {
    try {
      return JSON.parse(catStr);
    } catch {
      return [];
    }
  };

  const handleToggleCategory = async (themeId: string, currentCategoriesJson: string, sector: string) => {
    const current = parseCategories(currentCategoriesJson);
    const next = current.includes(sector)
      ? current.filter((c) => c !== sector)
      : [...current, sector];

    await handleUpdateTheme(themeId, { supportedCategories: JSON.stringify(next) });
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <span>Hazır Tema Yönetimi & Dağıtımı</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Platformdaki tüm temaların aktif/pasif durumunu, sektör eşleşmelerini, Beta etiketini ve Pro/Ücretli mimarisini kontrol edin.
          </p>
        </div>

        <button
          onClick={fetchThemes}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors self-start sm:self-auto"
        >
          <span>{isLoading ? "Yenileniyor..." : "Temaları Yenile ↻"}</span>
        </button>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Themes Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3">Sıra</th>
              <th className="py-3 px-3">Tema Bilgisi</th>
              <th className="py-3 px-3">Görüneceği Sektörler</th>
              <th className="py-3 px-3 text-center">Beta Rozeti</th>
              <th className="py-3 px-3 text-center">Paket Durumu</th>
              <th className="py-3 px-3 text-center">Durum</th>
              <th className="py-3 px-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {themes.map((theme, idx) => {
              const categories = parseCategories(theme.supportedCategories);
              const isEditingCats = editingCategoriesThemeId === theme.id;
              const baseConfig = THEME_REGISTRY[theme.id];

              return (
                <tr key={theme.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Order Index */}
                  <td className="py-4 px-3 font-mono font-bold text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span>#{theme.orderIndex || idx + 1}</span>
                      <div className="flex flex-col">
                        <button
                          onClick={() =>
                            handleUpdateTheme(theme.id, {
                              orderIndex: Math.max(1, (theme.orderIndex || 1) - 1),
                            })
                          }
                          className="hover:text-indigo-400"
                          title="Önceliği Artır"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateTheme(theme.id, {
                              orderIndex: (theme.orderIndex || 1) + 1,
                            })
                          }
                          className="hover:text-indigo-400"
                          title="Önceliği Azalt"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Theme Info */}
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      {baseConfig && (
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shrink-0 shadow-sm"
                          style={{ backgroundColor: baseConfig.colors.primary }}
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">{theme.name}</span>
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                            {theme.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 max-w-xs truncate mt-0.5">
                          {theme.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Categories */}
                  <td className="py-4 px-3">
                    {isEditingCats ? (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {ALL_SECTORS.map((sec) => {
                          const isChecked = categories.includes(sec.id);
                          return (
                            <button
                              key={sec.id}
                              onClick={() =>
                                handleToggleCategory(theme.id, theme.supportedCategories, sec.id)
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                                isChecked
                                  ? "bg-indigo-600 text-white border-indigo-500"
                                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                              }`}
                            >
                              {sec.label}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setEditingCategoriesThemeId(null)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
                        >
                          Kapat ✓
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                        {categories.map((c) => (
                          <span
                            key={c}
                            className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60"
                          >
                            {c}
                          </span>
                        ))}
                        <button
                          onClick={() => setEditingCategoriesThemeId(theme.id)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-300"
                          title="Sektörleri Düzenle"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Beta Flag */}
                  <td className="py-4 px-3 text-center">
                    <button
                      onClick={() => handleUpdateTheme(theme.id, { isBeta: !theme.isBeta })}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                        theme.isBeta
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      <FlaskConical className="w-3 h-3" />
                      <span>{theme.isBeta ? "BETA" : "Normal"}</span>
                    </button>
                  </td>

                  {/* isPremium Flag (Monetization readiness) */}
                  <td className="py-4 px-3 text-center">
                    <button
                      onClick={() => handleUpdateTheme(theme.id, { isPremium: !theme.isPremium })}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                        theme.isPremium
                          ? "bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-sm"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      <Crown className="w-3 h-3" />
                      <span>{theme.isPremium ? "PRO / Ücretli" : "Ücretsiz"}</span>
                    </button>
                  </td>

                  {/* Active / Passive Switch */}
                  <td className="py-4 px-3 text-center">
                    <button
                      onClick={() => handleUpdateTheme(theme.id, { isActive: !theme.isActive })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                        theme.isActive
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {theme.isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Aktif</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Pasif</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-3 text-right">
                    <span className="text-[11px] text-slate-500">
                      {loadingId === theme.id ? "Kaydediliyor..." : "Hazır"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

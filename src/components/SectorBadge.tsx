"use client";

import React from "react";
import { Scissors, Sparkles, Utensils, Stethoscope, Car, Briefcase } from "lucide-react";

interface SectorBadgeProps {
  sector: string;
  size?: "sm" | "md";
}

export function SectorBadge({ sector, size = "md" }: SectorBadgeProps) {
  const getSectorConfig = (sec: string) => {
    switch (sec) {
      case "BERBER":
        return {
          label: "Erkek Kuaförü & Berber",
          icon: Scissors,
          colors: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };
      case "GUZELLIK":
        return {
          label: "Güzellik & Estetik",
          icon: Sparkles,
          colors: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
      case "RESTORAN":
        return {
          label: "Restoran & Kafe",
          icon: Utensils,
          colors: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "KLINIK":
        return {
          label: "Klinik & Sağlık",
          icon: Stethoscope,
          colors: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        };
      case "OTO_SERVIS":
        return {
          label: "Oto Servis & Bakım",
          icon: Car,
          colors: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };
      default:
        return {
          label: "Hizmet İşletmesi",
          icon: Briefcase,
          colors: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        };
    }
  };

  const config = getSectorConfig(sector);
  const Icon = config.icon;

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs gap-1.5" : "px-3 py-1 text-xs font-medium gap-2";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.colors} ${sizeClasses}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{config.label}</span>
    </span>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import { Users, Sparkles, Check, X, Camera, AlertCircle } from "lucide-react";
import { RestaurantTable } from "./types";

interface TableCardPreviewProps {
  table: RestaurantTable;
  onSelect?: (table: RestaurantTable) => void;
  isSelected?: boolean;
  mode?: "booking" | "admin";
  onEdit?: (table: RestaurantTable) => void;
  onDelete?: (table: RestaurantTable) => void;
}

export function TableCardPreview({
  table,
  onSelect,
  isSelected = false,
  mode = "booking",
  onEdit,
  onDelete,
}: TableCardPreviewProps) {
  const status = table.computedStatus || table.status || "AVAILABLE";

  const getStatusBadge = () => {
    switch (status) {
      case "AVAILABLE":
        return {
          label: "Müsait",
          bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          dot: "bg-emerald-400",
        };
      case "RESERVED":
        return {
          label: "Rezerve",
          bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          dot: "bg-amber-400",
        };
      case "OCCUPIED":
        return {
          label: "Dolu",
          bg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          dot: "bg-rose-400",
        };
      case "OUT_OF_SERVICE":
      default:
        return {
          label: "Kullanım Dışı",
          bg: "bg-slate-500/15 text-slate-400 border-slate-500/30",
          dot: "bg-slate-400",
        };
    }
  };

  const badge = getStatusBadge();
  const isSelectable = mode === "booking" ? table.isAvailable !== false && status === "AVAILABLE" : true;

  return (
    <div className="w-64 overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-xl text-slate-100 transition-all duration-200 animate-in fade-in zoom-in-95">
      {/* Optional Photo */}
      {table.imageUrl ? (
        <div className="relative h-32 w-full overflow-hidden bg-slate-800">
          <img
            src={table.imageUrl}
            alt={table.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          {table.area?.name && (
            <span className="absolute top-2.5 left-2.5 rounded-full bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/60">
              {table.area.name}
            </span>
          )}
          <span
            className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${badge.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3.5 pt-3 pb-1 border-b border-slate-800">
          {table.area?.name ? (
            <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/50">
              {table.area.name}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Restoran Masası</span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${badge.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
        </div>
      )}

      {/* Info Body */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-baseline justify-between">
          <h4 className="font-bold text-base text-white tracking-tight">{table.name}</h4>
          <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
            <Users className="w-3.5 h-3.5" />
            <span>{table.capacity} Kişilik</span>
          </div>
        </div>

        {table.description ? (
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
            {table.description}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">Özel açıklama eklenmedi</p>
        )}

        {/* Current appointment info if admin */}
        {mode === "admin" && table.currentAppointment && (
          <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-[11px] text-amber-200">
            <div className="font-semibold truncate">
              {table.currentAppointment.customerName || "Rezervasyon"}
            </div>
            <div className="text-[10px] text-amber-300/80">
              Saat: {table.currentAppointment.startTime} - {table.currentAppointment.endTime}
            </div>
          </div>
        )}

        {/* Action Button */}
        {mode === "booking" && onSelect && (
          <button
            type="button"
            disabled={!isSelectable}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(table);
            }}
            className={`w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all shadow-md ${
              isSelected
                ? "bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400"
                : isSelectable
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Seçildi</span>
              </>
            ) : isSelectable ? (
              <>
                <span>Masayı Seç</span>
              </>
            ) : status === "OUT_OF_SERVICE" ? (
              <span>Kullanım Dışı</span>
            ) : (
              <span>Bu Saatte Dolu</span>
            )}
          </button>
        )}

        {mode === "admin" && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 mt-2">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(table);
                }}
                className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors text-center"
              >
                Düzenle
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(table);
                }}
                className="rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
                title="Masayı Sil"
              >
                Sil
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

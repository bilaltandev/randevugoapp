"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  Check,
  Save,
  Plus,
  Circle,
  Square,
  RectangleHorizontal,
  Users,
  Camera,
  Layers,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  X,
  Trash2,
  Upload,
  Loader2,
} from "lucide-react";
import { RestaurantTable, RestaurantArea, TableShape, TableStatus } from "./types";
import { TableCardPreview } from "./TableCardPreview";

interface FloorPlanCanvasProps {
  tables: RestaurantTable[];
  areas: RestaurantArea[];
  activeAreaId: string; // "ALL" or area.id
  onTablesChange?: (tables: RestaurantTable[]) => void;
  onSavePositions?: (tables: RestaurantTable[]) => Promise<void>;
  onEditTable?: (table: RestaurantTable) => void;
  onDeleteTable?: (table: RestaurantTable) => void;
  onQuickAddTable?: (shape: TableShape, x: number, y: number) => void;
  // Booking mode props
  mode?: "admin" | "booking";
  selectedTableId?: string | null;
  onSelectTable?: (table: RestaurantTable) => void;
  readOnly?: boolean;
}

export function FloorPlanCanvas({
  tables,
  areas,
  activeAreaId,
  onTablesChange,
  onSavePositions,
  onEditTable,
  onDeleteTable,
  onQuickAddTable,
  mode = "admin",
  selectedTableId,
  onSelectTable,
  readOnly = false,
}: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Dragging state
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hovered table for preview card
  const [hoveredTable, setHoveredTable] = useState<RestaurantTable | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Inline table editor state (admin mode: edit table name, upload photo, change capacity directly on the canvas without leaving)
  const [inlineEditingTable, setInlineEditingTable] = useState<RestaurantTable | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [inlineSaveLoading, setInlineSaveLoading] = useState(false);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);

  // Filter tables by active area
  const visibleTables = tables.filter((t) => {
    if (activeAreaId === "ALL") return true;
    return t.areaId === activeAreaId;
  });

  const GRID_SIZE = 15;

  // Handle Drag Start for a table
  const handleMouseDownOnTable = (e: React.MouseEvent, table: RestaurantTable) => {
    if (readOnly || mode !== "admin") return;
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cursorX = (e.clientX - rect.left) / zoom;
    const cursorY = (e.clientY - rect.top) / zoom;

    setDraggingTableId(table.id);
    setDragOffset({
      x: cursorX - table.positionX,
      y: cursorY - table.positionY,
    });
  };

  // Handle Dragging Movement
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingTableId || !canvasRef.current || readOnly || mode !== "admin") return;

      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left) / zoom - dragOffset.x;
      const rawY = (e.clientY - rect.top) / zoom - dragOffset.y;

      let newX = Math.max(10, Math.min(rawX, 1400));
      let newY = Math.max(10, Math.min(rawY, 900));

      if (snapToGrid) {
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
      }

      const updated = tables.map((t) => {
        if (t.id === draggingTableId) {
          return { ...t, positionX: newX, positionY: newY };
        }
        return t;
      });

      if (onTablesChange) {
        onTablesChange(updated);
      }
      setHasUnsavedChanges(true);
    },
    [draggingTableId, dragOffset, zoom, snapToGrid, tables, onTablesChange, readOnly, mode]
  );

  // Handle Drag End
  const handleMouseUp = () => {
    if (draggingTableId) {
      setDraggingTableId(null);
    }
  };

  // Save positions
  const handleSave = async () => {
    if (!onSavePositions || isSaving) return;
    setIsSaving(true);
    try {
      await onSavePositions(tables);
      setHasUnsavedChanges(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Inline photo upload for currently edited table
  const handleInlinePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !inlineEditingTable) return;

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/restaurant/tables/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || "Görsel yüklenemedi.");
        return;
      }

      setInlineEditingTable((prev) => (prev ? { ...prev, imageUrl: data.url } : null));

      // Also update the table in local tables state immediately
      const updatedTables = tables.map((t) =>
        t.id === inlineEditingTable.id ? { ...t, imageUrl: data.url } : t
      );
      if (onTablesChange) onTablesChange(updatedTables);
    } catch (err) {
      console.error("Photo upload error:", err);
      alert("Görsel yüklenirken bir problem oluştu.");
    } finally {
      setIsUploadingPhoto(false);
      if (inlineFileInputRef.current) inlineFileInputRef.current.value = "";
    }
  };

  // Inline save for table properties
  const handleInlineSave = async () => {
    if (!inlineEditingTable) return;
    setInlineSaveLoading(true);
    try {
      const res = await fetch("/api/restaurant/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: inlineEditingTable.id,
          name: inlineEditingTable.name,
          capacity: inlineEditingTable.capacity,
          shape: inlineEditingTable.shape,
          imageUrl: inlineEditingTable.imageUrl,
          description: inlineEditingTable.description,
          areaId: inlineEditingTable.areaId,
          isActive: inlineEditingTable.isActive,
          status: inlineEditingTable.status,
        }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        alert(result.error || "Masa kaydedilemedi.");
        return;
      }

      const savedTable = result.table;
      const updatedTables = tables.map((t) => (t.id === savedTable.id ? savedTable : t));
      if (onTablesChange) onTablesChange(updatedTables);
      setInlineEditingTable(null);
    } catch (err) {
      console.error("Save table error:", err);
      alert("Masa kaydedilirken bir problem oluştu.");
    } finally {
      setInlineSaveLoading(false);
    }
  };

  // Inline delete table
  const handleInlineDelete = async (table: RestaurantTable) => {
    if (!confirm(`"${table.name}" masasını silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/restaurant/tables?id=${table.id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        alert(result.error || "Masa silinirken hata oluştu.");
        return;
      }
      const updatedTables = tables.filter((t) => t.id !== table.id);
      if (onTablesChange) onTablesChange(updatedTables);
      setInlineEditingTable(null);
      if (onDeleteTable) onDeleteTable(table);
    } catch (err) {
      console.error("Delete table error:", err);
      alert("Masa silinirken bir problem oluştu.");
    }
  };

  // Drag-and-drop palette drop handler (for dragging table template from palette to canvas)
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly || mode !== "admin" || !onQuickAddTable || !canvasRef.current) return;

    const shape = e.dataTransfer.getData("tableShape") as TableShape;
    if (!shape) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / zoom;
    let y = (e.clientY - rect.top) / zoom;

    if (snapToGrid) {
      x = Math.round(x / GRID_SIZE) * GRID_SIZE;
      y = Math.round(y / GRID_SIZE) * GRID_SIZE;
    }

    onQuickAddTable(shape, Math.max(20, x - 40), Math.max(20, y - 40));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Helper to render chairs around a table
  const renderChairs = (table: RestaurantTable) => {
    const chairs = [];
    const count = Math.min(table.capacity, 16);
    const w = table.width;
    const h = table.height;
    const chairSize = 14;

    if (table.shape === "ROUND") {
      const radius = w / 2 + 10;
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
        const cx = w / 2 + radius * Math.cos(angle) - chairSize / 2;
        const cy = h / 2 + radius * Math.sin(angle) - chairSize / 2;
        chairs.push(
          <div
            key={i}
            className="absolute rounded-full bg-slate-600/70 border border-slate-500/60 shadow-sm pointer-events-none transition-all"
            style={{
              width: chairSize,
              height: chairSize,
              left: cx,
              top: cy,
            }}
          />
        );
      }
    } else if (table.shape === "SQUARE") {
      // 4 sides
      const perSide = Math.ceil(count / 4);
      let placed = 0;
      // Top
      for (let i = 0; i < perSide && placed < count; i++, placed++) {
        chairs.push(
          <div
            key={`top-${i}`}
            className="absolute rounded-t-md bg-slate-600/70 border border-slate-500/60 shadow-sm pointer-events-none"
            style={{
              width: 16,
              height: 10,
              left: (w / (perSide + 1)) * (i + 1) - 8,
              top: -12,
            }}
          />
        );
      }
      // Bottom
      for (let i = 0; i < perSide && placed < count; i++, placed++) {
        chairs.push(
          <div
            key={`bot-${i}`}
            className="absolute rounded-b-md bg-slate-600/70 border border-slate-500/60 shadow-sm pointer-events-none"
            style={{
              width: 16,
              height: 10,
              left: (w / (perSide + 1)) * (i + 1) - 8,
              bottom: -12,
            }}
          />
        );
      }
      // Left
      for (let i = 0; i < perSide && placed < count; i++, placed++) {
        chairs.push(
          <div
            key={`left-${i}`}
            className="absolute rounded-l-md bg-slate-600/70 border border-slate-500/60 shadow-sm pointer-events-none"
            style={{
              width: 10,
              height: 16,
              left: -12,
              top: (h / (perSide + 1)) * (i + 1) - 8,
            }}
          />
        );
      }
      // Right
      for (let i = 0; i < perSide && placed < count; i++, placed++) {
        chairs.push(
          <div
            key={`right-${i}`}
            className="absolute rounded-r-md bg-slate-600/70 border border-slate-500/60 shadow-sm pointer-events-none"
            style={{
              width: 10,
              height: 16,
              right: -12,
              top: (h / (perSide + 1)) * (i + 1) - 8,
            }}
          />
        );
      }
    } else {
      // RECTANGLE
      const longSideCount = Math.max(1, Math.floor((count - 2) / 2));
      let placed = 0;
      // Top long side
      for (let i = 0; i < longSideCount && placed < count; i++, placed++) {
        chairs.push(
          <div
            key={`rtop-${i}`}
            className="absolute rounded-t-md bg-slate-600/70 border border-slate-500/60 shadow-sm pointer-events-none"
            style={{
              width: 16,
              height: 10,
              left: (w / (longSideCount + 1)) * (i + 1) - 8,
              top: -12,
            }}
          />
        );
      }
      // Bottom long side
      for (let i = 0; i < longSideCount && placed < count; i++, placed++) {
        chairs.push(
          <div
            key={`rbot-${i}`}
            className="absolute rounded-b-md bg-slate-600/70 border border-slate-500/60 shadow-sm pointer-events-none"
            style={{
              width: 16,
              height: 10,
              left: (w / (longSideCount + 1)) * (i + 1) - 8,
              bottom: -12,
            }}
          />
        );
      }
      // Left end
      if (placed < count) {
        chairs.push(
          <div
            key="rleft"
            className="absolute rounded-l-md bg-slate-600/70 border border-slate-500/60 shadow-sm pointer-events-none"
            style={{ width: 10, height: 16, left: -12, top: h / 2 - 8 }}
          />
        );
        placed++;
      }
      // Right end
      if (placed < count) {
        chairs.push(
          <div
            key="rright"
            className="absolute rounded-r-md bg-slate-600/70 border border-slate-500/60 shadow-sm pointer-events-none"
            style={{ width: 10, height: 16, right: -12, top: h / 2 - 8 }}
          />
        );
        placed++;
      }
    }

    return chairs;
  };

  const getStatusColor = (table: RestaurantTable) => {
    const s = table.computedStatus || table.status || "AVAILABLE";
    if (!table.isActive || s === "OUT_OF_SERVICE") {
      return {
        bg: "bg-slate-800/90",
        border: "border-slate-600/60",
        text: "text-slate-400",
        glow: "none",
        badge: "bg-slate-700/80 text-slate-300",
      };
    }
    if (s === "OCCUPIED") {
      return {
        bg: "bg-rose-950/70",
        border: "border-rose-500/80",
        text: "text-rose-200",
        glow: "0 0 15px rgba(244,63,94,0.3)",
        badge: "bg-rose-500/20 text-rose-300 border border-rose-500/40",
      };
    }
    if (s === "RESERVED") {
      return {
        bg: "bg-amber-950/70",
        border: "border-amber-500/80",
        text: "text-amber-200",
        glow: "0 0 15px rgba(245,158,11,0.3)",
        badge: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
      };
    }
    // AVAILABLE
    return {
      bg: "bg-emerald-950/60 hover:bg-emerald-900/60",
      border: "border-emerald-500/70 hover:border-emerald-400",
      text: "text-emerald-100",
      glow: "0 0 15px rgba(16,185,129,0.25)",
      badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
    };
  };

  return (
    <div className="flex flex-col rounded-3xl border border-slate-800 bg-[#0B0F19] overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:px-5 sm:py-3.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        {/* Left: Drag Palette for Admin Mode (Supports both drag and 1-tap add for touch devices) */}
        {mode === "admin" && !readOnly && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline shrink-0">
              Masa Ekle:
            </span>
            <div
              draggable
              onDragStart={(e) => e.dataTransfer.setData("tableShape", "ROUND")}
              onClick={() => onQuickAddTable && onQuickAddTable("ROUND", 150, 150)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold cursor-pointer sm:cursor-grab active:cursor-grabbing hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all shadow-sm shrink-0 select-none"
              title="Tıklayın veya tuvale sürükleyin"
            >
              <Circle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Yuvarlak</span>
            </div>
            <div
              draggable
              onDragStart={(e) => e.dataTransfer.setData("tableShape", "SQUARE")}
              onClick={() => onQuickAddTable && onQuickAddTable("SQUARE", 150, 150)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold cursor-pointer sm:cursor-grab active:cursor-grabbing hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all shadow-sm shrink-0 select-none"
              title="Tıklayın veya tuvale sürükleyin"
            >
              <Square className="w-3.5 h-3.5 text-indigo-400" />
              <span>Kare</span>
            </div>
            <div
              draggable
              onDragStart={(e) => e.dataTransfer.setData("tableShape", "RECTANGLE")}
              onClick={() => onQuickAddTable && onQuickAddTable("RECTANGLE", 150, 150)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold cursor-pointer sm:cursor-grab active:cursor-grabbing hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all shadow-sm shrink-0 select-none"
              title="Tıklayın veya tuvale sürükleyin"
            >
              <RectangleHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dikdörtgen</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] text-slate-400 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50" />
            <span>Müsait</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400/50" />
            <span>Rezerve</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block shadow-sm shadow-rose-400/50" />
            <span>Dolu</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
            <span>Pasif</span>
          </div>
        </div>

        {/* Right: Controls & Save Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <div className="flex items-center gap-1.5">
            {mode === "admin" && (
              <button
                type="button"
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`p-2 rounded-xl border text-xs transition-colors ${
                  snapToGrid
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                }`}
                title="Izgara Hizalama"
              >
                <Grid className="w-4 h-4" />
              </button>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800/80 p-0.5">
              <button
                type="button"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
                title="Uzaklaş"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[10px] font-mono text-slate-400 w-9 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
                title="Yakınlaş"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="p-1.5 text-slate-400 hover:text-white border-l border-slate-700 transition-colors"
                title="Sıfırla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Save Button for Admin */}
          {mode === "admin" && onSavePositions && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 ${
                justSaved
                  ? "bg-emerald-600 text-white"
                  : hasUnsavedChanges
                  ? "bg-gradient-to-r from-indigo-600 to-[#6246EA] text-white shadow-indigo-600/30 animate-pulse hover:from-indigo-500 hover:to-[#7257ff]"
                  : "bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed opacity-60"
              }`}
            >
              {justSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Kaydedildi</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Kaydediliyor..." : "Kaydet"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Floor Plan Canvas */}
      <div
        className={`relative w-full ${
          mode === "booking"
            ? "h-[440px] sm:h-[480px] overflow-auto"
            : "h-[580px] sm:h-[620px] overflow-auto"
        } select-none bg-[#090D17] cursor-default`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDragOver={handleDragOver}
        onDrop={handleCanvasDrop}
      >
        {/* Architectural Blueprint Grid Pattern */}
        <div
          ref={canvasRef}
          className={`relative ${
            mode === "booking"
              ? "min-w-[700px] min-h-[440px] sm:min-w-full sm:w-full sm:min-h-full"
              : "min-w-[1200px] min-h-[850px]"
          } transition-transform origin-top-left`}
          style={{
            transform: `scale(${zoom})`,
            backgroundImage: `
              radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: "30px 30px, 150px 150px, 150px 150px",
          }}
          onClick={() => {
            setHoveredTable(null);
          }}
        >
          {/* Architectural Layout Markers */}
          <div className="absolute top-6 left-8 flex items-center gap-2 rounded-xl bg-slate-800/40 border border-slate-700/40 px-3.5 py-1.5 text-[11px] font-bold tracking-widest text-slate-400 uppercase pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping inline-block" />
            <span>Ana Giriş / Entrance</span>
          </div>

          <div className="absolute bottom-8 right-12 rounded-xl bg-slate-800/30 border border-slate-700/30 px-4 py-2 text-[11px] font-bold tracking-widest text-slate-400 uppercase pointer-events-none">
            Servis & Bar Alanı
          </div>

          {/* Active Area Banner */}
          {activeAreaId !== "ALL" && (
            <div className="absolute top-6 right-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 pointer-events-none">
              Alan: {areas.find((a) => a.id === activeAreaId)?.name || "Seçili Alan"}
            </div>
          )}

          {/* Tables Rendering */}
          {visibleTables.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none">
              <Layers className="w-12 h-12 mb-3 text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">Bu alanda henüz masa bulunmuyor</p>
              {mode === "admin" && (
                <p className="text-xs text-slate-400 mt-1">
                  Yukarıdaki paletten masa sürükleyin veya "Yeni Masa Ekle" butonunu kullanın.
                </p>
              )}
            </div>
          ) : (
            visibleTables.map((table) => {
              const colors = getStatusColor(table);
              const isSelected = selectedTableId === table.id;
              const isDragging = draggingTableId === table.id;
              const shapeClass =
                table.shape === "ROUND"
                  ? "rounded-full"
                  : table.shape === "SQUARE"
                  ? "rounded-2xl"
                  : "rounded-2xl";

              return (
                <div
                  key={table.id}
                  onMouseDown={(e) => handleMouseDownOnTable(e, table)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mode === "booking" && onSelectTable) {
                      onSelectTable(table);
                    } else if (mode === "admin") {
                      // Direct inline editing right on table (no separate page)
                      setInlineEditingTable({ ...table });
                    }
                  }}
                  onMouseEnter={() => {
                    setHoveredTable(table);
                    setHoverPosition({
                      x: table.positionX + table.width / 2,
                      y: table.positionY - 10,
                    });
                  }}
                  onMouseLeave={() => {
                    if (!isDragging) {
                      setHoveredTable(null);
                    }
                  }}
                  className={`absolute flex flex-col items-center justify-center border-2 transition-shadow cursor-pointer ${shapeClass} ${colors.bg} ${colors.border}`}
                  style={{
                    left: `${table.positionX}px`,
                    top: `${table.positionY}px`,
                    width: `${table.width}px`,
                    height: `${table.height}px`,
                    boxShadow: isSelected
                      ? "0 0 0 3px #10B981, 0 0 25px rgba(16,185,129,0.6)"
                      : isDragging
                      ? "0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(99,102,241,0.5)"
                      : colors.glow,
                    zIndex: isDragging ? 50 : isSelected ? 40 : 10,
                    cursor: mode === "admin" ? (isDragging ? "grabbing" : "grab") : "pointer",
                  }}
                >
                  {/* Chairs around table */}
                  {renderChairs(table)}

                  {/* Table Label & Capacity */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center p-1 pointer-events-none">
                    <span className="text-xs font-bold text-white tracking-tight drop-shadow-md truncate max-w-[90%]">
                      {table.name}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-300">
                      <Users className="w-2.5 h-2.5" />
                      {table.capacity}
                    </span>
                  </div>

                  {/* Photo Indicator Icon */}
                  {table.imageUrl && (
                    <div
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-indigo-600 p-1 text-white shadow-md border border-indigo-400 pointer-events-none"
                      title="Fotoğraflı Masa"
                    >
                      <Camera className="w-2.5 h-2.5" />
                    </div>
                  )}

                  {/* Status Indicator Dot */}
                  <span
                    className={`absolute -bottom-1 -left-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                      colors.badge.includes("emerald")
                        ? "bg-emerald-400"
                        : colors.badge.includes("amber")
                        ? "bg-amber-400"
                        : colors.badge.includes("rose")
                        ? "bg-rose-500"
                        : "bg-slate-500"
                    }`}
                  />
                </div>
              );
            })
          )}

          {/* Hover Card Tooltip (Requirements: Name, Capacity, Description, Photo, Select Button) */}
          {hoveredTable && !draggingTableId && !inlineEditingTable && (
            <div
              className="absolute z-50 pointer-events-auto"
              style={{
                left: `${hoveredTable.positionX + hoveredTable.width / 2}px`,
                top: `${hoveredTable.positionY - 15}px`,
                transform: "translate(-50%, -100%)",
              }}
              onMouseEnter={() => setHoveredTable(hoveredTable)}
              onMouseLeave={() => setHoveredTable(null)}
            >
              <TableCardPreview
                table={hoveredTable}
                mode={mode}
                isSelected={selectedTableId === hoveredTable.id}
                onSelect={(tbl) => {
                  if (onSelectTable) onSelectTable(tbl);
                }}
                onEdit={(tbl) => {
                  setInlineEditingTable({ ...tbl });
                }}
                onDelete={(tbl) => {
                  handleInlineDelete(tbl);
                }}
              />
            </div>
          )}

          {/* Inline Quick Table Editor for Admin (No separate page) */}
          {inlineEditingTable && mode === "admin" && (
            <div
              className="absolute z-50 w-72 rounded-2xl border border-slate-700/90 bg-slate-900/98 p-4 shadow-2xl backdrop-blur-xl text-slate-100 animate-in fade-in zoom-in-95"
              style={{
                left: `${Math.min(Math.max(10, inlineEditingTable.positionX + inlineEditingTable.width + 15), 880)}px`,
                top: `${Math.max(10, inlineEditingTable.positionY - 20)}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-slate-200">Masa Hızlı Düzenle</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInlineEditingTable(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Table Name / Number direct input */}
              <div className="mt-3">
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                  Masa Numarası / Adı
                </label>
                <input
                  type="text"
                  value={inlineEditingTable.name}
                  onChange={(e) =>
                    setInlineEditingTable({ ...inlineEditingTable, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Örn: Masa 1"
                />
              </div>

              {/* Capacity Stepper */}
              <div className="mt-2.5 flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-400">
                  Kişi Kapasitesi
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setInlineEditingTable({
                        ...inlineEditingTable,
                        capacity: Math.max(1, inlineEditingTable.capacity - 1),
                      })
                    }
                    className="w-7 h-7 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-indigo-400 w-6 text-center">
                    {inlineEditingTable.capacity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setInlineEditingTable({
                        ...inlineEditingTable,
                        capacity: inlineEditingTable.capacity + 1,
                      })
                    }
                    className="w-7 h-7 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Direct Photo Upload */}
              <div className="mt-3">
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                  Masa Fotoğrafı
                </label>
                <div className="flex items-center gap-2.5">
                  {inlineEditingTable.imageUrl ? (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                      <img
                        src={inlineEditingTable.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setInlineEditingTable({ ...inlineEditingTable, imageUrl: null })
                        }
                        className="absolute top-0.5 right-0.5 bg-black/70 text-rose-400 rounded-full p-0.5"
                        title="Fotoğrafı Kaldır"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl border border-dashed border-slate-700 bg-slate-800/50 flex items-center justify-center text-slate-500 shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={inlineFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleInlinePhotoUpload}
                    />
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => inlineFileInputRef.current?.click()}
                      className="w-full py-1.5 px-2 rounded-xl border border-indigo-500/50 bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Yükleniyor...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5" />
                          <span>
                            {inlineEditingTable.imageUrl
                              ? "Fotoğrafı Değiştir"
                              : "Fotoğraf Yükle"}
                          </span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Müşteri fareyle üzerine gelince gösterilir.
                    </span>
                  </div>
                </div>
              </div>

              {/* Area Selector */}
              {areas.length > 0 && (
                <div className="mt-2.5">
                  <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                    Alan / Bölüm
                  </label>
                  <select
                    value={inlineEditingTable.areaId || ""}
                    onChange={(e) =>
                      setInlineEditingTable({
                        ...inlineEditingTable,
                        areaId: e.target.value || null,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Genel / Alansız</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div className="mt-2.5">
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                  Açıklama / Manzara
                </label>
                <input
                  type="text"
                  value={inlineEditingTable.description || ""}
                  onChange={(e) =>
                    setInlineEditingTable({
                      ...inlineEditingTable,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Örn: Deniz manzaralı, ön cephe"
                />
              </div>

              {/* Action Buttons: Save & Delete */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleInlineDelete(inlineEditingTable)}
                  className="px-2.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 text-xs hover:bg-rose-500/10 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sil</span>
                </button>

                <button
                  type="button"
                  disabled={inlineSaveLoading}
                  onClick={handleInlineSave}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1"
                >
                  {inlineSaveLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Kaydet</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            {mode === "admin"
              ? "Masaları tuval üzerinde serbestçe sürükleyip taşıyabilirsiniz. Değişiklik sonrası 'Konumları Kaydet'e basmayı unutmayın."
              : "Masaların üzerine gelerek fotoğraf ve detaylarını inceleyebilir, uygun masaya tıklayarak seçiminizi tamamlayabilirsiniz."}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
          <span>Toplam: {visibleTables.length} Masa</span>
          <span>
            Kapasite: {visibleTables.reduce((acc, t) => acc + (t.capacity || 0), 0)} Kişi
          </span>
        </div>
      </div>
    </div>
  );
}

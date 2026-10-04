"use client";

import React, { useState } from "react";
import {
  UtensilsCrossed,
  Plus,
  Layers,
  LayoutGrid,
  List,
  Users,
  CheckCircle2,
  Clock,
  Ban,
  Camera,
  Search,
  Filter,
  Trash2,
  Edit2,
  Sparkles,
} from "lucide-react";
import { RestaurantTable, RestaurantArea, TableShape, TableStatus } from "./types";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
import { TableModal } from "./TableModal";
import { AreaModal } from "./AreaModal";

interface TableManagementClientProps {
  business: any;
  initialAreas: RestaurantArea[];
  initialTables: RestaurantTable[];
}

export function TableManagementClient({
  business,
  initialAreas,
  initialTables,
}: TableManagementClientProps) {
  const [areas, setAreas] = useState<RestaurantArea[]>(initialAreas);
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables);
  const [activeAreaId, setActiveAreaId] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"canvas" | "list">("canvas");

  // Modals
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);

  // Search filter for list view
  const [searchQuery, setSearchQuery] = useState("");

  // Statistics calculation
  const totalTables = tables.length;
  const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 0), 0);
  const availableCount = tables.filter(
    (t) => t.isActive && (t.computedStatus === "AVAILABLE" || (!t.computedStatus && t.status === "AVAILABLE"))
  ).length;
  const reservedOccupiedCount = tables.filter(
    (t) => t.computedStatus === "RESERVED" || t.computedStatus === "OCCUPIED"
  ).length;
  const inactiveCount = tables.filter(
    (t) => !t.isActive || t.computedStatus === "OUT_OF_SERVICE" || t.status === "OUT_OF_SERVICE"
  ).length;

  // Filter tables for list view
  const filteredTables = tables.filter((t) => {
    const matchesArea = activeAreaId === "ALL" || t.areaId === activeAreaId;
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.area?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesArea && matchesSearch;
  });

  // Table CRUD
  const handleOpenAddTable = () => {
    setEditingTable(null);
    setIsTableModalOpen(true);
  };

  const handleEditTable = (table: RestaurantTable) => {
    setEditingTable(table);
    setIsTableModalOpen(true);
  };

  const handleQuickAddTable = (shape: TableShape, x: number, y: number) => {
    // Generate next table name
    const count = tables.length + 1;
    const newTableMock: RestaurantTable = {
      id: "",
      businessId: business.id,
      name: `Masa ${count}`,
      capacity: shape === "ROUND" ? 2 : shape === "SQUARE" ? 4 : 6,
      shape,
      positionX: x,
      positionY: y,
      width: shape === "ROUND" ? 85 : shape === "SQUARE" ? 90 : 140,
      height: 85,
      areaId: activeAreaId !== "ALL" ? activeAreaId : areas[0]?.id || null,
      isActive: true,
      status: "AVAILABLE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEditingTable(newTableMock);
    setIsTableModalOpen(true);
  };

  const handleSaveTable = async (data: Partial<RestaurantTable>) => {
    const isEditing = Boolean(data.id);
    const url = "/api/restaurant/tables";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok || result.error) {
      throw new Error(result.error || "Masa kaydedilemedi.");
    }

    const savedTable = result.table;
    if (isEditing) {
      setTables((prev) => prev.map((t) => (t.id === savedTable.id ? savedTable : t)));
    } else {
      setTables((prev) => [...prev, savedTable]);
    }
  };

  const handleDeleteTable = async (table: RestaurantTable) => {
    if (!confirm(`"${table.name}" masasını silmek istediğinize emin misiniz?`)) return;

    const res = await fetch(`/api/restaurant/tables?id=${table.id}`, {
      method: "DELETE",
    });

    const result = await res.json();
    if (!res.ok || result.error) {
      alert(result.error || "Masa silinirken hata oluştu.");
      return;
    }

    setTables((prev) => prev.filter((t) => t.id !== table.id));
  };

  const handleSavePositions = async (updatedTables: RestaurantTable[]) => {
    const positions = updatedTables.map((t) => ({
      id: t.id,
      positionX: t.positionX,
      positionY: t.positionY,
    }));

    const res = await fetch("/api/restaurant/tables/batch-positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positions }),
    });

    const result = await res.json();
    if (!res.ok || result.error) {
      throw new Error(result.error || "Konumlar kaydedilemedi.");
    }
  };

  // Quick status changer in list view
  const handleQuickStatusChange = async (table: RestaurantTable, newStatus: TableStatus) => {
    try {
      const res = await fetch("/api/restaurant/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: table.id, status: newStatus }),
      });
      const result = await res.json();
      if (res.ok && result.table) {
        setTables((prev) =>
          prev.map((t) => (t.id === table.id ? { ...t, status: newStatus, computedStatus: newStatus } : t))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Area CRUD
  const handleAddArea = async (name: string) => {
    const res = await fetch("/api/restaurant/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const result = await res.json();
    if (!res.ok || result.error) {
      throw new Error(result.error || "Alan eklenemedi.");
    }
    setAreas((prev) => [...prev, result.area]);
  };

  const handleUpdateArea = async (id: string, name: string) => {
    const res = await fetch("/api/restaurant/areas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name }),
    });
    const result = await res.json();
    if (!res.ok || result.error) {
      throw new Error(result.error || "Alan güncellenemedi.");
    }
    setAreas((prev) => prev.map((a) => (a.id === id ? result.area : a)));
  };

  const handleDeleteArea = async (id: string) => {
    const res = await fetch(`/api/restaurant/areas?id=${id}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (!res.ok || result.error) {
      throw new Error(result.error || "Alan silinemedi.");
    }
    setAreas((prev) => prev.filter((a) => a.id !== id));
    if (activeAreaId === id) setActiveAreaId("ALL");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-[#6246EA] text-white shadow-lg shadow-indigo-500/30">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Masa Planı</h1>
              <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
                Restoran Modülü
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              İşletmenizin masa yerleşimini görsel olarak tasarlayın, masalara özel fotoğraflar yükleyin ve rezervasyon müsaitliklerini anlık takip edin.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsAreaModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 px-3 sm:px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors shadow-sm"
          >
            <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">Alanları Yönet</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddTable}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-[#6246EA] hover:from-indigo-500 hover:to-[#7257ff] text-white px-3 sm:px-5 py-2.5 text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">Masa Ekle</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Toplam Masa</span>
            <UtensilsCrossed className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalTables}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {totalCapacity} kişi toplam kapasite
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-medium">Müsait Masalar</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-300">{availableCount}</div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Rezervasyona hazır</div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-xs font-medium">Rezerve / Dolu</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-300">{reservedOccupiedCount}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">Aktif rezervasyonlu</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Kullanım Dışı</span>
            <Ban className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-300">{inactiveCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Bakım veya pasif</div>
        </div>
      </div>

      {/* Area Filter Tabs & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Area Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveAreaId("ALL")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
              activeAreaId === "ALL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Tüm Masalar ({tables.length})
          </button>
          {areas.map((area) => {
            const count = tables.filter((t) => t.areaId === area.id).length;
            const isActive = activeAreaId === area.id;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setActiveAreaId(area.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>{area.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-slate-700 text-slate-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsAreaModalOpen(true)}
            className="rounded-xl border border-dashed border-slate-700 hover:border-indigo-500/70 text-slate-400 hover:text-indigo-300 px-3 py-1.5 text-xs font-medium transition-colors shrink-0"
          >
            + Yeni Alan
          </button>
        </div>

        {/* View Switcher: Floor Plan vs List View */}
        <div className="grid grid-cols-2 sm:flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("canvas")}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "canvas"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Görsel Plan</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "list"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Masa Listesi</span>
          </button>
        </div>
      </div>

      {/* Main View Mode Area */}
      {viewMode === "canvas" ? (
        <FloorPlanCanvas
          tables={tables}
          areas={areas}
          activeAreaId={activeAreaId}
          onTablesChange={setTables}
          onSavePositions={handleSavePositions}
          onEditTable={handleEditTable}
          onDeleteTable={handleDeleteTable}
          onQuickAddTable={handleQuickAddTable}
          mode="admin"
        />
      ) : (
        /* List View Mode */
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Masa adı, alan veya özellik ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTables.map((tbl) => {
              const status = tbl.computedStatus || tbl.status;
              return (
                <div
                  key={tbl.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  {/* Photo or Header */}
                  {tbl.imageUrl ? (
                    <div className="relative h-36 w-full overflow-hidden bg-slate-800">
                      <img
                        src={tbl.imageUrl}
                        alt={tbl.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                      {tbl.area?.name && (
                        <span className="absolute top-2.5 left-2.5 rounded-full bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-slate-300 border border-slate-700/60">
                          {tbl.area.name}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 pt-4 flex items-center justify-between">
                      {tbl.area?.name ? (
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300 border border-slate-700/60">
                          {tbl.area.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Genel Alan</span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">
                        {tbl.shape === "ROUND" ? "Yuvarlak" : tbl.shape === "SQUARE" ? "Kare" : "Dikdörtgen"}
                      </span>
                    </div>
                  )}

                  {/* Body */}
                  <div className="p-4 space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-white">{tbl.name}</h3>
                      <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                        <Users className="w-3.5 h-3.5" />
                        <span>{tbl.capacity} Kişilik</span>
                      </div>
                    </div>

                    {tbl.description && (
                      <p className="text-xs text-slate-300 line-clamp-2">{tbl.description}</p>
                    )}

                    {/* Quick status selector */}
                    <div className="pt-2">
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                        Hızlı Durum Değiştir:
                      </label>
                      <div className="grid grid-cols-4 gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(tbl, "AVAILABLE")}
                          className={`rounded-lg py-1 text-center font-semibold transition-colors ${
                            status === "AVAILABLE"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-emerald-400"
                          }`}
                        >
                          Müsait
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(tbl, "RESERVED")}
                          className={`rounded-lg py-1 text-center font-semibold transition-colors ${
                            status === "RESERVED"
                              ? "bg-amber-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-amber-400"
                          }`}
                        >
                          Rezerve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(tbl, "OCCUPIED")}
                          className={`rounded-lg py-1 text-center font-semibold transition-colors ${
                            status === "OCCUPIED"
                              ? "bg-rose-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-rose-400"
                          }`}
                        >
                          Dolu
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(tbl, "OUT_OF_SERVICE")}
                          className={`rounded-lg py-1 text-center font-semibold transition-colors ${
                            status === "OUT_OF_SERVICE"
                              ? "bg-slate-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Pasif
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Konum: X:{tbl.positionX}, Y:{tbl.positionY}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditTable(tbl)}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Düzenle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTable(tbl)}
                        className="rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-1.5 transition-colors"
                        title="Masayı Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table Create/Edit Modal */}
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onSave={handleSaveTable}
        table={editingTable}
        areas={areas}
        defaultAreaId={activeAreaId !== "ALL" ? activeAreaId : null}
      />

      {/* Area Manager Modal */}
      <AreaModal
        isOpen={isAreaModalOpen}
        onClose={() => setIsAreaModalOpen(false)}
        areas={areas}
        onAddArea={handleAddArea}
        onUpdateArea={handleUpdateArea}
        onDeleteArea={handleDeleteArea}
      />
    </div>
  );
}

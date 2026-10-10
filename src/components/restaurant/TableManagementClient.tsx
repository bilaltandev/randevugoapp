"use client";

import React, { useState } from "react";
import { UtensilsCrossed, Plus, Layers, LayoutGrid, List, Users, Search, Trash2, Edit2 } from "lucide-react";
import { RestaurantTable, RestaurantArea, TableShape, TableStatus } from "./types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { StatStrip } from "@/components/ui/StatStrip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Field";
import { choiceClasses } from "@/components/ui/choice";
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

  const STATUS_OPTIONS: { id: TableStatus; label: string; active: string }[] = [
    { id: "AVAILABLE", label: "Müsait", active: "border-brand bg-brand-soft text-brand-ink" },
    { id: "RESERVED", label: "Rezerve", active: "border-pending-line bg-pending-soft text-pending" },
    { id: "OCCUPIED", label: "Dolu", active: "border-danger-line bg-danger-soft text-danger" },
    { id: "OUT_OF_SERVICE", label: "Pasif", active: "border-line-strong bg-surface-muted text-ink" },
  ];

  const shapeLabel = (shape: TableShape) =>
    shape === "ROUND" ? "Yuvarlak" : shape === "SQUARE" ? "Kare" : "Dikdörtgen";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Masa Planı"
        description="Masa yerleşiminizi tasarlayın ve bugünkü rezervasyon durumlarını takip edin."
        actions={
          <>
            <Button onClick={() => setIsAreaModalOpen(true)}>
              <Layers className="w-4 h-4" aria-hidden="true" />
              Alanları yönet
            </Button>
            <Button variant="primary" onClick={handleOpenAddTable}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              Masa ekle
            </Button>
          </>
        }
      />

      <StatStrip
        stats={[
          { label: "Toplam masa", value: totalTables, hint: `${totalCapacity} kişilik kapasite` },
          { label: "Müsait", value: availableCount, hint: "Rezervasyona hazır" },
          {
            label: "Rezerve / dolu",
            value: reservedOccupiedCount,
            hint: "Bugün aktif rezervasyonlu",
            attention: reservedOccupiedCount > 0,
          },
          { label: "Kullanım dışı", value: inactiveCount, hint: "Bakımda veya pasif" },
        ]}
      />

      {/* Area filter & view switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 sm:pb-0">
          <button
            type="button"
            aria-pressed={activeAreaId === "ALL"}
            onClick={() => setActiveAreaId("ALL")}
            className={choiceClasses(activeAreaId === "ALL", "h-8 shrink-0 px-3 text-xs font-medium")}
          >
            Tüm masalar <span className="ml-1 tabular-nums text-ink-3">{tables.length}</span>
          </button>
          {areas.map((area) => {
            const count = tables.filter((t) => t.areaId === area.id).length;
            const isActive = activeAreaId === area.id;
            return (
              <button
                key={area.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveAreaId(area.id)}
                className={choiceClasses(isActive, "h-8 shrink-0 px-3 text-xs font-medium")}
              >
                {area.name} <span className="ml-1 tabular-nums text-ink-3">{count}</span>
              </button>
            );
          })}
          <Button size="sm" variant="ghost" className="shrink-0" onClick={() => setIsAreaModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Alan
          </Button>
        </div>

        <Segmented
          aria-label="Görünüm"
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: "canvas", label: "Görsel plan", icon: LayoutGrid },
            { value: "list", label: "Liste", icon: List },
          ]}
        />
      </div>

      {viewMode === "canvas" ? (
        // The floor plan is shared with the public booking flow and styled dark-first;
        // the legacy adapter in globals.css lightens it for the panel's light theme.
        <div className="dash-legacy-surface">
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
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <Input
              type="search"
              aria-label="Masa ara"
              placeholder="Masa adı, alan veya özellik ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredTables.length === 0 ? (
            <Panel>
              <EmptyState
                icon={UtensilsCrossed}
                title="Masa bulunamadı"
                description={searchQuery ? "Aramaya uygun masa yok." : "Bu alanda henüz masa yok."}
                actions={
                  <Button size="sm" variant="primary" onClick={handleOpenAddTable}>
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Masa ekle
                  </Button>
                }
              />
            </Panel>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTables.map((tbl) => {
                const status = tbl.computedStatus || tbl.status;
                return (
                  <section key={tbl.id} className="flex flex-col overflow-hidden rounded-panel border border-line bg-surface">
                    {tbl.imageUrl && (
                      <div className="h-32 w-full overflow-hidden bg-surface-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={tbl.imageUrl} alt={tbl.name} className="h-full w-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1 space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-ink">{tbl.name}</h3>
                          <p className="text-sm text-ink-3">
                            {[tbl.area?.name || "Genel alan", shapeLabel(tbl.shape)].join(" · ")}
                          </p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 text-sm text-ink-2 tabular-nums">
                          <Users className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
                          {tbl.capacity} kişi
                        </span>
                      </div>

                      {tbl.description && <p className="line-clamp-2 text-sm text-ink-2">{tbl.description}</p>}

                      <fieldset>
                        <legend className="mb-1.5 text-xs text-ink-3">Durum</legend>
                        <div className="grid grid-cols-4 gap-1">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              aria-pressed={status === opt.id}
                              onClick={() => handleQuickStatusChange(tbl, opt.id)}
                              className={cn(
                                "h-7 rounded-control border text-xs font-medium transition-colors",
                                status === opt.id
                                  ? opt.active
                                  : "border-line bg-surface text-ink-3 hover:bg-surface-muted hover:text-ink"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    </div>

                    <div className="flex items-center justify-between border-t border-line px-4 py-2">
                      <span className="text-xs text-ink-3 tabular-nums">
                        X {tbl.positionX} · Y {tbl.positionY}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEditTable(tbl)}>
                          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Düzenle
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-8 px-0 hover:text-danger"
                          onClick={() => handleDeleteTable(tbl)}
                          title="Masayı sil"
                          aria-label={`${tbl.name} masasını sil`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
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

"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Edit2, Check } from "lucide-react";
import { RestaurantArea } from "./types";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: RestaurantArea[];
  onAddArea: (name: string) => Promise<void>;
  onUpdateArea: (id: string, name: string) => Promise<void>;
  onDeleteArea: (id: string) => Promise<void>;
}

export function AreaModal({
  isOpen,
  onClose,
  areas,
  onAddArea,
  onUpdateArea,
  onDeleteArea,
}: AreaModalProps) {
  const [newAreaName, setNewAreaName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onAddArea(newAreaName.trim());
      setNewAreaName("");
    } catch (err: any) {
      setError(err.message || "Alan eklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (area: RestaurantArea) => {
    setEditingId(area.id);
    setEditName(area.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onUpdateArea(id, editName.trim());
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || "Güncellenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" alanını silmek istediğinize emin misiniz? Bu alandaki masalar silinmez, "Alansız" olarak listelenir.`)) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onDeleteArea(id);
    } catch (err: any) {
      setError(err.message || "Silinemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mekan alanları">
      <div className="space-y-4">
        <p className="text-sm text-ink-3">İç mekan, teras, bahçe gibi alanları yönetin.</p>

        {error && (
          <p role="alert" className="rounded-control border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            type="text"
            aria-label="Yeni alan adı"
            placeholder="Yeni alan (örn: Teras, Bahçe)"
            value={newAreaName}
            onChange={(e) => setNewAreaName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="primary" disabled={loading || !newAreaName.trim()}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Ekle
          </Button>
        </form>

        {areas.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-3">Henüz tanımlı alan yok.</p>
        ) : (
          <ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-control border border-line">
            {areas.map((area) => (
              <li key={area.id} className="flex items-center justify-between gap-2 px-3 py-2">
                {editingId === area.id ? (
                  <div className="flex flex-1 items-center gap-1.5">
                    <Input
                      type="text"
                      aria-label="Alan adı"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-8 px-0"
                      onClick={() => handleSaveEdit(area.id)}
                      aria-label="Kaydet"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="w-8 px-0" onClick={() => setEditingId(null)} aria-label="Vazgeç">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-ink">
                      {area.name}
                      {area._count?.tables !== undefined && (
                        <span className="ml-2 text-xs text-ink-3 tabular-nums">{area._count.tables} masa</span>
                      )}
                    </span>
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 px-0"
                        onClick={() => handleStartEdit(area)}
                        title="Düzenle"
                        aria-label={`${area.name} alanını düzenle`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 px-0 hover:text-danger"
                        onClick={() => handleDelete(area.id, area.name)}
                        title="Sil"
                        aria-label={`${area.name} alanını sil`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end border-t border-line pt-4">
          <Button onClick={onClose}>Tamam</Button>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Edit2, Check, Loader2, Layers } from "lucide-react";
import { RestaurantArea } from "./types";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mekan Alanları</h3>
              <p className="text-xs text-slate-400">İç mekan, teras, bahçe vb. alanları yönetin.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Add New Area Input */}
        <form onSubmit={handleAdd} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Yeni Alan Adı (Örn: Teras, Bahçe, Balkon)"
            value={newAreaName}
            onChange={(e) => setNewAreaName(e.target.value)}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !newAreaName.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3.5 py-2.5 text-xs font-bold transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Ekle</span>
          </button>
        </form>

        {/* Area List */}
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
          {areas.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              Henüz tanımlı alan bulunmuyor.
            </div>
          ) : (
            areas.map((area) => (
              <div
                key={area.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 px-3.5 py-2.5 text-xs transition-colors hover:border-slate-700"
              >
                {editingId === area.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-indigo-500 bg-slate-800 px-2 py-1 text-xs text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(area.id)}
                      className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{area.name}</span>
                      {area._count?.tables !== undefined && (
                        <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-400">
                          {area._count.tables} Masa
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(area)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(area.id, area.name)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors"
          >
            Tamamla
          </button>
        </div>
      </div>
    </div>
  );
}

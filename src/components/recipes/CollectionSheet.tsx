"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n-context";

interface Collection {
  id: string; name: string; emoji: string | null;
  _count: { recipes: number };
}

interface CollectionSheetProps {
  open: boolean; onClose: () => void; selected: string[];
  onSave: (collectionIds: string[]) => void;
}

export function CollectionSheet({ open, onClose, selected, onSave }: CollectionSheetProps) {
  const { t } = useI18n();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(selected);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const loadCollections = useCallback(async () => {
    const res = await fetch("/api/collections");
    if (res.ok) setCollections(await res.json());
  }, []);

  useEffect(() => {
    if (open) { loadCollections(); setSelectedIds(selected); setNewName(""); }
  }, [open, selected, loadCollections]);

  function toggle(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function createAndSelect() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/collections", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const created = await res.json();
      setSelectedIds((prev) => [...prev, created.id]);
      setCollections((prev) => [...prev, created]);
      setNewName("");
    }
    setCreating(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md md:max-w-lg rounded-t-2xl bg-white p-6 pb-8 shadow-xl dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{t("sheet.title")}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-5 w-5" /></button>
        </div>
        <div className="mb-4 space-y-1 max-h-60 overflow-y-auto">
          {collections.map((col) => (
            <button key={col.id} onClick={() => toggle(col.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selectedIds.includes(col.id) ? "border-orange-500 bg-orange-500 text-white" : "border-zinc-300 dark:border-zinc-600"}`}>
                {selectedIds.includes(col.id) && <Check className="h-3 w-3" />}
              </div>
              <span className="flex-1 text-sm">{col.emoji} {col.name}</span>
              <span className="text-xs text-zinc-400">{col._count.recipes}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder={t("sheet.new_list")} value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createAndSelect()} className="text-sm" />
          <Button size="sm" variant="outline" onClick={createAndSelect} disabled={!newName.trim() || creating}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => { onSave([]); onClose(); }}>{t("sheet.no_list")}</Button>
          <Button className="flex-1" onClick={() => { onSave(selectedIds); onClose(); }}>{t("sheet.save")}</Button>
        </div>
      </div>
    </div>
  );
}

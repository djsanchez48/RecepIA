"use client";

import { useState, useEffect } from "react";
import { Edit2, X } from "lucide-react";

interface CollectionItem {
  id: string; name: string; emoji: string | null;
  _count: { recipes: number };
}

const EMOJIS = ["⭐", "🍳", "🥗", "🍝", "🍰", "🥩", "🌮", "🍕", "🥑", "🍜", "🧁", "🍲", "🥞", "🍩", "🌯", "🥘"];

export function CollectionGrid({ activeId, onSelect }: {
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("⭐");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmoji, setEditEmoji] = useState("");

  useEffect(() => {
    fetch("/api/collections").then((r) => r.json()).then(setCollections);
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), emoji: newEmoji }),
    });
    if (res.ok) {
      const created = await res.json();
      setCollections((prev) => [...prev, created]);
      setCreating(false); setNewName(""); setNewEmoji("⭐");
      onSelect(created.id);
    }
  }

  async function updateEmoji(id: string, emoji: string) {
    await fetch(`/api/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    setCollections((prev) => prev.map((c) => c.id === id ? { ...c, emoji } : c));
    setEditingId(null);
  }

  function startEdit(col: CollectionItem) {
    setEditingId(col.id);
    setEditEmoji(col.emoji || "📁");
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => onSelect(null)}
          className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-4 py-3 transition-colors w-[90px] h-[96px] ${
            !activeId
              ? "border-orange-400 bg-orange-50 dark:border-orange-500 dark:bg-orange-900/20"
              : "border-zinc-200 bg-white hover:border-orange-200 dark:border-zinc-700 dark:bg-zinc-900"
          }`}
        >
          <span className="text-2xl">📋</span>
          <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 leading-tight text-center">Todas</span>
        </button>

        {collections.map((col) => (
          editingId === col.id ? (
            <div key={col.id} className="flex shrink-0 flex-col gap-2 rounded-2xl border-2 border-orange-300 bg-white p-2 dark:border-orange-600 dark:bg-zinc-900 w-[140px]">
              <div className="flex flex-wrap gap-0.5 justify-center">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => updateEmoji(col.id, e)}
                    className={`rounded text-lg leading-none p-0.5 ${editEmoji === e ? "bg-orange-100 ring-1 ring-orange-400" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
                    {e}
                  </button>
                ))}
              </div>
              <button onClick={() => setEditingId(null)} className="text-[10px] text-zinc-400 hover:text-zinc-600">
                Cancelar
              </button>
            </div>
          ) : (
            <div key={col.id} className="relative group">
              <button
                onClick={() => onSelect(col.id)}
                className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-4 py-3 transition-colors w-[90px] h-[96px] ${
                  activeId === col.id
                    ? "border-orange-400 bg-orange-50 dark:border-orange-500 dark:bg-orange-900/20"
                    : "border-zinc-200 bg-white hover:border-orange-200 dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              >
                <span className="text-2xl">{col.emoji || "📁"}</span>
                <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 leading-tight text-center line-clamp-2">{col.name}</span>
                <span className="text-[10px] text-zinc-400">{col._count.recipes}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); startEdit(col); }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-orange-500 hover:border-orange-300 dark:bg-zinc-800 dark:border-zinc-600"
              >
                <Edit2 className="h-2.5 w-2.5" />
              </button>
            </div>
          )
        ))}

        {creating ? (
          <div className="flex shrink-0 flex-col gap-2 rounded-2xl border-2 border-orange-300 bg-white p-3 dark:border-orange-600 dark:bg-zinc-900 w-[180px]">
            <p className="text-[10px] text-zinc-400">Elige un emoji:</p>
            <div className="flex flex-wrap gap-1">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => setNewEmoji(e)}
                  className={`rounded text-lg leading-none p-0.5 ${newEmoji === e ? "bg-orange-100 ring-1 ring-orange-400 dark:bg-orange-900/40" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
                  {e}
                </button>
              ))}
            </div>
            <input
              value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nombre de la lista..."
              className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
              autoFocus
            />
            <div className="flex gap-1">
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="flex-1 rounded bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50">Crear</button>
              <button onClick={() => { setCreating(false); setNewName(""); }}
                className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400">Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setCreating(true)}
            className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-zinc-300 px-4 py-3 text-zinc-400 hover:border-orange-300 hover:text-orange-500 dark:border-zinc-600 dark:hover:border-orange-600 w-[90px] h-[96px]">
            <span className="text-2xl">+</span>
            <span className="text-[10px] font-medium">Nueva</span>
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CollectionItem {
  id: string; name: string; emoji: string | null;
  _count: { recipes: number };
}

const EMOJIS = ["⭐", "🍳", "🥗", "🍝", "🍰", "🥩", "🌮", "🍕", "🥑", "🍜", "🫗", "🍲", "🥞", "🍩", "🌯", "🥘"];

export function CollectionManager() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("⭐");

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
      setNewName(""); setNewEmoji("⭐");
    }
  }

  async function saveEdit(id: string) {
    await fetch(`/api/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), emoji: editEmoji }),
    });
    setCollections((prev) => prev.map((c) => c.id === id ? { ...c, name: editName.trim(), emoji: editEmoji } : c));
    setEditingId(null);
  }

  async function deleteCollection(id: string) {
    if (!confirm("¿Eliminar esta lista? Las recetas no se borrarán.")) return;
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    setCollections((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {collections.map((col) => (
          <div key={col.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
            {editingId === col.id ? (
              <>
                <div className="flex flex-wrap gap-1">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => setEditEmoji(e)}
                      className={`rounded px-1 text-lg ${editEmoji === e ? "bg-orange-100 ring-1 ring-orange-400" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
                      {e}
                    </button>
                  ))}
                </div>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(col.id)}
                  className="h-8 text-sm" autoFocus />
                <button onClick={() => saveEdit(col.id)} className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"><Check className="h-4 w-4" /></button>
                <button onClick={() => setEditingId(null)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
              </>
            ) : (
              <>
                <span className="text-xl">{col.emoji || "📁"}</span>
                <span className="flex-1 text-sm font-medium">{col.name}</span>
                <span className="text-xs text-zinc-400">{col._count.recipes} recetas</span>
                <button onClick={() => { setEditingId(col.id); setEditName(col.name); setEditEmoji(col.emoji || "📁"); }}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => deleteCollection(col.id)}
                  className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 className="h-4 w-4" /></button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <p className="mb-2 text-xs text-zinc-400">Nueva lista</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setNewEmoji(e)}
              className={`rounded px-1 text-lg ${newEmoji === e ? "bg-orange-100 ring-1 ring-orange-400" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Nombre de la lista" value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()} className="text-sm" />
          <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

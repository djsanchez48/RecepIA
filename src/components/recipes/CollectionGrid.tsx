"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface CollectionItem {
  id: string; name: string; emoji: string | null;
  _count: { recipes: number };
}

export function CollectionDropdown({ activeId, onSelect }: {
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/collections").then((r) => r.json()).then(setCollections);
  }, []);

  const active = collections.find((c) => c.id === activeId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <span className="flex items-center gap-2 truncate">
          <span>{active?.emoji || "📋"}</span>
          <span className="font-medium">{active?.name || "Todas las recetas"}</span>
          {activeId && <span className="text-zinc-400">{active?._count.recipes}</span>}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            <button
              onClick={() => { onSelect(null); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <span>📋</span>
              <span className="font-medium">Todas las recetas</span>
              {!activeId && <Check className="ml-auto h-4 w-4 text-orange-500" />}
            </button>
            {collections.map((col) => (
              <button
                key={col.id}
                onClick={() => { onSelect(col.id); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                <span>{col.emoji || "📁"}</span>
                <span className="font-medium truncate">{col.name}</span>
                <span className="ml-auto text-xs text-zinc-400">{col._count.recipes}</span>
                {activeId === col.id && <Check className="ml-1 h-4 w-4 text-orange-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CollectionItem {
  id: string; name: string; emoji: string | null;
  _count: { recipes: number };
}

export function CollectionGrid({ activeId, onSelect, onNew }: {
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onNew: () => void;
}) {
  const [collections, setCollections] = useState<CollectionItem[]>([]);

  useEffect(() => {
    fetch("/api/collections").then((r) => r.json()).then(setCollections);
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl border-2 px-4 py-3 transition-colors min-w-[80px] ${
          !activeId
            ? "border-orange-400 bg-orange-50 dark:border-orange-500 dark:bg-orange-900/20"
            : "border-zinc-200 bg-white hover:border-orange-200 dark:border-zinc-700 dark:bg-zinc-900"
        }`}
      >
        <span className="text-2xl">📋</span>
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Todas</span>
      </button>

      {collections.map((col) => (
        <button
          key={col.id}
          onClick={() => onSelect(col.id)}
          className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl border-2 px-4 py-3 transition-colors min-w-[96px] ${
            activeId === col.id
              ? "border-orange-400 bg-orange-50 dark:border-orange-500 dark:bg-orange-900/20"
              : "border-zinc-200 bg-white hover:border-orange-200 dark:border-zinc-700 dark:bg-zinc-900"
          }`}
        >
          <span className="text-2xl">{col.emoji || "📁"}</span>
          <span className="text-xs font-medium leading-tight text-center text-zinc-700 dark:text-zinc-300">
            {col.name}
          </span>
          <span className="text-[10px] text-zinc-400">{col._count.recipes}</span>
        </button>
      ))}

      <button
        onClick={onNew}
        className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-zinc-300 px-4 py-3 text-zinc-400 hover:border-orange-300 hover:text-orange-500 dark:border-zinc-600 dark:hover:border-orange-600 min-w-[80px]"
      >
        <span className="text-2xl">+</span>
        <span className="text-[10px] font-medium">Nueva</span>
      </button>
    </div>
  );
}

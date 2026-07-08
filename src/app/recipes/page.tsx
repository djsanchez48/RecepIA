"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Sparkles, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RecipeListItem } from "@/components/recipes/RecipeListItem";
import { CollectionSheet } from "@/components/recipes/CollectionSheet";
import { CollectionDropdown } from "@/components/recipes/CollectionGrid";
import { CollectionManager } from "@/components/recipes/CollectionManager";
import { useI18n } from "@/lib/i18n-context";
import Link from "next/link";

interface Collection { id: string; name: string; emoji: string | null; _count: { recipes: number }; }
interface RecipeItem {
  id: string; title: string; description: string | null;
  prepTimeMinutes: number | null; cookTimeMinutes: number | null;
  tags: string[];
  collections: { collection: { id: string; name: string; emoji: string | null } }[];
}

export default function RecipesPage() {
  const { t } = useI18n();
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [bookmarkRecipe, setBookmarkRecipe] = useState<{ id: string; collectionIds: string[] } | null>(null);
  const [showManager, setShowManager] = useState(false);

  const TIME_FILTERS = [
    { label: t("recipes.time_15"), value: "15" },
    { label: t("recipes.time_30"), value: "30" },
    { label: t("recipes.time_60"), value: "60" },
  ];

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (timeFilter) params.set("maxTime", timeFilter);
    if (activeCollection) params.set("collection", activeCollection);
    const res = await fetch(`/api/recipes?${params.toString()}`);
    if (res.ok) setRecipes(await res.json());
    setLoading(false);
  }, [search, timeFilter, activeCollection]);

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  async function handleBookmarkSave(collectionIds: string[]) {
    if (!bookmarkRecipe) return;
    await fetch(`/api/recipes/${bookmarkRecipe.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionIds }),
    });
    setBookmarkOpen(false);
    loadRecipes();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 pb-24">
      <h1 className="mb-4 text-xl font-bold">{t("recipes.title")}</h1>
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input placeholder={t("recipes.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <CollectionDropdown activeId={activeCollection} onSelect={setActiveCollection} />
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowManager(!showManager)} className="shrink-0">
            <Settings className={`h-4 w-4 ${showManager ? "text-orange-500" : ""}`} />
          </Button>
        </div>

        {showManager && (
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Gestionar listas</h3>
            <CollectionManager />
          </div>
        )}

        <div className="flex gap-2">
          {TIME_FILTERS.map((tf) => (
            <button key={tf.value} onClick={() => setTimeFilter(timeFilter === tf.value ? null : tf.value)} className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${timeFilter === tf.value ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"}`}>{tf.label}</button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />)}</div>
      ) : recipes.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-2 text-zinc-500 dark:text-zinc-400">{search || activeCollection || timeFilter ? t("recipes.empty_with_filters") : t("recipes.empty_no_filters")}</p>
          {!search && !activeCollection && !timeFilter && (
            <Button variant="outline" size="sm" asChild><Link href="/"><Sparkles className="h-4 w-4" />{t("recipes.create_first")}</Link></Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="relative group">
              <RecipeListItem recipe={recipe} />
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBookmarkRecipe({ id: recipe.id, collectionIds: recipe.collections.map((rc) => rc.collection.id) }); setBookmarkOpen(true); }}
                className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-orange-100 hover:text-orange-500 transition-all dark:hover:bg-orange-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {bookmarkRecipe && <CollectionSheet open={bookmarkOpen} onClose={() => setBookmarkOpen(false)} selected={bookmarkRecipe.collectionIds} onSave={handleBookmarkSave} />}
    </div>
  );
}

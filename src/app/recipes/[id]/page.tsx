"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Clock, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollectionSheet } from "@/components/recipes/CollectionSheet";

interface IngredientDetail {
  ingredientId: string;
  quantity: number | null;
  unit: string | null;
  quantityText: string | null;
  note: string | null;
  ingredient: { id: string; name: string };
}

interface RecipeDetail {
  id: string;
  title: string;
  description: string | null;
  steps: string[];
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  tags: string[];
  ingredients: IngredientDetail[];
  collections: { collection: { id: string; name: string; emoji: string | null } }[];
}

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(2);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/recipes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setRecipe(data);
        setServings(data.servings ?? 2);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {}
    }
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  const factor = recipe?.servings ? servings / recipe.servings : 1;

  function formatQuantity(ing: IngredientDetail): string {
    if (ing.quantityText) return ing.quantityText;
    if (ing.quantity == null) return "";
    const scaled = ing.quantity * factor;
    const formatted = Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1);
    return `${formatted}${ing.unit ? ` ${ing.unit}` : ""}`;
  }

  function toggleCheck(ingredientId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
  }

  const handleSaveCollections = useCallback(
    async (collectionIds: string[]) => {
      if (!recipe) return;
      await fetch(`/api/recipes/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionIds }),
      });
      const res = await fetch(`/api/recipes/${recipe.id}`);
      if (res.ok) setRecipe(await res.json());
    },
    [recipe],
  );

  async function handleDelete() {
    if (!recipe) return;
    setDeleting(true);
    await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    router.push("/recipes");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-6 pb-24">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800 mb-2" />
        <div className="h-4 w-64 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="mx-auto max-w-md px-4 py-6 pb-24 text-center">
        <p className="text-zinc-500">Receta no encontrada</p>
      </div>
    );
  }

  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold leading-tight">{recipe.title}</h1>
      {recipe.description && (
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">{recipe.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {recipe.tags?.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          >
            {tag}
          </span>
        ))}
        {totalTime > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
            <Clock className="h-3 w-3" /> {totalTime} min
          </span>
        )}
        {recipe.collections.map((rc) => (
          <span
            key={rc.collection.id}
            className="text-xs text-zinc-400 dark:text-zinc-500"
          >
            {rc.collection.emoji} {rc.collection.name}
          </span>
        ))}
      </div>

      {recipe.servings && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setServings((s) => Math.max(1, s - 1))}
            disabled={servings <= 1}
            className="rounded-full border border-zinc-300 p-2 disabled:opacity-30 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-lg font-semibold tabular-nums">
            {servings} {servings === 1 ? "porción" : "porciones"}
          </span>
          <button
            onClick={() => setServings((s) => s + 1)}
            className="rounded-full border border-zinc-300 p-2 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Ingredientes</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing) => {
            const quantity = formatQuantity(ing);
            const isChecked = checked.has(ing.ingredientId);
            return (
              <li key={ing.ingredientId} className="flex items-start gap-3">
                <button
                  onClick={() => toggleCheck(ing.ingredientId)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    isChecked
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {isChecked && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="h-3 w-3"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
                <span className={`text-sm ${isChecked ? "line-through text-zinc-300 dark:text-zinc-600" : "text-zinc-700 dark:text-zinc-300"}`}>
                  {quantity && <span className="font-medium">{quantity} </span>}
                  {quantity ? `de ` : ""}
                  {ing.ingredient.name}
                  {ing.note && (
                    <span className="text-zinc-400 dark:text-zinc-500"> ({ing.note})</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Preparación</h2>
        <ol className="space-y-4">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-400">
                {i + 1}
              </span>
              <span className="pt-0.5 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex gap-3">
        <Button
          onClick={() => setSheetOpen(true)}
          className="flex-1"
        >
          Guardar en...
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (confirm("¿Eliminar esta receta?")) handleDelete();
          }}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {recipe && (
        <CollectionSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          selected={recipe.collections.map((rc) => rc.collection.id)}
          onSave={handleSaveCollections}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";
import { computeMatch, matchLabel } from "@/lib/nutrition/match";
import type { Goal } from "@/lib/nutrition/targets";
import type { GeneratedRecipe } from "@/types/schemas";

interface RecipeCardProps {
  recipe: GeneratedRecipe;
  onSave?: () => void;
  saving?: boolean;
  goals?: Goal[];
}

export function RecipeCard({ recipe, onSave, saving, goals }: RecipeCardProps) {
  const { t } = useI18n();
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const [showNutrition, setShowNutrition] = useState(false);

  const nutrition = (recipe as Record<string, unknown>).nutrition as { caloriesPerServing?: number; proteinG?: number; carbsG?: number; fatG?: number } | undefined;
  const nutriBadges = (recipe as Record<string, unknown>).nutriBadges as string[] | undefined;

  const match = goals && goals.length > 0 && nutrition
    ? computeMatch(
        { caloriesPerServing: nutrition.caloriesPerServing, proteinG: nutrition.proteinG, carbsG: nutrition.carbsG, fatG: nutrition.fatG, nutriBadges },
        goals,
        recipe.ingredients,
      )
    : null;
  const ml = match ? matchLabel(match) : null;

  return (
    <Card className="overflow-hidden border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-3">
        {ml && (
          <span className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ml.className}`}>
            {ml.emoji} {ml.label}
          </span>
        )}
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-bold leading-tight">{recipe.title}</h2>
          {recipe.servings && (
            <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300">
              {recipe.servings} {recipe.servings === 1 ? t("card.portion") : t("card.portions")}
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{recipe.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {totalTime > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
              <Clock className="h-3 w-3" /> {totalTime} {t("card.minutes")}
            </span>
          )}
          {nutriBadges?.map((badge) => (
            <span key={badge} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {badge.replace(/_/g, " ")}
            </span>
          ))}
          {recipe.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">{tag}</span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="mb-2 text-sm font-semibold">{t("card.ingredients")}</h3>
          <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-baseline gap-1">
                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                <span>
                  {ing.quantity != null && ing.unit ? `${ing.quantity} ${ing.unit} de ` : ing.quantity != null ? `${ing.quantity} ` : ing.quantityText ? `${ing.quantityText} de ` : ""}
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{ing.name}</span>
                  {ing.note && <span className="text-zinc-400 dark:text-zinc-500"> ({ing.note})</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">{t("card.preparation")}</h3>
          <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-bold text-orange-500">{i + 1}.</span><span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {nutrition && (
          <div>
            <button onClick={() => setShowNutrition(!showNutrition)} className="flex w-full items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800">
              {t("nutrition.view")}
              {showNutrition ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showNutrition && (
              <div className="mt-2 space-y-1 rounded-lg bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-800/50">
                <div className="flex justify-between"><span>🔥 {t("nutrition.calories")}</span><span className="font-medium">{nutrition.caloriesPerServing} kcal</span></div>
                <div className="flex justify-between"><span>🍗 {t("nutrition.protein")}</span><span className="font-medium">{nutrition.proteinG}g</span></div>
                <div className="flex justify-between"><span>🍞 {t("nutrition.carbs")}</span><span className="font-medium">{nutrition.carbsG}g</span></div>
                <div className="flex justify-between"><span>🧈 {t("nutrition.fat")}</span><span className="font-medium">{nutrition.fatG}g</span></div>
                <p className="mt-2 text-zinc-400">{t("nutrition.disclaimer")}</p>
              </div>
            )}
          </div>
        )}

        {onSave && (
          <Button onClick={onSave} disabled={saving} className="w-full" variant="default">
            {saving ? t("card.saving") : t("card.save")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

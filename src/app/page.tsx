"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Loader2, SendHorizontal, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { CollectionSheet } from "@/components/recipes/CollectionSheet";
import { DraftCard } from "@/components/recipes/DraftCard";
import { useI18n } from "@/lib/i18n-context";
import type { GeneratedRecipe, ParsedRecipeResult } from "@/types/schemas";

interface DraftItem {
  id: string; prompt: string; recipeJson: GeneratedRecipe; createdAt: string;
}

interface Message { role: "user" | "assistant"; content: string; }

type Mode = "generate" | "import";

export default function Home() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("generate");

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [adjustment, setAdjustment] = useState("");
  const [error, setError] = useState("");

  const [importText, setImportText] = useState("");
  const [parseResult, setParseResult] = useState<ParsedRecipeResult | null>(null);
  const [source, setSource] = useState<"ai" | "imported">("ai");

  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const quickPrompts = [
    t("create.chip_quick_chicken"), t("create.chip_pasta"), t("create.chip_salad"),
    t("create.chip_breakfast"), t("create.chip_soup"), t("create.chip_dessert"),
  ];

  const loadDrafts = useCallback(async () => {
    const res = await fetch("/api/drafts");
    if (res.ok) setDrafts(await res.json());
  }, []);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const content = prompt.trim();
    if (!content && !adjustment.trim()) return;
    setError(""); setLoading(true);

    const newMessages: Message[] = adjustment.trim()
      ? [...messages, { role: "user", content: adjustment.trim() }]
      : [...messages, { role: "user", content }];

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("create.error"));
      setRecipe(data); setDraftId(data.draftId); setSource("ai");
      setMessages(newMessages); setAdjustment(""); setPrompt(""); setSaved(false);
      loadDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("create.error"));
    } finally { setLoading(false); }
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustment.trim()) return;
    await handleGenerate();
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!importText.trim()) return;
    setError(""); setParseResult(null); setLoading(true); setRecipe(null);

    try {
      const res = await fetch("/api/ai/parse-recipe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: importText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al importar");

      setParseResult(data);
      if (data.isRecipe && data.recipe) {
        setRecipe(data.recipe as GeneratedRecipe);
        setSource("imported");
        setDraftId(null);
        setSaved(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
    } finally { setLoading(false); }
  }

  async function handleSave(collectionIds: string[]) {
    if (!recipe) return;
    setSaving(true);
    const ingredients = recipe.ingredients.map((ing) => ({
      name: ing.name, quantity: ing.quantity ?? null, unit: ing.unit ?? null,
      quantityText: ing.quantityText ?? null, note: ing.note ?? null,
    }));
    const body: Record<string, unknown> = {
      title: recipe.title, description: recipe.description, steps: recipe.steps,
      prepTimeMinutes: recipe.prepTimeMinutes, cookTimeMinutes: recipe.cookTimeMinutes,
      servings: recipe.servings, tags: recipe.tags, ingredients, source, collectionIds,
    };
    if (draftId) body.draftId = draftId;
    const res = await fetch("/api/recipes", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (res.ok) { setSaved(true); setDraftId(null); loadDrafts(); }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 pb-24">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">{t("create.title")}</h1>
      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">{t("create.subtitle")}</p>

      <div className="mb-4 flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          onClick={() => setMode("generate")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "generate" ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100" : "text-zinc-500"
          }`}
        >
          <Sparkles className="mr-1 inline h-3.5 w-3.5" />
          {t("import.tab_generate")}
        </button>
        <button
          onClick={() => setMode("import")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "import" ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100" : "text-zinc-500"
          }`}
        >
          <FileText className="mr-1 inline h-3.5 w-3.5" />
          {t("import.tab_import")}
        </button>
      </div>

      {mode === "generate" ? (
        <>
          <form onSubmit={handleGenerate} className="space-y-3 mb-6">
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleGenerate(); } }}
              placeholder={t("create.placeholder")}
              className="w-full min-h-24 rounded-xl border border-zinc-200 bg-white p-4 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder:text-zinc-600" />
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((q) => (
                <button key={q} type="button" onClick={() => setPrompt(q)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:border-orange-300 hover:text-orange-600 dark:border-zinc-700 dark:text-zinc-400">{q}</button>
              ))}
            </div>
            <Button type="submit" disabled={loading || !prompt.trim()} className="w-full h-11">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{t("create.generating")}</> : <><Sparkles className="h-4 w-4" />{t("create.generate")}</>}
            </Button>
          </form>
        </>
      ) : (
        <form onSubmit={handleImport} className="space-y-3 mb-6">
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleImport(e); } }}
            placeholder={t("import.placeholder")}
            className="w-full min-h-36 rounded-xl border border-zinc-200 bg-white p-4 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder:text-zinc-600" />
          <Button type="submit" disabled={loading || !importText.trim()} className="w-full h-11">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{t("import.parsing")}</> : <><FileText className="h-4 w-4" />{t("import.parse")}</>}
          </Button>
        </form>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</div>
      )}

      {parseResult && !parseResult.isRecipe && !error && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t("import.not_recipe")}</p>
          {parseResult.warnings.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-400">
              {parseResult.warnings.map((w, i) => <li key={i}>• {w}</li>)}
            </ul>
          )}
          <Button variant="outline" size="sm" className="mt-3" onClick={() => { setParseResult(null); setRecipe(null); }}>
            Intentar de nuevo
          </Button>
        </div>
      )}

      {recipe && (
        <div className="mb-6 space-y-4">
          {parseResult?.warnings && parseResult.warnings.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <ul className="space-y-0.5">
                {parseResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {parseResult?.confidence === "low" && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {t("import.confidence_low")}
            </div>
          )}

          {source === "imported" && (
            <span className="inline-block rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              {t("import.badge")}
            </span>
          )}

          <RecipeCard recipe={recipe} onSave={() => setSheetOpen(true)} saving={saving} />

          {saved && <p className="text-center text-sm text-green-600 dark:text-green-400">{t("create.saved")}</p>}

          {mode === "generate" && !saved && (
            <form onSubmit={handleAdjust} className="flex gap-2">
              <input type="text" value={adjustment} onChange={(e) => setAdjustment(e.target.value)}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleAdjust(e); } }}
                placeholder={t("create.adjust_placeholder")}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder:text-zinc-600" />
              <Button type="submit" size="sm" disabled={loading || !adjustment.trim()} className="shrink-0">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </div>
      )}

      {drafts.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("create.recent")}</h2>
          <div className="space-y-2">
            {drafts.map((draft) => (
              <DraftCard key={draft.id} draft={draft}
                onView={(r) => { setRecipe(r); setDraftId(null); setMessages([]); setSaved(true); setError(""); setParseResult(null); }}
                onSave={(r) => { setRecipe(r); setSource("ai"); setSheetOpen(true); }}
                onDelete={(id) => setDrafts((p) => p.filter((d) => d.id !== id))} />
            ))}
          </div>
        </section>
      )}

      <CollectionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} selected={[]} onSave={handleSave} />
    </div>
  );
}

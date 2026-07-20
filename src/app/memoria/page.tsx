"use client";

import { useState, useEffect } from "react";
import { Brain, Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n-context";

interface MemoryItem {
  score: number;
  count: number;
}

interface MemoryProfile {
  ingredients: Record<string, MemoryItem>;
  tags: Record<string, MemoryItem>;
  badges: Record<string, MemoryItem>;
  updatedAt?: string;
}

interface RecentEvent {
  id: string;
  type: string;
  entity: string;
  value: string;
  weight: number;
  createdAt: string;
}

const EVENT_LABELS: Record<string, string> = {
  recipe_saved: "Guardada",
  recipe_collected: "Añadida a lista",
  recipe_cooked: "Cocinada",
  recipe_deleted: "Borrada",
  draft_discarded: "Borrador descartado",
};

function scoreColor(score: number): string {
  if (score >= 6) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (score > 0) return "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400";
  if (score >= -3) return "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

function scoreEmoji(score: number): string {
  if (score >= 6) return "🟢";
  if (score > 0) return "🟢";
  if (score >= -3) return "🟡";
  return "🔴";
}

export default function MemoriaPage() {
  const { t } = useI18n();

  const [memory, setMemory] = useState<MemoryProfile>({ ingredients: {}, tags: {}, badges: {} });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [newIngredient, setNewIngredient] = useState("");
  const [loading, setLoading] = useState(true);
  const [knowledge, setKnowledge] = useState("");
  const [knowledgeSaved, setKnowledgeSaved] = useState<"idle" | "saving" | "saved">("idle");

  async function loadMemory() {
    const res = await fetch("/api/profile/memory");
    if (res.ok) {
      const data = await res.json();
      setMemory((data.memoryProfile as MemoryProfile) ?? { ingredients: {}, tags: {}, badges: {} });
      setRecentEvents((data.recentEvents as RecentEvent[]) ?? []);
      setMemoryEnabled(data.memoryEnabled ?? true);
    }
    const kres = await fetch("/api/profile/knowledge");
    if (kres.ok) {
      const kdata = await kres.json();
      setKnowledge(kdata.knowledgeProfile ?? "");
    }
    setLoading(false);
  }

  useEffect(() => { loadMemory(); }, []);

  async function toggleMemory() {
    const newVal = !memoryEnabled;
    setMemoryEnabled(newVal);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memoryEnabled: newVal }),
    });
  }

  async function removeItem(entity: string, value: string) {
    const updated = { ...memory };
    if (entity === "ingredient") delete updated.ingredients[value];
    else if (entity === "tag") delete updated.tags[value];
    else if (entity === "badge") delete updated.badges[value];

    setMemory(updated);
    await fetch("/api/profile/memory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memoryProfile: updated }),
    });
  }

  async function addIngredient() {
    const name = newIngredient.trim().toLowerCase();
    if (!name) return;

    const updated = { ...memory };
    updated.ingredients[name] = { score: 0, count: 0 };
    setMemory(updated);
    setNewIngredient("");

    await fetch("/api/profile/memory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memoryProfile: updated }),
    });
  }

  async function deleteAll() {
    if (!confirm(t("memory.delete_all_confirm"))) return;
    await fetch("/api/profile/memory", { method: "DELETE" });
    setMemory({ ingredients: {}, tags: {}, badges: {} });
    setRecentEvents([]);
  }

  async function saveKnowledge() {
    setKnowledgeSaved("saving");
    await fetch("/api/profile/knowledge", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ knowledgeProfile: knowledge }),
    });
    setKnowledgeSaved("saved");
    setTimeout(() => setKnowledgeSaved("idle"), 2000);
  }

  const sortedIngredients = Object.entries(memory.ingredients).sort((a, b) => b[1].score - a[1].score);
  const sortedTags = Object.entries(memory.tags).sort((a, b) => b[1].score - a[1].score);
  const sortedBadges = Object.entries(memory.badges).sort((a, b) => b[1].score - a[1].score);
  const hasData = sortedIngredients.length > 0 || sortedTags.length > 0 || sortedBadges.length > 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 pb-24">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 pb-24">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="h-5 w-5 text-orange-500" />
        <h1 className="text-xl font-bold">{t("memory.title")}</h1>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{t("memory.description")}</p>

      <div className="flex items-center justify-between mb-6 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
        <span className="text-sm font-medium">{t("memory.learning_toggle")}</span>
        <button
          onClick={toggleMemory}
          className={`relative h-6 w-11 rounded-full transition-colors ${memoryEnabled ? "bg-orange-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${memoryEnabled ? "translate-x-5" : ""}`} />
        </button>
      </div>

      {!hasData ? (
        <p className="text-center text-zinc-400 dark:text-zinc-500 py-8">{t("memory.no_data")}</p>
      ) : (
        <>
          {sortedIngredients.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">{t("memory.ingredients_section")}</h2>
              <div className="space-y-1">
                {sortedIngredients.map(([name, data]) => (
                  <div key={`ing-${name}`} className={`flex items-center justify-between rounded-lg px-3 py-2 ${scoreColor(data.score)}`}>
                    <span className="text-sm font-medium">
                      {scoreEmoji(data.score)} {name} <span className="opacity-60 text-xs">({data.count} recetas)</span>
                    </span>
                    <button onClick={() => removeItem("ingredient", name)} className="opacity-50 hover:opacity-100">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(sortedTags.length > 0 || sortedBadges.length > 0) && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">{t("memory.tags_section")}</h2>
              <div className="space-y-1">
                {sortedTags.map(([name, data]) => (
                  <div key={`tag-${name}`} className={`flex items-center justify-between rounded-lg px-3 py-2 ${scoreColor(data.score)}`}>
                    <span className="text-sm font-medium">
                      {scoreEmoji(data.score)} {name} <span className="opacity-60 text-xs">({data.count})</span>
                    </span>
                    <button onClick={() => removeItem("tag", name)} className="opacity-50 hover:opacity-100">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {sortedBadges.map(([name, data]) => (
                  <div key={`badge-${name}`} className={`flex items-center justify-between rounded-lg px-3 py-2 ${scoreColor(data.score)}`}>
                    <span className="text-sm font-medium">
                      {scoreEmoji(data.score)} {name.replace(/_/g, " ")} <span className="opacity-60 text-xs">({data.count})</span>
                    </span>
                    <button onClick={() => removeItem("badge", name)} className="opacity-50 hover:opacity-100">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <div className="flex gap-2 mb-6">
        <Input
          value={newIngredient}
          onChange={(e) => setNewIngredient(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addIngredient(); }}
          placeholder={t("memory.add_ingredient")}
          className="flex-1"
        />
        <Button size="sm" onClick={addIngredient}><Plus className="h-4 w-4" /></Button>
      </div>

      {recentEvents.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">{t("memory.recent_activity")}</h2>
          <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            {recentEvents.slice(0, 10).map((ev) => (
              <div key={ev.id} className="flex justify-between">
                <span>{EVENT_LABELS[ev.type] ?? ev.type}: <strong>{ev.value}</strong> ({ev.entity})</span>
                <span className={ev.weight >= 0 ? "text-green-600" : "text-red-500"}>{ev.weight > 0 ? "+" : ""}{ev.weight}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Conocimiento contextual</h2>
          {knowledgeSaved !== "idle" && (
            <span className={`text-xs ${knowledgeSaved === "saving" ? "text-zinc-400" : "text-green-500"}`}>
              {knowledgeSaved === "saving" ? "Guardando..." : "✓ Guardado"}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Información sobre tus hábitos, entrenamiento y contexto que Fulse usa para adaptar las recetas. Pegá acá tu documento de conocimiento o escribí libremente.
        </p>
        <textarea
          value={knowledge}
          onChange={(e) => setKnowledge(e.target.value)}
          onBlur={saveKnowledge}
          placeholder="Ej: Hago CrossFit a las 5am, desayuno 7-8am. Días de descanso como algo más ligero. Prefiero recetas rápidas de noche..."
          className="w-full min-h-48 rounded-xl border border-zinc-200 bg-white p-4 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder:text-zinc-600 font-mono"
        />
      </section>

      <Button variant="outline" onClick={deleteAll} className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
        <Trash2 className="h-4 w-4 mr-2" />
        {t("memory.delete_all")}
      </Button>
    </div>
  );
}

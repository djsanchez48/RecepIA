"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, Check, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/TagInput";
import { useI18n } from "@/lib/i18n-context";

type Lang = "es" | "en";

interface Profile {
  allergies: string[]; restrictions: string[]; dislikedIngredients: string[];
  lovedIngredients: string[]; equipment: string[]; defaultServings: number;
}

interface CollectionItem { id: string; name: string; emoji: string | null; _count: { recipes: number }; }

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const [profile, setProfile] = useState<Profile>({
    allergies: [], restrictions: [], dislikedIngredients: [],
    lovedIngredients: [], equipment: [], defaultServings: 2,
  });
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [generationCount, setGenerationCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [editingCol, setEditingCol] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => { fetch("/api/profile").then((r) => r.json()).then(setProfile); fetch("/api/collections").then((r) => r.json()).then(setCollections); }, []);

  useEffect(() => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    fetch("/api/drafts").then((r) => r.json()).then((drafts) => {
      setGenerationCount(drafts.filter((d: { createdAt: string }) => d.createdAt >= startOfMonth).length);
    });
  }, []);

  async function saveProfile() {
    await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function renameCollection(id: string) {
    if (!editName.trim()) return;
    await fetch(`/api/collections/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName.trim() }) });
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, name: editName.trim() } : c)));
    setEditingCol(null);
  }

  async function deleteCollection(id: string) {
    if (!confirm(t("settings.list_delete_confirm"))) return;
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    setCollections((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 pb-24">
      <h1 className="mb-6 text-2xl font-bold">{t("settings.title")}</h1>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">{t("settings.language")}</h2>
        <div className="flex gap-2">
          {(["es", "en"] as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${lang === l ? "bg-orange-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"}`}>
              <Globe className="h-4 w-4" /> {l === "es" ? "Español" : "English"}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">{t("settings.profile")}</h2>
        <div className="space-y-4">
          <TagInput label={t("settings.allergies")} values={profile.allergies} onChange={(allergies) => setProfile({ ...profile, allergies })} placeholder={t("settings.allergies_placeholder")} />
          <TagInput label={t("settings.restrictions")} values={profile.restrictions} onChange={(restrictions) => setProfile({ ...profile, restrictions })} placeholder={t("settings.restrictions_placeholder")} />
          <TagInput label={t("settings.disliked")} values={profile.dislikedIngredients} onChange={(dislikedIngredients) => setProfile({ ...profile, dislikedIngredients })} placeholder={t("settings.disliked_placeholder")} />
          <TagInput label={t("settings.loved")} values={profile.lovedIngredients} onChange={(lovedIngredients) => setProfile({ ...profile, lovedIngredients })} placeholder={t("settings.loved_placeholder")} />
          <TagInput label={t("settings.equipment")} values={profile.equipment} onChange={(equipment) => setProfile({ ...profile, equipment })} placeholder={t("settings.equipment_placeholder")} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("settings.servings")}</label>
            <Input type="number" min={1} max={20} value={profile.defaultServings} onChange={(e) => setProfile({ ...profile, defaultServings: parseInt(e.target.value, 10) || 2 })} className="w-24" />
          </div>
        </div>
        <Button onClick={saveProfile} className="mt-4 w-full">{saved ? <><Check className="h-4 w-4" />{t("settings.saved")}</> : t("settings.save_profile")}</Button>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">{t("settings.lists")}</h2>
        <div className="space-y-2">
          {collections.map((col) => (
            <div key={col.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
              {editingCol === col.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && renameCollection(col.id)} className="h-8 text-sm" autoFocus />
                  <button onClick={() => renameCollection(col.id)} className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingCol(null)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <>
                  <span className="text-sm">{col.emoji} {col.name}<span className="ml-2 text-xs text-zinc-400">{col._count.recipes} {t("settings.recipes_count")}</span></span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingCol(col.id); setEditName(col.name); }} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => deleteCollection(col.id)} className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">{t("settings.usage")}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{generationCount} {t("settings.generations_month")}</p>
      </section>
    </div>
  );
}

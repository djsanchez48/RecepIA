"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, Check, X, Globe, Target, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/TagInput";
import { useI18n } from "@/lib/i18n-context";
import { GOAL_CATALOG, type Goal } from "@/lib/nutrition/targets";

type Lang = "es" | "en";

interface Profile {
  allergies: string[]; restrictions: string[]; dislikedIngredients: string[];
  lovedIngredients: string[]; equipment: string[]; defaultServings: number;
  goals: Goal[]; goalsActive: boolean;
  age: number | null; weightKg: number | null; heightCm: number | null;
  activityLevel: string | null; biologicalSex: string | null;
  healthDataConsentAt: string | null;
}

interface CollectionItem { id: string; name: string; emoji: string | null; _count: { recipes: number }; }

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const [profile, setProfile] = useState<Profile>({
    allergies: [], restrictions: [], dislikedIngredients: [], lovedIngredients: [],
    equipment: [], defaultServings: 2, goals: [], goalsActive: true,
    age: null, weightKg: null, heightCm: null, activityLevel: null, biologicalSex: null,
    healthDataConsentAt: null,
  });
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [generationCount, setGenerationCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [editingCol, setEditingCol] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [consent, setConsent] = useState(false);
  const [profileScore, setProfileScore] = useState(0);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((p) => {
      setProfile(p);
      setConsent(!!p.healthDataConsentAt);
      let score = 0;
      if (p.allergies?.length || p.restrictions?.length) score++;
      if (p.goals?.length) score++;
      if (p.lovedIngredients?.length || p.dislikedIngredients?.length) score++;
      if (p.equipment?.length) score++;
      if (p.defaultServings) score++;
      if (p.age || p.weightKg) score++;
      if (p.biologicalSex || p.activityLevel) score++;
      setProfileScore(score);
    });
    fetch("/api/collections").then((r) => r.json()).then(setCollections);
  }, []);

  useEffect(() => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    fetch("/api/drafts").then((r) => r.json()).then((drafts) => {
      setGenerationCount(drafts.filter((d: { createdAt: string }) => d.createdAt >= startOfMonth).length);
    });
  }, []);

  function toggleGoal(goal: Goal) {
    setProfile((p) => {
      const has = p.goals.includes(goal);
      if (has) return { ...p, goals: p.goals.filter((g) => g !== goal) };
      if (p.goals.length >= 2) return p;
      return { ...p, goals: [...p.goals, goal] };
    });
  }

  async function saveProfile() {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, healthDataConsent: consent ? true : undefined }),
    });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function renameCollection(id: string) {
    if (!editName.trim()) return;
    await fetch(`/api/collections/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, name: editName.trim() } : c)));
    setEditingCol(null);
  }

  async function deleteCollection(id: string) {
    if (!confirm(t("settings.list_delete_confirm"))) return;
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    setCollections((prev) => prev.filter((c) => c.id !== id));
  }

  async function deleteHealthData() {
    if (!confirm(t("settings.delete_confirm"))) return;
    await fetch("/api/profile/health-data", { method: "DELETE" });
    setProfile((p) => ({ ...p, age: null, weightKg: null, heightCm: null, activityLevel: null, biologicalSex: null, healthDataConsentAt: null }));
    setConsent(false);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 pb-24">
      <h1 className="mb-4 text-2xl font-bold">{t("settings.title")}</h1>

      <div className="mb-6 rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
        <div className="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Tu perfil</span>
          <span>{profileScore} de 7</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full rounded-full bg-orange-400 transition-all"
            style={{ width: `${(profileScore / 7) * 100}%` }}
          />
        </div>
      </div>

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
        <h2 className="mb-1 text-lg font-semibold">🎯 {t("settings.objectives_title")}</h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{t("settings.objectives_disclaimer")}</p>

        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={() => setProfile((p) => ({ ...p, goalsActive: !p.goalsActive }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile.goalsActive ? "bg-orange-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.goalsActive ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <span className="text-sm">{profile.goalsActive ? t("settings.objectives_on") : t("settings.objectives_off")}</span>
        </div>

        {profile.goalsActive && (
          <div className="flex flex-wrap gap-2">
            {GOAL_CATALOG.map((g) => {
              const active = profile.goals.includes(g.id);
              const key = `goals.${g.id}` as const;
              return (
                <button key={g.id} onClick={() => toggleGoal(g.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${active ? "bg-orange-100 text-orange-700 ring-1 ring-orange-400 dark:bg-orange-900/40 dark:text-orange-300" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                  {g.emoji} {t(key)}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-1 text-lg font-semibold">📊 {t("settings.body_title")}</h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{t("settings.body_subtitle")}</p>

        <label className="mb-3 flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 accent-orange-500" />
          <span>{t("settings.body_consent")}</span>
        </label>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">{t("settings.body_age")}</label>
              <Input type="number" min={1} max={120} disabled={!consent} value={profile.age ?? ""} onChange={(e) => setProfile({ ...profile, age: e.target.value ? parseInt(e.target.value) : null })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">{t("settings.body_weight")}</label>
              <Input type="number" min={30} max={300} step="0.1" disabled={!consent} value={profile.weightKg ?? ""} onChange={(e) => setProfile({ ...profile, weightKg: e.target.value ? parseFloat(e.target.value) : null })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">{t("settings.body_height")}</label>
              <Input type="number" min={100} max={250} disabled={!consent} value={profile.heightCm ?? ""} onChange={(e) => setProfile({ ...profile, heightCm: e.target.value ? parseInt(e.target.value) : null })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">{t("settings.body_activity")}</label>
              <select value={profile.activityLevel ?? ""} disabled={!consent} onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value || null })}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900">
                <option value="">—</option>
                <option value="sedentario">{t("settings.body_activity_sedentario")} — poco o nada de ejercicio</option>
                <option value="ligero">{t("settings.body_activity_ligero")} — 1-3 días por semana</option>
                <option value="moderado">{t("settings.body_activity_moderado")} — 3-5 días por semana</option>
                <option value="activo">{t("settings.body_activity_activo")} — 6-7 días por semana</option>
                <option value="muy_activo">{t("settings.body_activity_muy_activo")} — ejercicio intenso diario</option>
              </select>
            </div>
          </div>
          <div>
            <div className="flex gap-2">
              {[
                { value: "m", label: t("settings.body_sex_m") },
                { value: "f", label: t("settings.body_sex_f") },
                { value: null, label: t("settings.body_sex_null") },
              ].map((opt) => (
                <button key={opt.label} onClick={() => setProfile({ ...profile, biologicalSex: opt.value })}
                  disabled={!consent}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    profile.biologicalSex === opt.value
                      ? "bg-orange-100 text-orange-700 ring-1 ring-orange-400 dark:bg-orange-900/40 dark:text-orange-300"
                      : consent
                        ? "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                        : "bg-zinc-50 text-zinc-300 cursor-not-allowed dark:bg-zinc-800/50 dark:text-zinc-600"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
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
      </section>

      <Button onClick={saveProfile} className="mb-8 w-full">
        {saved ? <><Check className="h-4 w-4" />{t("settings.saved")}</> : t("settings.save_profile")}
      </Button>

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

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">{t("settings.usage")}</h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">{generationCount} {t("settings.generations_month")}</p>
        <Button variant="outline" size="sm" onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/acceso";
        }} className="text-zinc-500">
          <LogOut className="h-4 w-4 mr-1" /> {t("settings.logout")}
        </Button>
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, X, Globe, LogOut, Brain, ArrowRight, ChevronRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/TagInput";
import { useI18n } from "@/lib/i18n-context";
import { GOAL_CATALOG, type Goal } from "@/lib/nutrition/targets";

type Lang = "es" | "en";

const MAIN_GOALS: Goal[] = ["bajar_peso", "ganar_musculo", "mas_saludable", "mantenerme"];
const ADJUSTMENTS: Goal[] = ["mas_proteina", "menos_azucar", "menos_sal", "mas_vegetales", "economico"];

interface Profile {
  allergies: string[]; restrictions: string[]; dislikedIngredients: string[];
  lovedIngredients: string[]; equipment: string[]; defaultServings: number;
  goals: Goal[]; goalsActive: boolean;
  age: number | null; weightKg: number | null; heightCm: number | null;
  activityLevel: string | null; biologicalSex: string | null;
  healthDataConsentAt: string | null;
}

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const [profile, setProfile] = useState<Profile>({
    allergies: [], restrictions: [], dislikedIngredients: [], lovedIngredients: [],
    equipment: [], defaultServings: 2, goals: [], goalsActive: true,
    age: null, weightKg: null, heightCm: null, activityLevel: null, biologicalSex: null,
    healthDataConsentAt: null,
  });
  const [generationCount, setGenerationCount] = useState(0);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [consent, setConsent] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const mainGoal = MAIN_GOALS.find((g) => profile.goals.includes(g)) ?? null;
  const activeAdjustments = profile.goals.filter((g) => ADJUSTMENTS.includes(g));

  function updateProfile(patch: Partial<Profile>) {
    setProfile((p) => ({ ...p, ...patch }));
  }

  const autosave = useCallback(async (data: Profile) => {
    setSaved("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, healthDataConsent: consent ? true : undefined }),
      });
      setSaved("saved");
      setTimeout(() => setSaved("idle"), 2000);
    }, 600);
  }, [consent]);

  function setMainGoal(goal: Goal) {
    const next = [goal, ...activeAdjustments];
    updateProfile({ goals: next });
    autosave({ ...profile, goals: next, goalsActive: true });
  }

  function toggleAdjustment(goal: Goal) {
    const has = activeAdjustments.includes(goal);
    const nextAdjustments = has
      ? activeAdjustments.filter((g) => g !== goal)
      : [...activeAdjustments, goal];
    const next = mainGoal ? [mainGoal, ...nextAdjustments] : nextAdjustments;
    updateProfile({ goals: next });
    autosave({ ...profile, goals: next, goalsActive: true });
  }

  function patchAndSave(patch: Partial<Profile>) {
    const next = { ...profile, ...patch };
    updateProfile(patch);
    autosave(next);
  }

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((p) => {
      setProfile(p);
      setConsent(!!p.healthDataConsentAt);
    });
  }, []);

  useEffect(() => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    fetch("/api/drafts").then((r) => r.json()).then((drafts) => {
      setGenerationCount(drafts.filter((d: { createdAt: string }) => d.createdAt >= startOfMonth).length);
    });
  }, []);

  const genLabel = generationCount === 1 ? "1 generación este mes" : `${generationCount} generaciones este mes`;

  return (
    <div className="mx-auto max-w-xl px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">🍳 Fulse</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{t("settings.title")}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Lo que Fulse usa para cocinar a tu medida.</p>
          </div>
          {saved !== "idle" && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-opacity ${saved === "saving" ? "border-zinc-300 text-zinc-400 dark:border-zinc-600" : "border-green-300 text-green-600 dark:border-green-800 dark:text-green-400"}`}>
              {saved === "saved" && <Check className="h-3 w-3" />}
              {saved === "saving" ? "Guardando..." : "Guardado"}
            </span>
          )}
        </div>
      </div>

      {/* A — Mi objetivo */}
      <section className="mb-8">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[1.4px] text-zinc-400">Mi objetivo</p>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">Elige uno. Fulse ajusta cada receta a esta meta.</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {MAIN_GOALS.map((g) => {
            const info = GOAL_CATALOG.find((c) => c.id === g);
            const active = g === mainGoal;
            return (
              <button key={g} onClick={() => setMainGoal(g)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? "bg-orange-500 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                {info?.label ?? g}
              </button>
            );
          })}
        </div>

        <p className="mb-1 text-[11px] font-bold uppercase tracking-[1.4px] text-zinc-400">Ajustes</p>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">Opcionales. Se apilan sobre tu meta, no la reemplazan.</p>
        <div className="flex flex-wrap gap-2">
          {ADJUSTMENTS.map((g) => {
            const info = GOAL_CATALOG.find((c) => c.id === g);
            const active = activeAdjustments.includes(g);
            return (
              <button key={g} onClick={() => toggleAdjustment(g)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${active ? "bg-orange-100 text-orange-700 ring-1 ring-orange-400 dark:bg-orange-900/40 dark:text-orange-300" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                {info?.label ?? g}
              </button>
            );
          })}
        </div>
      </section>

      {/* B — Mi Memoria */}
      <section className="mb-8">
        <a href="/memoria" className="block rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50/80 to-white p-4 transition-colors hover:from-orange-50 dark:border-orange-900/50 dark:from-orange-950/30 dark:to-zinc-900">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🧠</span>
            <span className="text-sm font-semibold">{t("memory.title")}</span>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">AUTOMÁTICO</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Fulse aprende en silencio de lo que cocinas y guardas. Esto ya lo detectó:</p>
          <div className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
            Ver y editar lo aprendido <ChevronRight className="h-3 w-3" />
          </div>
        </a>
      </section>

      {/* C — Tu cuerpo */}
      <section className="mb-8">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[1.4px] text-zinc-400">Tu cuerpo</p>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Opcional. Afina porciones y macros.{" "}
          <button onClick={() => setPrivacyOpen(!privacyOpen)} className="text-orange-500 hover:underline">Por qué lo pedimos</button>
        </p>

        {privacyOpen && (
          <div className="mb-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
            {t("settings.body_consent")}
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("settings.body_age")}</label>
              <Input type="number" min={1} max={120} value={profile.age ?? ""} onChange={(e) => patchAndSave({ age: e.target.value ? parseInt(e.target.value) : null })}
                className="rounded-[11px]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("settings.body_weight")}</label>
              <Input type="number" min={30} max={300} step="0.1" value={profile.weightKg ?? ""} onChange={(e) => patchAndSave({ weightKg: e.target.value ? parseFloat(e.target.value) : null })}
                className="rounded-[11px]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("settings.body_height")}</label>
              <Input type="number" min={100} max={250} value={profile.heightCm ?? ""} onChange={(e) => patchAndSave({ heightCm: e.target.value ? parseInt(e.target.value) : null })}
                className="rounded-[11px]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("settings.body_activity")}</label>
              <select value={profile.activityLevel ?? "moderado"} onChange={(e) => patchAndSave({ activityLevel: e.target.value || null })}
                className="w-full rounded-[11px] border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                <option value="sedentario">{t("settings.body_activity_sedentario")} — {t("settings.body_activity_hint_sedentario")}</option>
                <option value="ligero">{t("settings.body_activity_ligero")} — {t("settings.body_activity_hint_ligero")}</option>
                <option value="moderado">{t("settings.body_activity_moderado")} — {t("settings.body_activity_hint_moderado")}</option>
                <option value="activo">{t("settings.body_activity_activo")} — {t("settings.body_activity_hint_activo")}</option>
                <option value="muy_activo">{t("settings.body_activity_muy_activo")} — {t("settings.body_activity_hint_muy_activo")}</option>
              </select>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">Sexo · para estimar macros</p>
            <div className="flex gap-2">
              {[
                { value: "m", label: t("settings.body_sex_m") },
                { value: "f", label: t("settings.body_sex_f") },
                { value: null, label: t("settings.body_sex_null") },
              ].map((opt) => (
                <button key={opt.label} onClick={() => patchAndSave({ biologicalSex: opt.value })}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${profile.biologicalSex === opt.value ? "bg-orange-100 text-orange-700 ring-1 ring-orange-400 dark:bg-orange-900/40 dark:text-orange-300" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* D — Tu cocina y gustos */}
      <section className="mb-8">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[1.4px] text-zinc-400">Tu cocina y gustos</p>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">Lo que más cambia el resultado de cada receta.</p>

        <div className="space-y-4">
          <TagInput label={t("settings.allergies")} values={profile.allergies} onChange={(allergies) => patchAndSave({ allergies })} placeholder="agrega una…" />
          <TagInput label={t("settings.restrictions")} values={profile.restrictions} onChange={(restrictions) => patchAndSave({ restrictions })} placeholder="sin gluten, bajo en azúcar…" />
          <TagInput label={t("settings.disliked")} values={profile.dislikedIngredients} onChange={(dislikedIngredients) => patchAndSave({ dislikedIngredients })} placeholder="cilantro…" />
          <TagInput label={t("settings.loved")} values={profile.lovedIngredients} onChange={(lovedIngredients) => patchAndSave({ lovedIngredients })} placeholder="ajo, limón…" />
          <TagInput label={t("settings.equipment")} values={profile.equipment} onChange={(equipment) => patchAndSave({ equipment })} placeholder="olla a presión, horno…" />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("settings.servings")}</label>
            <div className="flex items-center gap-3">
              <button onClick={() => patchAndSave({ defaultServings: Math.max(1, profile.defaultServings - 1) })}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums">{profile.defaultServings}</span>
              <button onClick={() => patchAndSave({ defaultServings: Math.min(12, profile.defaultServings + 1) })}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* E — Cuenta */}
      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[1.4px] text-zinc-400">Cuenta</p>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium">{t("settings.language")}</span>
          <div className="flex gap-1 rounded-full bg-zinc-100 p-0.5 dark:bg-zinc-800">
            {(["es", "en"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${lang === l ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"}`}>
                {l === "es" ? "Español" : "English"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
          <div>
            <p className="text-sm font-medium">Plan Free</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{genLabel}</p>
          </div>
          <span className="text-xs text-orange-500 font-medium cursor-pointer">Ver planes →</span>
        </div>

        <Button variant="outline" size="sm" onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/acceso";
        }} className="w-full text-zinc-400 border-zinc-200 dark:border-zinc-700">
          <LogOut className="h-4 w-4 mr-1" /> {t("settings.logout")}
        </Button>
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GOAL_CATALOG, type Goal } from "@/lib/nutrition/targets";

const COMMON_ALLERGIES = [
  { value: "maní", label: "🥜 Maní", field: "allergies" as const },
  { value: "mariscos", label: "🦐 Mariscos", field: "allergies" as const },
  { value: "lácteos", label: "🥛 Lácteos", field: "allergies" as const },
  { value: "huevo", label: "🥚 Huevo", field: "allergies" as const },
  { value: "gluten", label: "🌾 Sin gluten", field: "restrictions" as const },
  { value: "vegetariano", label: "🥩 Vegetariano/a", field: "restrictions" as const },
  { value: "vegano", label: "🌱 Vegano/a", field: "restrictions" as const },
];

export default function BienvenidaPage() {
  const router = useRouter();
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [customAllergy, setCustomAllergy] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((p) => {
      if (p.onboardingCompletedAt) {
        router.replace("/");
      }
    });
  }, [router]);

  function toggleChip(chip: (typeof COMMON_ALLERGIES)[0]) {
    if (chip.field === "allergies") {
      setSelectedAllergies((prev) =>
        prev.includes(chip.value) ? prev.filter((a) => a !== chip.value) : [...prev, chip.value],
      );
    } else {
      setSelectedRestrictions((prev) =>
        prev.includes(chip.value) ? prev.filter((r) => r !== chip.value) : [...prev, chip.value],
      );
    }
  }

  function addCustomAllergy() {
    const val = customAllergy.trim().toLowerCase();
    if (val && !selectedAllergies.includes(val)) {
      setSelectedAllergies((prev) => [...prev, val]);
    }
    setCustomAllergy("");
  }

  function toggleGoal(goal: Goal) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : prev.length < 2 ? [...prev, goal] : prev,
    );
  }

  async function finish(skip: boolean) {
    setSaving(true);
    const body: Record<string, unknown> = {};
    if (!skip) {
      body.allergies = selectedAllergies;
      body.restrictions = selectedRestrictions;
      body.goals = selectedGoals;
    }
    body.onboardingCompletedAt = new Date().toISOString();
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.replace("/");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 pb-24">
      <div className="mb-8 text-center">
        <span className="text-5xl">🍳</span>
        <h1 className="mt-4 text-2xl font-bold">Hagamos recetas para ti</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          20 segundos y empezamos a cocinar. Todo es opcional.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          ¿Alguna alergia o restricción?
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_ALLERGIES.map((chip) => {
            const active = chip.field === "allergies"
              ? selectedAllergies.includes(chip.value)
              : selectedRestrictions.includes(chip.value);
            return (
              <button key={chip.value} onClick={() => toggleChip(chip)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-orange-100 text-orange-700 ring-1 ring-orange-400 dark:bg-orange-900/40 dark:text-orange-300"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                }`}>
                {chip.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Otra..."
            value={customAllergy}
            onChange={(e) => setCustomAllergy(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomAllergy()}
            className="text-sm"
          />
          <Button size="sm" variant="outline" onClick={addCustomAllergy} disabled={!customAllergy.trim()}>
            Agregar
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          ¿Quieres que tus recetas apunten a algo?
        </h2>
        <div className="flex flex-wrap gap-2">
          {GOAL_CATALOG.map((g) => {
            const active = selectedGoals.includes(g.id);
            return (
              <button key={g.id} onClick={() => toggleGoal(g.id)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-orange-100 text-orange-700 ring-1 ring-orange-400 dark:bg-orange-900/40 dark:text-orange-300"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                }`}>
                {g.emoji} {g.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <Button onClick={() => finish(false)} disabled={saving} className="w-full h-12 text-base" size="lg">
          Empezar a cocinar <ArrowRight className="ml-1 h-5 w-5" />
        </Button>
        <button
          onClick={() => finish(true)}
          className="w-full text-center text-sm text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400"
        >
          Saltar por ahora
        </button>
      </div>
    </div>
  );
}

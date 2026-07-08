export type Goal = "bajar_peso" | "ganar_musculo" | "mas_saludable" | "mantenerme" | "mas_proteina" | "menos_azucar" | "menos_sal" | "mas_vegetales" | "economico";

export interface GoalInfo {
  id: Goal;
  label: string;
  emoji: string;
}

export const GOAL_CATALOG: GoalInfo[] = [
  { id: "bajar_peso", label: "Bajar de peso", emoji: "⚖️" },
  { id: "ganar_musculo", label: "Ganar masa muscular", emoji: "💪" },
  { id: "mas_saludable", label: "Comer más saludable", emoji: "🥗" },
  { id: "mantenerme", label: "Mantenerme", emoji: "⚡" },
  { id: "mas_proteina", label: "Más proteína", emoji: "🍗" },
  { id: "menos_azucar", label: "Menos azúcar", emoji: "🍬" },
  { id: "menos_sal", label: "Menos sal", emoji: "🧂" },
  { id: "mas_vegetales", label: "Más vegetales", emoji: "🥦" },
  { id: "economico", label: "Comer económico", emoji: "💸" },
];

export function getGoalInfo(id: Goal): GoalInfo {
  return GOAL_CATALOG.find((g) => g.id === id) ?? { id, label: id, emoji: "" };
}

export interface BodyData {
  age?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  activityLevel?: string | null;
  biologicalSex?: string | null;
}

export interface DailyTargets {
  kcal: number;
  proteinG: number;
  generic: boolean;
}

const ACTIVITY_FACTORS: Record<string, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

export function calculateDailyTargets(goals: Goal[], body: BodyData): DailyTargets {
  const hasData = body.weightKg != null && body.heightCm != null && body.age != null;
  let bmr: number;
  let generic = !hasData;

  if (hasData) {
    const w = body.weightKg!;
    const h = body.heightCm!;
    const a = body.age!;
    if (body.biologicalSex === "f") {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    }
  } else {
    bmr = 1800;
    generic = true;
  }

  const factor = ACTIVITY_FACTORS[body.activityLevel ?? ""] ?? 1.375;
  let kcal = Math.round(bmr * factor);
  let proteinG = Math.round(kcal * 0.15 / 4);

  if (goals.includes("bajar_peso")) {
    kcal = Math.round(kcal * 0.85);
    proteinG = Math.round(kcal * 0.22 / 4);
  }
  if (goals.includes("ganar_musculo")) {
    kcal = Math.round(kcal * 1.1);
    proteinG = Math.round(Math.max(kcal * 0.25 / 4, 1.6 * (body.weightKg ?? 70)));
  }
  if (goals.includes("mas_proteina")) {
    proteinG = Math.round(Math.max(proteinG, 1.6 * (body.weightKg ?? 70)));
  }

  return { kcal, proteinG, generic };
}

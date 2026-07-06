import { prisma } from "@/lib/prisma";

export type NudgeId = "equipo" | "objetivo" | "porciones" | "gustos";

interface NudgeState {
  shown: number;
  dismissed: boolean;
  lastSeenAt?: string;
}

const NUDGE_MAX_SHOWN = 2;
const ONE_DAY = 24 * 60 * 60 * 1000;

export function getNudgeState(nudgeStateJson: unknown, nudgeId: NudgeId): NudgeState {
  const state = (nudgeStateJson as Record<string, NudgeState> | undefined) ?? {};
  return state[nudgeId] ?? { shown: 0, dismissed: false };
}

export function shouldShowNudge(state: NudgeState): boolean {
  if (state.dismissed) return false;
  if (state.shown >= NUDGE_MAX_SHOWN) return false;
  if (state.lastSeenAt && Date.now() - new Date(state.lastSeenAt).getTime() < ONE_DAY) return false;
  return true;
}

export async function canShowNudge(nudgeId: NudgeId): Promise<boolean> {
  const profile = await prisma.userProfile.findUnique({ where: { id: "main" } });
  if (!profile) return false;

  const nudgeStateJson = profile.nudgeState as Record<string, NudgeState> | null;
  const state = getNudgeState(nudgeStateJson, nudgeId);

  if (!shouldShowNudge(state)) return false;

  switch (nudgeId) {
    case "equipo":
      return (profile.equipment ?? []).length === 0;
    case "objetivo":
      return (profile.goals ?? []).length === 0;
    case "porciones":
      return true;
    case "gustos":
      return (profile.lovedIngredients ?? []).length === 0 && (profile.dislikedIngredients ?? []).length === 0;
    default:
      return false;
  }
}

export async function markNudgeShown(nudgeId: NudgeId): Promise<void> {
  const profile = await prisma.userProfile.findUnique({ where: { id: "main" } });
  if (!profile) return;

  const nudgeStateJson = (profile.nudgeState as unknown as Record<string, NudgeState>) ?? {};
  const current = getNudgeState(nudgeStateJson, nudgeId);
  current.shown += 1;
  current.lastSeenAt = new Date().toISOString();

  await prisma.userProfile.update({
    where: { id: "main" },
    data: {
      nudgeState: JSON.parse(JSON.stringify({ ...nudgeStateJson, [nudgeId]: current })),
    },
  });
}

export async function dismissNudge(nudgeId: NudgeId): Promise<void> {
  const profile = await prisma.userProfile.findUnique({ where: { id: "main" } });
  if (!profile) return;

  const nudgeStateJson = (profile.nudgeState as unknown as Record<string, NudgeState>) ?? {};
  const current = getNudgeState(nudgeStateJson, nudgeId);
  current.dismissed = true;

  await prisma.userProfile.update({
    where: { id: "main" },
    data: {
      nudgeState: JSON.parse(JSON.stringify({ ...nudgeStateJson, [nudgeId]: current })),
    },
  });
}

export const NUDGE_CATALOG: Record<NudgeId, { message: string; action: string }> = {
  equipo: {
    message: "¿Tienes airfryer, horno u olla a presión? Tus recetas los usarán.",
    action: "/settings",
  },
  objetivo: {
    message: "¿Quieres que tus recetas apunten a algo? (más músculo, menos azúcar...)",
    action: "/settings",
  },
  porciones: {
    message: "¿Pongo {n} como tus porciones por defecto?",
    action: "/settings",
  },
  gustos: {
    message: "Cuéntame 2-3 ingredientes que ames y las recetas se sentirán más tuyas",
    action: "/settings",
  },
};

import { prisma } from "@/lib/prisma";

export interface TrackEvent {
  type: "recipe_saved" | "recipe_collected" | "recipe_cooked" | "recipe_deleted" | "draft_discarded";
  entity: "ingredient" | "tag" | "badge";
  value: string;
  weight: number;
  recipeId?: string;
}

const DECAY_DAYS = 180;

export async function trackEvents(events: TrackEvent[]) {
  if (events.length === 0) return;

  const profile = await prisma.userProfile.findUnique({ where: { id: "main" } });
  if (!profile?.memoryEnabled) return;

  await prisma.$transaction(async (tx) => {
    for (const event of events) {
      await tx.preferenceEvent.create({
        data: {
          type: event.type,
          entity: event.entity,
          value: event.value,
          weight: event.weight,
          recipeId: event.recipeId ?? null,
        },
      });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DECAY_DAYS);

    const allEvents = await tx.preferenceEvent.findMany({
      where: { createdAt: { gte: cutoff } },
      select: { entity: true, value: true, weight: true },
    });

    const profile_update: Record<string, { score: number; count: number }> = {};

    for (const e of allEvents) {
      const key = `${e.entity}:${e.value}`;
      if (!profile_update[key]) {
        profile_update[key] = { score: 0, count: 0 };
      }
      profile_update[key].score += e.weight;
      profile_update[key].count += 1;
    }

    const ingredients: Record<string, { score: number; count: number }> = {};
    const tags: Record<string, { score: number; count: number }> = {};
    const badges: Record<string, { score: number; count: number }> = {};

    for (const [key, data] of Object.entries(profile_update)) {
      const [entity, ...valueParts] = key.split(":");
      const value = valueParts.join(":");
      if (entity === "ingredient") ingredients[value] = data;
      else if (entity === "tag") tags[value] = data;
      else if (entity === "badge") badges[value] = data;
    }

    await tx.userProfile.update({
      where: { id: "main" },
      data: {
        memoryProfile: {
          ingredients,
          tags,
          badges,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  });
}

export async function rebuildMemoryProfile() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DECAY_DAYS);

  const allEvents = await prisma.preferenceEvent.findMany({
    where: { createdAt: { gte: cutoff } },
    select: { entity: true, value: true, weight: true },
  });

  const profile_update: Record<string, { score: number; count: number }> = {};

  for (const e of allEvents) {
    const key = `${e.entity}:${e.value}`;
    if (!profile_update[key]) {
      profile_update[key] = { score: 0, count: 0 };
    }
    profile_update[key].score += e.weight;
    profile_update[key].count += 1;
  }

  const ingredients: Record<string, { score: number; count: number }> = {};
  const tags: Record<string, { score: number; count: number }> = {};
  const badges: Record<string, { score: number; count: number }> = {};

  for (const [key, data] of Object.entries(profile_update)) {
    const [entity, ...valueParts] = key.split(":");
    const value = valueParts.join(":");
    if (entity === "ingredient") ingredients[value] = data;
    else if (entity === "tag") tags[value] = data;
    else if (entity === "badge") badges[value] = data;
  }

  await prisma.userProfile.update({
    where: { id: "main" },
    data: {
      memoryProfile: {
        ingredients,
        tags,
        badges,
        updatedAt: new Date().toISOString(),
      },
    },
  });
}

export function extractEventPayloads(
  type: TrackEvent["type"],
  data: {
    ingredients?: { name: string }[];
    tags?: string[];
    badges?: string[];
  },
  weight: number,
  recipeId?: string,
): TrackEvent[] {
  const events: TrackEvent[] = [];

  for (const ing of data.ingredients ?? []) {
    events.push({ type, entity: "ingredient", value: ing.name.trim().toLowerCase(), weight, recipeId });
  }

  for (const tag of data.tags ?? []) {
    events.push({ type, entity: "tag", value: tag.trim().toLowerCase(), weight, recipeId });
  }

  for (const badge of data.badges ?? []) {
    events.push({ type, entity: "badge", value: badge.trim().toLowerCase(), weight, recipeId });
  }

  return events;
}

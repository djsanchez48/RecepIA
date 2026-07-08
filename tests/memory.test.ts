import { describe, it, expect, vi } from "vitest";
import { extractEventPayloads } from "@/lib/insights/track";

const {
  mockPrismaFindUnique,
  mockPrismaTransaction,
} = vi.hoisted(() => ({
  mockPrismaFindUnique: vi.fn(),
  mockPrismaTransaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userProfile: { findUnique: mockPrismaFindUnique },
    preferenceEvent: {},
    $transaction: mockPrismaTransaction,
  },
}));

describe("extractEventPayloads", () => {
  it("creates events for all ingredients, tags, and badges", () => {
    const events = extractEventPayloads(
      "recipe_saved",
      {
        ingredients: [{ name: "Pollo" }, { name: "Ajo" }, { name: "cebolla" }],
        tags: ["italiana", "rápida"],
        badges: ["alta_proteina"],
      },
      2,
      "recipe-1",
    );

    expect(events).toHaveLength(6);

    expect(events[0]).toEqual({
      type: "recipe_saved",
      entity: "ingredient",
      value: "pollo",
      weight: 2,
      recipeId: "recipe-1",
    });

    expect(events[3]).toEqual({
      type: "recipe_saved",
      entity: "tag",
      value: "italiana",
      weight: 2,
      recipeId: "recipe-1",
    });

    expect(events[5]).toEqual({
      type: "recipe_saved",
      entity: "badge",
      value: "alta_proteina",
      weight: 2,
      recipeId: "recipe-1",
    });
  });

  it("normalizes ingredient names to lowercase", () => {
    const events = extractEventPayloads(
      "recipe_cooked",
      { ingredients: [{ name: "POLLO" }, { name: " Aceite de Oliva " }] },
      3,
    );

    expect(events[0].value).toBe("pollo");
    expect(events[1].value).toBe("aceite de oliva");
  });

  it("returns empty array when no data provided", () => {
    const events = extractEventPayloads("recipe_saved", {}, 2);
    expect(events).toHaveLength(0);
  });

  it("handles undefined tags and badges gracefully", () => {
    const events = extractEventPayloads(
      "recipe_deleted",
      { ingredients: [{ name: "arroz" }] },
      -2,
    );
    expect(events).toHaveLength(1);
  });

  it("supports negative weights for recipe_deleted and draft_discarded", () => {
    const saveEvents = extractEventPayloads(
      "recipe_saved",
      { ingredients: [{ name: "pollo" }] },
      2,
    );
    const deleteEvents = extractEventPayloads(
      "recipe_deleted",
      { ingredients: [{ name: "pollo" }] },
      -2,
    );
    const discardEvents = extractEventPayloads(
      "draft_discarded",
      { ingredients: [{ name: "pollo" }] },
      -1,
    );

    expect(saveEvents[0].weight).toBe(2);
    expect(deleteEvents[0].weight).toBe(-2);
    expect(discardEvents[0].weight).toBe(-1);
    expect(saveEvents[0].type).toBe("recipe_saved");
    expect(deleteEvents[0].type).toBe("recipe_deleted");
    expect(discardEvents[0].type).toBe("draft_discarded");
  });

  it("handles multiple badges and tags", () => {
    const events = extractEventPayloads(
      "recipe_collected",
      {
        ingredients: [{ name: "pollo" }],
        tags: ["italiana", "rápida", "fácil"],
        badges: ["alta_proteina", "ligera", "buena_fibra"],
      },
      1,
    );

    expect(events).toHaveLength(7);
    expect(events.filter((e) => e.entity === "ingredient")).toHaveLength(1);
    expect(events.filter((e) => e.entity === "tag")).toHaveLength(3);
    expect(events.filter((e) => e.entity === "badge")).toHaveLength(3);
  });

  it("does not require recipeId", () => {
    const events = extractEventPayloads(
      "draft_discarded",
      { ingredients: [{ name: "cebolla" }] },
      -1,
    );
    expect(events[0].recipeId).toBeUndefined();
  });
});

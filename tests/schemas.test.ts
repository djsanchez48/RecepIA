import { describe, it, expect } from "vitest";
import { generatedRecipeSchema } from "@/types/schemas";

const validRecipe = {
  title: "Pasta al pesto",
  description: "Deliciosa pasta con pesto casero",
  prepTimeMinutes: 10,
  cookTimeMinutes: 15,
  servings: 2,
  tags: ["italiana", "rápido"],
  ingredients: [
    { name: "pasta", quantity: 200, unit: "g", quantityText: null, note: "spaghetti" },
    { name: "pesto", quantity: 3, unit: "cucharadas", quantityText: null, note: null },
    { name: "sal", quantity: null, unit: null, quantityText: "al gusto", note: null },
  ],
  steps: ["Cocinar la pasta", "Mezclar con pesto", "Servir caliente"],
};

describe("generatedRecipeSchema", () => {
  it("accepts a valid recipe", () => {
    const result = generatedRecipeSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });

  it("rejects recipe with empty title", () => {
    const result = generatedRecipeSchema.safeParse({ ...validRecipe, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects recipe with no ingredients", () => {
    const result = generatedRecipeSchema.safeParse({ ...validRecipe, ingredients: [] });
    expect(result.success).toBe(false);
  });

  it("rejects recipe with no steps", () => {
    const result = generatedRecipeSchema.safeParse({ ...validRecipe, steps: [] });
    expect(result.success).toBe(false);
  });

  it("rejects recipe with empty step string", () => {
    const result = generatedRecipeSchema.safeParse({ ...validRecipe, steps: ["", "valid step"] });
    expect(result.success).toBe(false);
  });

  it("rejects recipe with negative prep time", () => {
    const result = generatedRecipeSchema.safeParse({ ...validRecipe, prepTimeMinutes: -5 });
    expect(result.success).toBe(false);
  });

  it("rejects recipe with zero servings", () => {
    const result = generatedRecipeSchema.safeParse({ ...validRecipe, servings: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts ingredient with quantityText instead of quantity", () => {
    const ing = { name: "sal", quantity: null, unit: null, quantityText: "al gusto", note: null };
    const result = generatedRecipeSchema.safeParse({ ...validRecipe, ingredients: [ing] });
    expect(result.success).toBe(true);
  });

  it("accepts ingredient with both quantity and quantityText null", () => {
    const ing = { name: "agua", quantity: null, unit: null, quantityText: null, note: null };
    const result = generatedRecipeSchema.safeParse({ ...validRecipe, ingredients: [ing] });
    expect(result.success).toBe(true);
  });

  it("accepts float quantity", () => {
    const ing = { name: "azúcar", quantity: 0.5, unit: "taza", quantityText: null, note: null };
    const result = generatedRecipeSchema.safeParse({ ...validRecipe, ingredients: [ing] });
    expect(result.success).toBe(true);
  });

  it("rejects missing title field", () => {
    const { title, ...rest } = validRecipe;
    const result = generatedRecipeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects non-array tags", () => {
    const result = generatedRecipeSchema.safeParse({ ...validRecipe, tags: "italiana" });
    expect(result.success).toBe(false);
  });
});

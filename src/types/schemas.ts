import { z } from "zod";

export const recipeIngredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
  quantityText: z.string().nullable(),
  note: z.string().nullable(),
});

export const generatedRecipeSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string(),
  prepTimeMinutes: z.number().int().min(0),
  cookTimeMinutes: z.number().int().min(0),
  servings: z.number().int().min(1),
  tags: z.array(z.string()),
  ingredients: z
    .array(recipeIngredientSchema)
    .min(1, "Debe tener al menos un ingrediente"),
  steps: z.array(z.string().min(1)).min(1, "Debe tener al menos un paso"),
});

export type GeneratedRecipe = z.infer<typeof generatedRecipeSchema>;
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;

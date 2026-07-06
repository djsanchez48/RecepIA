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
  nutrition: z.object({
    caloriesPerServing: z.number().int().min(0),
    proteinG: z.number().min(0),
    carbsG: z.number().min(0),
    fatG: z.number().min(0),
  }).optional(),
  nutriBadges: z.array(z.string()).optional(),
  profileHints: z.array(z.object({
    type: z.enum(["disliked_ingredient", "loved_ingredient", "equipment", "possible_allergy"]),
    value: z.string(),
    evidence: z.string(),
  })).optional(),
});

export const parsedRecipeSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  prepTimeMinutes: z.number().int().nullable(),
  cookTimeMinutes: z.number().int().nullable(),
  servings: z.number().int().nullable(),
  tags: z.array(z.string()),
  ingredients: z.array(recipeIngredientSchema),
  steps: z.array(z.string()),
});

export const parsedRecipeResultSchema = z.object({
  isRecipe: z.boolean(),
  confidence: z.enum(["high", "medium", "low"]),
  recipe: parsedRecipeSchema.nullable(),
  warnings: z.array(z.string()),
});

export type GeneratedRecipe = z.infer<typeof generatedRecipeSchema>;
export type ParsedRecipe = z.infer<typeof parsedRecipeSchema>;
export type ParsedRecipeResult = z.infer<typeof parsedRecipeResultSchema>;
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;

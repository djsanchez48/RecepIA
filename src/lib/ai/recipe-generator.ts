import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { generatedRecipeSchema, type GeneratedRecipe } from "@/types/schemas";
import { translations } from "@/lib/i18n";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1",
});

function buildSystemPrompt(
  profile: {
    allergies: string[];
    restrictions: string[];
    dislikedIngredients: string[];
    lovedIngredients: string[];
    equipment: string[];
    defaultServings: number;
    goals?: string[];
  },
  lang: "es" | "en" = "es",
) {
  const template = translations[lang]["ai.system_prompt"] as string;
  let prompt = template
    .replace("{allergies}", profile.allergies.join(", ") || "ninguna")
    .replace("{restrictions}", profile.restrictions.join(", ") || "ninguna")
    .replace("{dislikedIngredients}", profile.dislikedIngredients.join(", ") || "ninguno")
    .replace("{lovedIngredients}", profile.lovedIngredients.join(", ") || "ninguno")
    .replace("{equipment}", profile.equipment.join(", ") || "utensilios básicos")
    .replace("{defaultServings}", profile.defaultServings.toString());

  if (profile.goals && profile.goals.length > 0) {
    prompt += `\n\nObjetivo del usuario: ${profile.goals.join(", ")}. Orienta la receta hacia este objetivo SIN caer en restricción extrema: porciones razonables, nunca menos de ~350 kcal por comida principal, sin lenguaje de dieta ni culpa.`;
  }

  prompt += "\n\nIncluye en tu JSON un campo 'nutrition' con { caloriesPerServing, proteinG, carbsG, fatG } estimados por porción, y un campo 'nutriBadges' con etiquetas del catálogo: [\"alta_proteina\", \"ligera\", \"buena_fibra\", \"dulce\", \"contundente\", \"alta_fibra\", \"baja_azucar\", \"alto_sodio\"].";

  prompt += "\n\nAdemás, si el lenguaje del usuario sugiere una PREFERENCIA ESTABLE (NO una instrucción puntual), emite un campo 'profileHints'. Ejemplos de preferencia estable: 'odio el cilantro', 'nunca le pongo', 'me encanta el ajo', 'en mi airfryer'. Instrucciones puntuales que NO generan hint: 'hoy sin horno', 'esta vez sin cebolla', 'no tengo tomate'. Ante la duda, NO emitas el hint. Formato: [{ \"type\": \"disliked_ingredient\"|\"loved_ingredient\"|\"equipment\"|\"possible_allergy\", \"value\": \"nombre\", \"evidence\": \"frase del usuario\" }]. Máximo 1 hint.";

  return prompt;
}

async function validateAndRetry(
  content: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): Promise<GeneratedRecipe> {
  try {
    const parsed = JSON.parse(content);
    return generatedRecipeSchema.parse(parsed);
  } catch {
    const retry = await deepseek.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      messages: [
        ...messages,
        {
          role: "user",
          content:
            "Tu respuesta anterior no fue un JSON válido con la estructura requerida. Responde ÚNICAMENTE con el JSON, sin texto adicional.",
        },
      ],
      response_format: { type: "json_object" },
    });

    const retryContent = retry.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(retryContent);
    return generatedRecipeSchema.parse(parsed);
  }
}

async function lazyCleanupDrafts() {
  const count = await prisma.generationDraft.count();
  if (count >= 10) {
    const toDelete = await prisma.generationDraft.findMany({
      orderBy: { createdAt: "asc" },
      take: count - 9,
      select: { id: true },
    });
    await prisma.generationDraft.deleteMany({
      where: { id: { in: toDelete.map((d) => d.id) } },
    });
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  await prisma.generationDraft.deleteMany({
    where: { createdAt: { lt: ninetyDaysAgo } },
  });
}

export async function generateRecipe(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): Promise<GeneratedRecipe & { draftId: string }> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: "main" },
  });

  const rawProfile = profile ?? {
    allergies: [],
    restrictions: [],
    dislikedIngredients: [],
    lovedIngredients: [],
    equipment: [],
    defaultServings: 2,
  };

  const systemMessage = {
    role: "system" as const,
    content: buildSystemPrompt(
      rawProfile,
    ),
  };

  const fullMessages = [systemMessage, ...messages];

  const response = await deepseek.chat.completions.create({
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
    messages: fullMessages,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const recipe = await validateAndRetry(content, fullMessages);

  await prisma.aiGeneration.create({
    data: {
      provider: "deepseek",
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
    },
  });

  await lazyCleanupDrafts();

  const lastUserMessage = messages
    .filter((m) => m.role === "user")
    .pop();

  const draft = await prisma.generationDraft.create({
    data: {
      prompt: lastUserMessage?.content ?? "",
      recipeJson: JSON.parse(JSON.stringify(recipe)),
    },
  });

  return { ...recipe, draftId: draft.id };
}

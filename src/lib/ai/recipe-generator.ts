import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import {
  generatedRecipeSchema,
  type GeneratedRecipe,
} from "@/types/schemas";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1",
});

function buildSystemPrompt(profile: {
  allergies: string[];
  restrictions: string[];
  dislikedIngredients: string[];
  lovedIngredients: string[];
  equipment: string[];
  defaultServings: number;
}) {
  return `Eres un chef experto. Genera UNA receta basada en la conversación con el usuario.
Si el usuario pide ajustes a una receta anterior, devuelve la receta COMPLETA corregida.

Perfil del usuario (respétalo SIEMPRE, sin que lo repita):
- Alergias: ${profile.allergies.join(", ") || "ninguna"} — NUNCA incluir estos ingredientes
- Restricciones: ${profile.restrictions.join(", ") || "ninguna"}
- Odia: ${profile.dislikedIngredients.join(", ") || "ninguno"} — evitarlos
- Ama: ${profile.lovedIngredients.join(", ") || "ninguno"} — favorecerlos cuando tenga sentido
- Equipo disponible: ${profile.equipment.join(", ") || "utensilios básicos"} — solo proponer técnicas posibles con este equipo
- Porciones por defecto si no especifica: ${profile.defaultServings}

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta, sin texto adicional:
{
  "title": "string",
  "description": "string breve y apetitosa (1-2 frases)",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "tags": ["string"],
  "ingredients": [
    {
      "name": "string en minúsculas y singular",
      "quantity": number | null,
      "unit": "string o null",
      "quantityText": "string o null",
      "note": "string o null"
    }
  ],
  "steps": ["string"]
}
Usa ingredientes comunes en Latinoamérica y unidades métricas o caseras.`;
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

  const systemMessage = {
    role: "system" as const,
    content: buildSystemPrompt(
      profile ?? {
        allergies: [],
        restrictions: [],
        dislikedIngredients: [],
        lovedIngredients: [],
        equipment: [],
        defaultServings: 2,
      },
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

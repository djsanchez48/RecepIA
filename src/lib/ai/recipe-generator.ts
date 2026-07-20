import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { generatedRecipeSchema, type GeneratedRecipe } from "@/types/schemas";
import { translations } from "@/lib/i18n";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1",
});

interface MemoryProfileData {
  ingredients?: Record<string, { score: number; count: number }>;
  tags?: Record<string, { score: number; count: number }>;
  badges?: Record<string, { score: number; count: number }>;
}

function buildMemoryBlock(memoryProfile: MemoryProfileData | undefined, lang: "es" | "en" = "es"): string {
  if (!memoryProfile) return "";

  const topIngredients = Object.entries(memoryProfile.ingredients ?? {})
    .filter(([, d]) => d.score > 0 && d.count >= 2)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 5)
    .map(([name, d]) => `${name} (${d.count} recetas)`);

  const topStyles = [
    ...Object.entries(memoryProfile.tags ?? {}),
    ...Object.entries(memoryProfile.badges ?? {}),
  ]
    .filter(([, d]) => d.score > 0 && d.count >= 2)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 3)
    .map(([name]) => name);

  if (topIngredients.length === 0 && topStyles.length === 0) return "";

  const parts: string[] = [];

  if (topIngredients.length > 0) {
    parts.push(
      lang === "es"
        ? `Ingredientes que más usás: ${topIngredients.join(", ")}.`
        : `Most used ingredients: ${topIngredients.join(", ")}.`,
    );
  }

  if (topStyles.length > 0) {
    parts.push(
      lang === "es"
        ? `Estilos y preferencias frecuentes: ${topStyles.join(", ")}.`
        : `Frequent styles and preferences: ${topStyles.join(", ")}.`,
    );
  }

  const guidance = lang === "es"
    ? "\nUsá esta información para orientar las recetas, pero no la trates como una restricción obligatoria."
    : "\nUse this information to guide recipes, but do not treat it as a mandatory restriction.";

  const header = lang === "es"
    ? "\n\nSegún tu historial en Fulse, estos son tus ingredientes y estilos más frecuentes (orientativo, no restrictivo):"
    : "\n\nBased on your Fulse history, these are your most frequent ingredients and styles (advisory, not restrictive):";

  return `${header}\n${parts.join("\n")}${guidance}`;
}

function buildSystemPrompt(
  profile: {
    allergies: string[];
    restrictions: string[];
    dislikedIngredients: string[];
    lovedIngredients: string[];
    equipment: string[];
    defaultServings: number;
    goals?: string[];
    memoryProfile?: MemoryProfileData;
    knowledgeProfile?: string | null;
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

  prompt += buildMemoryBlock(profile.memoryProfile, lang);

  if (profile.knowledgeProfile && profile.knowledgeProfile.trim().length > 0) {
    prompt += `\n\nConocimiento del usuario (contexto valioso sobre sus hábitos, entrenamiento y preferencias):\n${profile.knowledgeProfile.trim()}\n\nUsá este conocimiento para adaptar las recetas al contexto del usuario (hora del día, si entrenó, ingredientes disponibles, etc.), pero no lo cites textualmente ni lo menciones explícitamente en la respuesta.`;
  }

  prompt += "\n\nIncluye en tu JSON un campo 'nutrition' con { caloriesPerServing, proteinG, carbsG, fatG } estimados por porción, y un campo 'nutriBadges' con etiquetas del catálogo: [\"alta_proteina\", \"ligera\", \"buena_fibra\", \"dulce\", \"contundente\", \"alta_fibra\", \"baja_azucar\", \"alto_sodio\"].";

  prompt += "\n\nAdemás, si el usuario menciona EXPLÍCITAMENTE una PREFERENCIA ESTABLE y PERMANENTE (NO una instrucción puntual), emite un campo 'profileHints'. Es CRÍTICO que NO inventes ni asumas nada. Reglas ESTRICTAS:\n- Solo emite hint si el usuario DICE TEXTUALMENTE cosas como 'odio X', 'nunca como X', 'me encanta X', 'siempre cocino en mi Y'.\n- NUNCA emitas 'possible_allergy' a menos que el usuario DIGA EXPLÍCITAMENTE 'soy alérgico/a a X' o 'no puedo comer X porque me hace mal'. No infieras alergias.\n- Instrucciones PUNTUALES que NO generan hint: 'hoy sin horno', 'esta vez sin cebolla', 'no tengo tomate', 'son las 10pm', 'algo rápido', 'para 3 personas'.\n- Ante la MÍNIMA duda, NO emitas el hint. Es mejor no emitir nada que equivocarte.\n- Máximo 1 hint. Formato: [{ \"type\": \"disliked_ingredient\"|\"loved_ingredient\"|\"equipment\"|\"possible_allergy\", \"value\": \"nombre\", \"evidence\": \"frase textual del usuario\" }].";

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

  const memoryProfile = profile?.memoryEnabled
    ? (profile.memoryProfile as MemoryProfileData | undefined)
    : undefined;

  const systemMessage = {
    role: "system" as const,
    content: buildSystemPrompt(
      { ...rawProfile, memoryProfile, knowledgeProfile: profile?.knowledgeProfile },
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

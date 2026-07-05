import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { parsedRecipeResultSchema, type ParsedRecipeResult } from "@/types/schemas";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1",
});

const SYSTEM_PROMPT = `Eres un extractor de recetas. Recibirás un texto pegado por el usuario que probablemente
contiene una receta (de un chat, blog, mensaje o notas).

Tu trabajo es ESTRUCTURAR, nunca inventar ni mejorar:
- Extrae título, descripción, tiempos, porciones, ingredientes y pasos EXACTAMENTE como
  aparecen en el texto. No agregues ingredientes ni pasos que no estén.
- Si un dato no está en el texto (ej: tiempos, porciones), déjalo en null y repórtalo
  en "warnings".
- Ignora el ruido que no es parte de la receta: saludos, comentarios, anuncios,
  texto de navegación de páginas web.
- Los nombres de ingredientes van en minúsculas y singular para el catálogo, pero las
  cantidades y unidades se respetan tal cual ("1 pocillo" no se convierte a tazas).
- Cantidades numéricas van en "quantity" + "unit"; expresiones no medibles
  ("al gusto", "una pizca") van en "quantityText".
- Si el texto está en otro idioma, traduce al español manteniendo fidelidad total.
- Si el texto NO contiene una receta, responde isRecipe: false con recipe: null y explica por qué en warnings.
- Si el texto contiene VARIAS recetas claramente separadas, extrae solo la primera y
  agrega un warning: "Detecté N recetas, importé la primera".

Responde ÚNICAMENTE con JSON válido:
{
  "isRecipe": boolean,
  "confidence": "high" | "medium" | "low",
  "recipe": { "title": "string", "description": string | null, "prepTimeMinutes": number | null, "cookTimeMinutes": number | null, "servings": number | null, "tags": ["string"], "ingredients": [{ "name": "string", "quantity": number | null, "unit": "string | null", "quantityText": "string | null", "note": "string | null" }], "steps": ["string"] } | null,
  "warnings": ["string"]
}`;

async function validateAndRetry(
  content: string,
): Promise<ParsedRecipeResult> {
  try {
    const parsed = JSON.parse(content);
    return parsedRecipeResultSchema.parse(parsed);
  } catch {
    const retry = await deepseek.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "Tu respuesta anterior no fue un JSON válido. Responde ÚNICAMENTE con el JSON, sin texto adicional." },
      ],
      response_format: { type: "json_object" },
    });

    const retryContent = retry.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(retryContent);
    return parsedRecipeResultSchema.parse(parsed);
  }
}

export async function parseRecipe(text: string): Promise<ParsedRecipeResult> {
  const response = await deepseek.chat.completions.create({
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text.slice(0, 15000) },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const result = await validateAndRetry(content);

  await prisma.aiGeneration.create({
    data: {
      provider: "deepseek",
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
    },
  });

  return result;
}

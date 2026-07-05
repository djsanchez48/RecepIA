import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseRecipe } from "@/lib/ai/recipe-parser";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "Se requiere una imagen en base64" },
        { status: 400 },
      );
    }

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_VISION_MODEL ?? "claude-3-haiku-20240307",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: "Extract ALL the text from this recipe image exactly as it appears. Include every ingredient, measurement, step, instruction, title, servings, and cooking times. Return ONLY the extracted text, no additional commentary.",
            },
          ],
        },
      ],
    });

    const extractedText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { text: string }).text)
      .join("\n")
      .trim();

    if (!extractedText) {
      return NextResponse.json({
        isRecipe: false,
        confidence: "low" as const,
        recipe: null,
        warnings: ["No se pudo extraer texto de la imagen"],
      });
    }

    const result = await parseRecipe(extractedText);
    return NextResponse.json(result);
  } catch (error) {
    console.error("OCR recipe error:", error);
    return NextResponse.json(
      { error: "Error al procesar la imagen" },
      { status: 500 },
    );
  }
}

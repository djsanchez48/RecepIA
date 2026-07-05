import { NextRequest, NextResponse } from "next/server";
import { generateRecipe } from "@/lib/ai/recipe-generator";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de mensajes" },
        { status: 400 },
      );
    }

    const recipe = await generateRecipe(messages);
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Error al generar la receta" },
      { status: 500 },
    );
  }
}

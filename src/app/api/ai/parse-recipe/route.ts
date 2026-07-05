import { NextRequest, NextResponse } from "next/server";
import { parseRecipe } from "@/lib/ai/recipe-parser";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Se requiere el texto de la receta" },
        { status: 400 },
      );
    }

    if (text.length > 15000) {
      return NextResponse.json(
        { error: "El texto es demasiado largo (máx. 15.000 caracteres)" },
        { status: 400 },
      );
    }

    const result = await parseRecipe(text);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Parse recipe error:", error);
    return NextResponse.json(
      { error: "Error al procesar la receta" },
      { status: 500 },
    );
  }
}

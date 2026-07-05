import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { recipes: true } },
      },
    });

    return NextResponse.json(ingredients);
  } catch (error) {
    console.error("Ingredients error:", error);
    return NextResponse.json(
      { error: "Error al obtener ingredientes" },
      { status: 500 },
    );
  }
}

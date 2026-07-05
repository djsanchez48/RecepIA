import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: { include: { ingredient: true } },
        collections: { include: { collection: true } },
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Get recipe error:", error);
    return NextResponse.json(
      { error: "Error al obtener la receta" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, steps, prepTimeMinutes, cookTimeMinutes, servings, tags, collectionIds } = body;

    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 },
      );
    }

    if (collectionIds !== undefined) {
      await prisma.recipeCollection.deleteMany({ where: { recipeId: id } });
      if (collectionIds.length > 0) {
        await prisma.recipeCollection.createMany({
          data: collectionIds.map((collectionId: string) => ({
            recipeId: id,
            collectionId,
          })),
        });
      }
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(steps !== undefined && { steps }),
        ...(prepTimeMinutes !== undefined && { prepTimeMinutes }),
        ...(cookTimeMinutes !== undefined && { cookTimeMinutes }),
        ...(servings !== undefined && { servings }),
        ...(tags !== undefined && { tags }),
      },
      include: {
        ingredients: { include: { ingredient: true } },
        collections: { include: { collection: true } },
      },
    });

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Update recipe error:", error);
    return NextResponse.json(
      { error: "Error al actualizar la receta" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 },
      );
    }

    await prisma.recipe.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete recipe error:", error);
    return NextResponse.json(
      { error: "Error al eliminar la receta" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractEventPayloads, trackEvents } from "@/lib/insights/track";

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

    const existing = await prisma.recipe.findUnique({
      where: { id },
      include: { ingredients: { include: { ingredient: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 },
      );
    }

    if (collectionIds !== undefined) {
      const existingCollections = await prisma.recipeCollection.findMany({
        where: { recipeId: id },
        select: { collectionId: true },
      });
      const existingIds = existingCollections.map((c) => c.collectionId);
      const newIds = (collectionIds as string[]).filter((cid) => !existingIds.includes(cid));

      await prisma.recipeCollection.deleteMany({ where: { recipeId: id } });
      if (collectionIds.length > 0) {
        await prisma.recipeCollection.createMany({
          data: (collectionIds as string[]).map((collectionId: string) => ({
            recipeId: id,
            collectionId,
          })),
        });
      }

      if (newIds.length > 0) {
        const collectedEvents = extractEventPayloads(
          "recipe_collected",
          {
            ingredients: existing.ingredients.map((ri) => ({ name: ri.ingredient.name })),
            tags: existing.tags,
            badges: existing.nutriBadges,
          },
          1,
          id,
        );
        trackEvents(collectedEvents).catch((err) => console.error("trackEvents error:", err));
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

    const existing = await prisma.recipe.findUnique({
      where: { id },
      include: { ingredients: { include: { ingredient: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 },
      );
    }

    await prisma.recipe.delete({ where: { id } });

    const deleteEvents = extractEventPayloads(
      "recipe_deleted",
      {
        ingredients: existing.ingredients.map((ri) => ({ name: ri.ingredient.name })),
        tags: existing.tags,
        badges: existing.nutriBadges,
      },
      -2,
      id,
    );
    trackEvents(deleteEvents).catch((err) => console.error("trackEvents error:", err));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete recipe error:", error);
    return NextResponse.json(
      { error: "Error al eliminar la receta" },
      { status: 500 },
    );
  }
}

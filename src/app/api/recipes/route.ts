import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractEventPayloads, trackEvents } from "@/lib/insights/track";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      steps,
      prepTimeMinutes,
      cookTimeMinutes,
      servings,
      tags,
      ingredients,
      collectionIds,
      draftId,
      source,
      nutrition,
      nutriBadges,
    } = body;

    if (!title || !steps || !ingredients) {
      return NextResponse.json(
        { error: "Título, pasos e ingredientes son obligatorios" },
        { status: 400 },
      );
    }

    const ingredientData = await Promise.all(
      ingredients.map(async (ing: { name: string; quantity?: number | null; unit?: string | null; quantityText?: string | null; note?: string | null }) => {
        const normalizedName = ing.name.trim().toLowerCase();

        const ingredient = await prisma.ingredient.upsert({
          where: { name: normalizedName },
          update: {},
          create: { name: normalizedName },
        });

        return {
          ingredientId: ingredient.id,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          quantityText: ing.quantityText ?? null,
          note: ing.note ?? null,
        };
      }),
    );

    const recipe = await prisma.recipe.create({
      data: {
        title,
        description: description ?? null,
        steps,
        prepTimeMinutes: prepTimeMinutes ?? null,
        cookTimeMinutes: cookTimeMinutes ?? null,
        servings: servings ?? null,
        tags: tags ?? [],
        source: source ?? "ai",
        caloriesPerServing: nutrition?.caloriesPerServing ?? null,
        proteinG: nutrition?.proteinG ?? null,
        carbsG: nutrition?.carbsG ?? null,
        fatG: nutrition?.fatG ?? null,
        nutriBadges: nutriBadges ?? [],
        nutriAnalyzedAt: nutrition ? new Date() : null,
        ingredients: {
          create: ingredientData,
        },
        collections: collectionIds?.length
          ? {
              create: collectionIds.map((collectionId: string) => ({
                collectionId,
              })),
            }
          : undefined,
      },
      include: {
        ingredients: { include: { ingredient: true } },
        collections: { include: { collection: true } },
      },
    });

    if (draftId) {
      await prisma.generationDraft.delete({ where: { id: draftId } }).catch(() => {});
    }

    const savedEvents = extractEventPayloads(
      "recipe_saved",
      {
        ingredients: ingredients as { name: string }[],
        tags: tags as string[] | undefined,
        badges: nutriBadges as string[] | undefined,
      },
      2,
      recipe.id,
    );

    if (collectionIds?.length) {
      const collectedEvents = extractEventPayloads(
        "recipe_collected",
        {
          ingredients: ingredients as { name: string }[],
          tags: tags as string[] | undefined,
          badges: nutriBadges as string[] | undefined,
        },
        1,
        recipe.id,
      );
      savedEvents.push(...collectedEvents);
    }

    trackEvents(savedEvents).catch((err) => console.error("trackEvents error:", err));

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Create recipe error:", error);
    return NextResponse.json(
      { error: "Error al guardar la receta" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const ingredientsFilter = searchParams.get("ingredients");
    const maxTime = searchParams.get("maxTime");
    const collection = searchParams.get("collection");
    const tag = searchParams.get("tag");

    const where: Record<string, unknown> = {};

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (collection) {
      where.collections = { some: { collectionId: collection } };
    }

    if (maxTime) {
      where.AND = [
        { prepTimeMinutes: { not: null } },
        { cookTimeMinutes: { not: null } },
        {
          OR: [
            {
              AND: [
                { prepTimeMinutes: { lte: parseInt(maxTime, 10) } },
                { cookTimeMinutes: { lte: parseInt(maxTime, 10) } },
              ],
            },
          ],
        },
      ];
    }

    let recipeIds: string[] | undefined;
    if (ingredientsFilter) {
      const names = ingredientsFilter.split(",").map((n) => n.trim().toLowerCase());
      const matchingRecipes = await prisma.recipeIngredient.findMany({
        where: {
          ingredient: { name: { in: names } },
        },
        select: { recipeId: true },
        distinct: ["recipeId"],
      });

      recipeIds = matchingRecipes.map((r) => r.recipeId);

      if (recipeIds.length > 0) {
        if (names.length > 1) {
          const withAll = await prisma.recipeIngredient.groupBy({
            by: ["recipeId"],
            where: {
              recipeId: { in: recipeIds },
              ingredient: { name: { in: names } },
            },
            _count: { ingredientId: true },
            having: { ingredientId: { _count: { gte: names.length } } },
          });
          recipeIds = withAll.map((r) => r.recipeId);
        }
        where.id = { in: recipeIds };
      } else {
        where.id = { in: [] };
      }
    }

    const recipes = await prisma.recipe.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        ingredients: { include: { ingredient: true } },
        collections: { include: { collection: true } },
      },
    });

    return NextResponse.json(recipes);
  } catch (error) {
    console.error("List recipes error:", error);
    return NextResponse.json(
      { error: "Error al listar recetas" },
      { status: 500 },
    );
  }
}

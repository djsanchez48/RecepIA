import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractEventPayloads, trackEvents } from "@/lib/insights/track";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const draft = await prisma.generationDraft.findUnique({ where: { id } });

    await prisma.generationDraft.delete({
      where: { id },
    });

    if (draft) {
      const recipe = draft.recipeJson as Record<string, unknown>;
      const tags = (recipe.tags as string[]) ?? [];
      const nutriBadges = (recipe.nutriBadges as string[]) ?? [];
      const ingredients = ((recipe.ingredients as Array<{ name: string } | string>) ?? [])
        .map((i) => (typeof i === "string" ? { name: i } : i));

      const discardEvents = extractEventPayloads(
        "draft_discarded",
        { ingredients, tags, badges: nutriBadges },
        -1,
      );
      trackEvents(discardEvents).catch((err) => console.error("trackEvents error:", err));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete draft error:", error);
    return NextResponse.json(
      { error: "Error al eliminar el borrador" },
      { status: 500 },
    );
  }
}

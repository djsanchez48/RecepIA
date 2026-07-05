import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const drafts = await prisma.generationDraft.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json(drafts);
  } catch (error) {
    console.error("Drafts error:", error);
    return NextResponse.json(
      { error: "Error al obtener borradores" },
      { status: 500 },
    );
  }
}

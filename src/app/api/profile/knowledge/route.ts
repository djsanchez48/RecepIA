import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: "main" },
      select: { knowledgeProfile: true },
    });

    return NextResponse.json({ knowledgeProfile: profile?.knowledgeProfile ?? "" });
  } catch (error) {
    console.error("Get knowledge error:", error);
    return NextResponse.json({ error: "Error al obtener el conocimiento" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { knowledgeProfile } = await req.json();

    if (typeof knowledgeProfile !== "string") {
      return NextResponse.json({ error: "Se requiere un texto" }, { status: 400 });
    }

    await prisma.userProfile.upsert({
      where: { id: "main" },
      update: { knowledgeProfile },
      create: { id: "main", knowledgeProfile },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update knowledge error:", error);
    return NextResponse.json({ error: "Error al guardar el conocimiento" }, { status: 500 });
  }
}

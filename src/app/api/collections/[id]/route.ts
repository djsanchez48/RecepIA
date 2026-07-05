import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { name, emoji } = await req.json();

    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Colección no encontrada" },
        { status: 404 },
      );
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(emoji !== undefined && { emoji }),
      },
      include: { _count: { select: { recipes: true } } },
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Update collection error:", error);
    return NextResponse.json(
      { error: "Error al actualizar la colección" },
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

    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Colección no encontrada" },
        { status: 404 },
      );
    }

    await prisma.collection.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete collection error:", error);
    return NextResponse.json(
      { error: "Error al eliminar la colección" },
      { status: 500 },
    );
  }
}

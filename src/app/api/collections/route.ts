import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { recipes: true } },
      },
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error("Collections error:", error);
    return NextResponse.json(
      { error: "Error al obtener colecciones" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, emoji } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 },
      );
    }

    const existing = await prisma.collection.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una colección con ese nombre" },
        { status: 409 },
      );
    }

    const collection = await prisma.collection.create({
      data: { name, emoji: emoji ?? null },
      include: { _count: { select: { recipes: true } } },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error("Create collection error:", error);
    return NextResponse.json(
      { error: "Error al crear la colección" },
      { status: 500 },
    );
  }
}

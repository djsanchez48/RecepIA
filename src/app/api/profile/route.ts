import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let profile = await prisma.userProfile.findUnique({
      where: { id: "main" },
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          id: "main",
          allergies: [],
          restrictions: [],
          dislikedIngredients: [],
          lovedIngredients: [],
          equipment: [],
          defaultServings: 2,
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { error: "Error al obtener el perfil" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      allergies,
      restrictions,
      dislikedIngredients,
      lovedIngredients,
      equipment,
      defaultServings,
    } = body;

    const profile = await prisma.userProfile.upsert({
      where: { id: "main" },
      update: {
        ...(allergies !== undefined && { allergies }),
        ...(restrictions !== undefined && { restrictions }),
        ...(dislikedIngredients !== undefined && { dislikedIngredients }),
        ...(lovedIngredients !== undefined && { lovedIngredients }),
        ...(equipment !== undefined && { equipment }),
        ...(defaultServings !== undefined && { defaultServings }),
      },
      create: {
        id: "main",
        allergies: allergies ?? [],
        restrictions: restrictions ?? [],
        dislikedIngredients: dislikedIngredients ?? [],
        lovedIngredients: lovedIngredients ?? [],
        equipment: equipment ?? [],
        defaultServings: defaultServings ?? 2,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Error al actualizar el perfil" },
      { status: 500 },
    );
  }
}

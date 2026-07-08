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
      allergies, restrictions, dislikedIngredients, lovedIngredients,
      equipment, defaultServings, goals, goalsActive,
      age, weightKg, heightCm, activityLevel, biologicalSex, healthDataConsent,
      onboardingCompletedAt, rejectedHints, memoryEnabled,
    } = body;

    const existing = await prisma.userProfile.findUnique({ where: { id: "main" } });
    const hasBodyData = age != null || weightKg != null || heightCm != null ||
      activityLevel != null || biologicalSex != null;

    if (hasBodyData && !existing?.healthDataConsentAt && !healthDataConsent) {
      return NextResponse.json(
        { error: "Se requiere consentimiento para guardar datos personales" },
        { status: 403 },
      );
    }

    const profile = await prisma.userProfile.upsert({
      where: { id: "main" },
      update: {
        ...(allergies !== undefined && { allergies }),
        ...(restrictions !== undefined && { restrictions }),
        ...(dislikedIngredients !== undefined && { dislikedIngredients }),
        ...(lovedIngredients !== undefined && { lovedIngredients }),
        ...(equipment !== undefined && { equipment }),
        ...(defaultServings !== undefined && { defaultServings }),
        ...(goals !== undefined && { goals }),
        ...(goalsActive !== undefined && { goalsActive }),
        ...(age !== undefined && { age }),
        ...(weightKg !== undefined && { weightKg }),
        ...(heightCm !== undefined && { heightCm }),
        ...(activityLevel !== undefined && { activityLevel }),
        ...(biologicalSex !== undefined && { biologicalSex }),
        ...(healthDataConsent === true && !existing?.healthDataConsentAt
          ? { healthDataConsentAt: new Date() } : {}),
        ...(onboardingCompletedAt !== undefined && { onboardingCompletedAt: new Date(onboardingCompletedAt as string) }),
        ...(rejectedHints !== undefined && { rejectedHints }),
        ...(memoryEnabled !== undefined && { memoryEnabled }),
      },
      create: {
        id: "main",
        allergies: allergies ?? [],
        restrictions: restrictions ?? [],
        dislikedIngredients: dislikedIngredients ?? [],
        lovedIngredients: lovedIngredients ?? [],
        equipment: equipment ?? [],
        defaultServings: defaultServings ?? 2,
        goals: goals ?? [],
        goalsActive: goalsActive ?? true,
        rejectedHints: rejectedHints ?? [],
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

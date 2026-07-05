import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL!;

const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.userProfile.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      allergies: [],
      restrictions: [],
      dislikedIngredients: [],
      lovedIngredients: [],
      equipment: [],
      defaultServings: 2,
    },
  });
  console.log("  ✓ UserProfile");

  await prisma.collection.upsert({
    where: { name: "⭐ Favoritas" },
    update: {},
    create: { name: "⭐ Favoritas", emoji: "⭐" },
  });
  console.log("  ✓ Collection: ⭐ Favoritas");

  const existing = await prisma.recipe.count();
  if (existing === 0) {
    const pasta = await prisma.recipe.create({
      data: {
        title: "Pasta al pesto con tomates cherry",
        description: "Una pasta rápida y fresca con pesto casero y tomates cherry asados.",
        steps: [
          "Cocinar la pasta en agua con sal hasta que esté al dente. Reservar 1 taza del agua de cocción.",
          "En una sartén, saltear los tomates cherry partidos por la mitad con un poco de aceite de oliva hasta que se ablanden.",
          "Mezclar la pasta escurrida con el pesto, agregando agua de cocción de a poco hasta lograr una salsa cremosa.",
          "Servir con los tomates cherry por encima y queso parmesano rallado.",
        ],
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        tags: ["rápido", "italiana", "vegetariano"],
        source: "manual",
        ingredients: {
          create: [
            {
              ingredient: {
                connectOrCreate: { where: { name: "espagueti" }, create: { name: "espagueti" } },
              },
              quantity: 200,
              unit: "g",
            },
            {
              ingredient: {
                connectOrCreate: { where: { name: "pesto" }, create: { name: "pesto" } },
              },
              quantity: 4,
              unit: "cucharadas",
            },
            {
              ingredient: {
                connectOrCreate: { where: { name: "tomate cherry" }, create: { name: "tomate cherry" } },
              },
              quantity: 200,
              unit: "g",
            },
            {
              ingredient: {
                connectOrCreate: { where: { name: "queso parmesano" }, create: { name: "queso parmesano" } },
              },
              quantity: 30,
              unit: "g",
            },
            {
              ingredient: {
                connectOrCreate: { where: { name: "aceite de oliva" }, create: { name: "aceite de oliva" } },
              },
              quantity: 2,
              unit: "cucharadas",
            },
            {
              ingredient: {
                connectOrCreate: { where: { name: "sal" }, create: { name: "sal" } },
              },
              quantityText: "al gusto",
            },
          ],
        },
      },
    });
    console.log(`  ✓ Recipe: ${pasta.title}`);

    const arroz = await prisma.recipe.create({
      data: {
        title: "Arroz con pollo colombiano",
        description: "Clásico arroz con pollo jugoso, lleno de verduras y sabor latino.",
        steps: [
          "Sazonar el pollo con sal, comino y ajo en polvo. Dorar en aceite por ambos lados. Retirar y reservar.",
          "En la misma olla, sofreír cebolla, pimentón y ajo picados hasta que estén transparentes.",
          "Agregar el arroz y revolver por 2 minutos. Incorporar el caldo de pollo, la zanahoria rallada y las arvejas.",
          "Devolver el pollo a la olla, tapar y cocinar a fuego bajo por 20-25 minutos hasta que el arroz esté listo.",
        ],
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        servings: 4,
        tags: ["colombiana", "almuerzo", "pollo"],
        source: "manual",
        ingredients: {
          create: [
            {
              ingredient: {
                connectOrCreate: { where: { name: "pollo" }, create: { name: "pollo" } },
              },
              quantity: 4,
              unit: "piezas",
              note: "muslos o pechugas",
            },
            {
              ingredient: {
                connectOrCreate: { where: { name: "arroz" }, create: { name: "arroz" } },
              },
              quantity: 2,
              unit: "tazas",
            },
            {
              ingredient: {
                connectOrCreate: { where: { name: "cebolla" }, create: { name: "cebolla" } },
              },
              quantity: 1,
              unit: "unidad",
              note: "picada fina",
            },
            {
              ingredient: {
                connectOrCreate: { where: { name: "pimentón" }, create: { name: "pimentón" } },
              },
              quantity: 1,
              unit: "unidad",
              note: "picado en cubos",
            },
            {
              ingredient: {
                connectOrCreate: { where: { name: "zanahoria" }, create: { name: "zanahoria" } },
              },
              quantity: 1,
              unit: "unidad",
              note: "rallada",
            },
            {
              ingredient: {
                connectOrCreate: { where: { name: "arveja" }, create: { name: "arveja" } },
              },
              quantity: 100,
              unit: "g",
            },
            {
              ingredient: {
                connectOrCreate: { where: { name: "caldo de pollo" }, create: { name: "caldo de pollo" } },
              },
              quantity: 4,
              unit: "tazas",
            },
            {
              ingredient: {
                connectOrCreate: { where: { name: "comino" }, create: { name: "comino" } },
              },
              quantityText: "al gusto",
            },
            {
              ingredient: {
                connectOrCreate: { where: { name: "ajo en polvo" }, create: { name: "ajo en polvo" } },
              },
              quantityText: "al gusto",
            },
          ],
        },
      },
    });
    console.log(`  ✓ Recipe: ${arroz.title}`);
  } else {
    console.log(`  ⏭  Skipping recipes: ${existing} already exist`);
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

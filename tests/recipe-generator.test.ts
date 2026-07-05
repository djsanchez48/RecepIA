import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockDeepseekCreate,
  mockPrismaCreate,
  mockPrismaFindUnique,
  mockPrismaDeleteMany,
  mockPrismaFindMany,
  mockPrismaCount,
} = vi.hoisted(() => ({
  mockDeepseekCreate: vi.fn(),
  mockPrismaCreate: vi.fn(),
  mockPrismaFindUnique: vi.fn(),
  mockPrismaDeleteMany: vi.fn(),
  mockPrismaFindMany: vi.fn(),
  mockPrismaCount: vi.fn(),
}));

vi.mock("openai", () => {
  function MockOpenAI() {
    // @ts-expect-error mock
    this.chat = { completions: { create: mockDeepseekCreate } };
  }
  return { default: MockOpenAI, __esModule: true };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userProfile: { findUnique: mockPrismaFindUnique },
    generationDraft: {
      count: mockPrismaCount,
      create: mockPrismaCreate,
      findMany: mockPrismaFindMany,
      deleteMany: mockPrismaDeleteMany,
    },
    aiGeneration: { create: mockPrismaCreate },
  },
}));

import { generateRecipe } from "@/lib/ai/recipe-generator";

const baseRecipe = {
  title: "Test",
  description: "d",
  prepTimeMinutes: 5,
  cookTimeMinutes: 5,
  servings: 1,
  tags: [],
  ingredients: [{ name: "a", quantity: 1, unit: "g", quantityText: null, note: null }],
  steps: ["s"],
};

function mockSuccess(recipe = baseRecipe) {
  mockDeepseekCreate.mockResolvedValue({
    choices: [{ message: { content: JSON.stringify(recipe) } }],
    usage: { prompt_tokens: 10, completion_tokens: 5 },
  });
  mockPrismaCreate.mockImplementation((args: { data: unknown }) => ({
    id: "mock-draft-id",
    ...(args.data as Record<string, unknown>),
  }));
}

describe("recipe-generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaFindUnique.mockResolvedValue({
      id: "main",
      allergies: ["maní"],
      restrictions: ["sin gluten"],
      dislikedIngredients: ["cilantro"],
      lovedIngredients: ["ajo", "limón"],
      equipment: ["airfryer"],
      defaultServings: 3,
    });
    mockPrismaCount.mockResolvedValue(3);
    mockPrismaDeleteMany.mockResolvedValue({});
    mockPrismaFindMany.mockResolvedValue([]);
  });

  it("generates a recipe from a user message", async () => {
    mockSuccess();
    const result = await generateRecipe([{ role: "user", content: "Una pasta rápida" }]);
    expect(result.title).toBe("Test");
    expect(result.draftId).toBeDefined();

    const systemCall = mockDeepseekCreate.mock.calls[0][0];
    expect(systemCall.messages[0].content).toContain("maní");
    expect(systemCall.messages[0].content).toContain("airfryer");
  });

  it("uses default profile when none exists in DB", async () => {
    mockPrismaFindUnique.mockResolvedValue(null);
    mockSuccess();

    const result = await generateRecipe([{ role: "user", content: "test" }]);
    expect(result.title).toBe("Test");

    const systemCall = mockDeepseekCreate.mock.calls[0][0];
    expect(systemCall.messages[0].content).toContain("2");
  });

  it("sends conversation history to DeepSeek", async () => {
    mockSuccess();

    await generateRecipe([
      { role: "user", content: "Pasta" },
      { role: "assistant", content: "¿Qué tipo?" },
      { role: "user", content: "Con pesto" },
    ]);

    const systemCall = mockDeepseekCreate.mock.calls[0][0];
    expect(systemCall.messages).toHaveLength(4);
    expect(systemCall.messages[3].content).toBe("Con pesto");
  });

  it("retries once on invalid JSON", async () => {
    mockDeepseekCreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: "not json" } }],
        usage: { prompt_tokens: 10, completion_tokens: 3 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(baseRecipe) } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      });
    mockPrismaCreate.mockImplementation((args: { data: unknown }) => args.data);

    const result = await generateRecipe([{ role: "user", content: "test" }]);
    expect(result.title).toBe("Test");
    expect(mockDeepseekCreate).toHaveBeenCalledTimes(2);
  });

  it("triggers lazy cleanup when drafts exceed 10", async () => {
    mockPrismaCount.mockResolvedValue(15);
    mockPrismaFindMany.mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => ({ id: `old-${i}` })),
    );
    mockSuccess();

    await generateRecipe([{ role: "user", content: "test" }]);
    const deleteCalled = mockPrismaDeleteMany.mock.calls.some(
      (call) => call[0]?.where?.id?.in,
    );
    expect(deleteCalled).toBe(true);
  });

  it("skips cleanup when drafts under 10", async () => {
    mockPrismaCount.mockResolvedValue(3);
    mockSuccess();

    await generateRecipe([{ role: "user", content: "test" }]);
    const deleteCalled = mockPrismaDeleteMany.mock.calls.some(
      (call) => call[0]?.where?.id?.in,
    );
    expect(deleteCalled).toBe(false);
  });

  it("deletes old drafts (>90 days)", async () => {
    mockPrismaCount.mockResolvedValue(3);
    mockSuccess();

    await generateRecipe([{ role: "user", content: "test" }]);
    const dateDelete = mockPrismaDeleteMany.mock.calls.some(
      (call) => call[0]?.where?.createdAt?.lt !== undefined,
    );
    expect(dateDelete).toBe(true);
  });
});

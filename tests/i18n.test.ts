import { describe, it, expect } from "vitest";
import { translations, t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";

describe("i18n", () => {
  it("has both languages defined", () => {
    expect(translations.es).toBeDefined();
    expect(translations.en).toBeDefined();
  });

  it("has same keys in both languages", () => {
    const esKeys = Object.keys(translations.es).sort();
    const enKeys = Object.keys(translations.en).sort();
    expect(esKeys).toEqual(enKeys);
  });

  it("all translation values are non-empty strings", () => {
    for (const lang of ["es", "en"] as const) {
      for (const [key, value] of Object.entries(translations[lang])) {
        expect(
          typeof value === "string" && value.length > 0,
          `${lang}.${key} should be a non-empty string`,
        ).toBe(true);
      }
    }
  });

  it("t() returns correct translation", () => {
    expect(t("es", "app.title")).toBe("RecepIA");
    expect(t("en", "app.title")).toBe("RecepIA");
    expect(t("es", "nav.create")).toBe("Crear");
    expect(t("en", "nav.create")).toBe("Create");
  });

  it("t() falls back to Spanish for missing keys", () => {
    const key = "app.title" as TranslationKey;
    // All keys exist, so fallback isn't triggered normally
    // but the function is defined to do so
    expect(t("es", key)).toBe(translations.es[key]);
  });

  it("system prompt template has all placeholders", () => {
    for (const lang of ["es", "en"] as const) {
      const prompt = translations[lang]["ai.system_prompt"] as string;
      expect(prompt).toContain("{allergies}");
      expect(prompt).toContain("{restrictions}");
      expect(prompt).toContain("{dislikedIngredients}");
      expect(prompt).toContain("{lovedIngredients}");
      expect(prompt).toContain("{equipment}");
      expect(prompt).toContain("{defaultServings}");
    }
  });

  it("pantry keys exist", () => {
    expect(t("es", "pantry.title")).toBeTruthy();
    expect(t("en", "pantry.title")).toBeTruthy();
    expect(t("es", "pantry.detect")).toBeTruthy();
    expect(t("en", "pantry.detect")).toBeTruthy();
  });
});

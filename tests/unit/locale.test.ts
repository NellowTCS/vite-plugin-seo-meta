import { describe, expect, it } from "vitest";
import { languageTagToOgLocale, normalizeLanguageTag } from "../../src/locale";

describe("normalizeLanguageTag", () => {
  it("lowercases the language and uppercases the region", () => {
    expect(normalizeLanguageTag("EN-us")).toBe("en-US");
    expect(normalizeLanguageTag("de-ch")).toBe("de-CH");
  });

  it("titlecases a script subtag and keeps the region uppercase", () => {
    expect(normalizeLanguageTag("zh-hant-TW")).toBe("zh-Hant-TW");
    expect(normalizeLanguageTag("sr-cyrl-rs")).toBe("sr-Cyrl-RS");
  });

  it("accepts an underscore as the region separator", () => {
    expect(normalizeLanguageTag("en_US")).toBe("en-US");
  });

  it("keeps a numeric region and lowercases variants", () => {
    expect(normalizeLanguageTag("es-419")).toBe("es-419");
    expect(normalizeLanguageTag("sl-rozaj")).toBe("sl-rozaj");
  });

  it("preserves the x-default fallback in lowercase", () => {
    expect(normalizeLanguageTag("X-Default")).toBe("x-default");
  });

  it("returns an empty string when there is nothing usable", () => {
    expect(normalizeLanguageTag("  ")).toBe("");
    expect(normalizeLanguageTag("--")).toBe("");
  });
});

describe("languageTagToOgLocale", () => {
  it("converts a language-region tag to the underscore form", () => {
    expect(languageTagToOgLocale("en-US")).toBe("en_US");
    expect(languageTagToOgLocale("es-419")).toBe("es_419");
  });

  it("drops variant subtags and maps common scripts to a territory", () => {
    expect(languageTagToOgLocale("zh-Hant-TW")).toBe("zh_TW");
    expect(languageTagToOgLocale("zh-Hans")).toBe("zh_CN");
    expect(languageTagToOgLocale("zh-Hant")).toBe("zh_TW");
    expect(languageTagToOgLocale("sl-rozaj")).toBeUndefined();
  });

  it("returns undefined when there is no territory (bare languages aren't OG locales)", () => {
    expect(languageTagToOgLocale("fr")).toBeUndefined();
  });

  it("returns undefined for x-default and blank input", () => {
    expect(languageTagToOgLocale("x-default")).toBeUndefined();
    expect(languageTagToOgLocale(undefined)).toBeUndefined();
    expect(languageTagToOgLocale("")).toBeUndefined();
  });
});

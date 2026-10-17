import { describe, expect, it } from "vitest";
import { headElementKey, metaKey } from "../../../src/html/key";

describe("metaKey", () => {
  it("lowercases the name", () => {
    expect(metaKey("GoogleBot-News")).toBe("meta:googlebot-news");
  });

  it("qualifies the key with a media query when present", () => {
    expect(metaKey("theme-color", "(prefers-color-scheme: dark)")).toBe(
      "meta:theme-color:(prefers-color-scheme: dark)",
    );
  });
});

describe("headElementKey", () => {
  const attrs = (values: Record<string, string | undefined>) => (name: string) => values[name];

  it("matches metaKey for media-qualified metas", () => {
    expect(
      headElementKey("meta", attrs({ name: "theme-color", media: "(prefers-color-scheme: dark)" })),
    ).toBe("meta:theme-color:(prefers-color-scheme: dark)");
  });

  it("keeps media-less metas keyed by name", () => {
    expect(headElementKey("meta", attrs({ name: "theme-color" }))).toBe("meta:theme-color");
  });
});

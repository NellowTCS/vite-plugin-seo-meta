import { describe, expect, it } from "vitest";
import { headElementKey, linkKey, metaKey } from "../../../src/html/key";

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

describe("linkKey", () => {
  it("keeps sizes in the key", () => {
    expect(linkKey("apple-touch-icon", undefined, "152x152")).toBe(
      "link:apple-touch-icon:152x152",
    );
    expect(linkKey("apple-touch-icon", undefined, "180x180")).toBe(
      "link:apple-touch-icon:180x180",
    );
  });

  it("keeps type and media in the key", () => {
    const svg = linkKey("icon", undefined, undefined, "image/svg+xml");
    const png = linkKey("icon", undefined, undefined, "image/png");
    expect(svg).not.toBe(png);
    expect(svg).toBe("link:icon:type=image/svg+xml");
    expect(
      linkKey(
        "icon",
        undefined,
        undefined,
        undefined,
        "(prefers-color-scheme: dark)",
      ),
    ).toBe("link:icon:media=(prefers-color-scheme: dark)");
  });
});

describe("headElementKey", () => {
  const attrs =
    (values: Record<string, string | undefined>) => (name: string) =>
      values[name];

  it("matches metaKey for media-qualified metas", () => {
    expect(
      headElementKey(
        "meta",
        attrs({ name: "theme-color", media: "(prefers-color-scheme: dark)" }),
      ),
    ).toBe("meta:theme-color:(prefers-color-scheme: dark)");
  });

  it("keeps media-less metas keyed by name", () => {
    expect(headElementKey("meta", attrs({ name: "theme-color" }))).toBe(
      "meta:theme-color",
    );
  });

  it("matches linkKey for icons with different types and media", () => {
    expect(
      headElementKey(
        "link",
        attrs({ rel: "icon", type: "image/svg+xml", sizes: "any" }),
      ),
    ).toBe(linkKey("icon", undefined, "any", "image/svg+xml"));
    expect(
      headElementKey(
        "link",
        attrs({ rel: "icon", media: "(prefers-color-scheme: dark)" }),
      ),
    ).toBe(
      linkKey(
        "icon",
        undefined,
        undefined,
        undefined,
        "(prefers-color-scheme: dark)",
      ),
    );
  });
});

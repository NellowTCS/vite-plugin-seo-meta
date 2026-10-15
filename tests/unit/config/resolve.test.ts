import { describe, expect, it } from "vitest";
import { defineSeoConfig } from "../../../src/config/define";
import {
  absolutize,
  mergeOptions,
  resolveOptions,
  resolveSite,
  toKeywords,
} from "../../../src/config/resolve";
import type { SeoOptions } from "../../../src/types";

describe("toKeywords", () => {
  it("splits, trims and drops empties", () => {
    expect(toKeywords("a, b, ,c")).toEqual(["a", "b", "c"]);
    expect(toKeywords([" a ", "b"])).toEqual(["a", "b"]);
    expect(toKeywords(undefined)).toEqual([]);
  });
});

// atp idk if absolutize is a real word
describe("absolutize", () => {
  it("absolutizes paths and passes undefined through", () => {
    expect(absolutize("/og.png", "https://example.com")).toBe("https://example.com/og.png");
    expect(absolutize(undefined, "https://example.com")).toBeUndefined();
  });
});

describe("resolveSite", () => {
  it("applies defaults and absolutizes paths", () => {
    const site = resolveSite({
      url: "https://example.com/",
      name: "Example",
      image: "/og.png",
      keywords: "a, b",
      twitter: "@example",
      favicon: { icon: "/favicon.ico" },
    });

    expect(site.url).toBe("https://example.com");
    expect(site.locale).toBe("en_US");
    expect(site.image).toBe("https://example.com/og.png");
    expect(site.favicon.icon).toBe("https://example.com/favicon.ico");
    expect(site.keywords).toEqual(["a", "b"]);
    expect(site.twitter).toEqual({ site: "@example" });
    expect(site.openGraph.type).toBe("website");
    expect(site.openGraph.siteName).toBe("Example");
  });

  it("throws when the url is missing or invalid", () => {
    expect(() => resolveSite({ url: "nope" })).toThrow();
  });
});

describe("mergeOptions", () => {
  it("lets inline options win while keeping file fallbacks", () => {
    const file: SeoOptions = {
      site: { url: "https://file.com", name: "File" },
      pages: { "/a": { title: "A" } },
      validate: "error",
    };
    const merged = mergeOptions(file, {
      site: { url: "https://inline.com" },
      pages: { "/b": { title: "B" } },
    });

    expect(merged.site).toEqual({ url: "https://inline.com", name: "File" });
    expect(Object.keys(merged.pages ?? {})).toEqual(["/a", "/b"]);
    expect(merged.validate).toBe("error");
  });
});

describe("resolveOptions", () => {
  it("normalizes toggles, page keys and the validate default", () => {
    const options = resolveOptions(undefined, {
      site: { url: "https://example.com" },
      pages: { "/about/": { title: "About" } },
    });

    expect(options.pageMeta["/about"]).toEqual({ title: "About" });
    expect(options.robotsEnabled).toBe(true);
    expect(options.robots).toEqual({});
    expect(options.sitemapEnabled).toBe(true);
    expect(options.validate).toBe("warn");
  });

  it("disables generators and keeps custom options", () => {
    const options = resolveOptions(undefined, {
      site: { url: "https://example.com" },
      robots: false,
      sitemap: { exclude: ["/x"] },
      validate: "error",
    });

    expect(options.robotsEnabled).toBe(false);
    expect(options.sitemap).toEqual({ exclude: ["/x"] });
    expect(options.validate).toBe("error");
  });

  it("throws without a site url", () => {
    expect(() => resolveOptions(undefined, {})).toThrow(/site configuration is required/);
  });
});

describe("defineSeoConfig", () => {
  it("returns its input unchanged", () => {
    const config: SeoOptions = { site: { url: "https://example.com" } };
    expect(defineSeoConfig(config)).toBe(config);
  });
});

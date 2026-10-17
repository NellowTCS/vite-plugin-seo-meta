import { describe, expect, it } from "vitest";
import { buildSitemap } from "../../../src/files/sitemap";
import type { ResolvedPage } from "../../../src/types";

function page(route: string, canonical: string, extra: Partial<ResolvedPage> = {}): ResolvedPage {
  return {
    route,
    title: "Page",
    canonical,
    keywords: [],
    noindex: false,
    robotsByUserAgent: {},
    openGraph: {},
    twitter: {},
    jsonLd: [],
    alternates: [],
    meta: {},
    links: [],
    sitemap: true,
    ...extra,
  };
}

describe("buildSitemap", () => {
  it("indents each url element on its own line", async () => {
    const xml = await buildSitemap([
      page("/", "https://example.com/"),
      page("/about", "https://example.com/about"),
    ]);

    expect(xml).toContain("\n  <url>");
    expect(xml).toContain("\n    <loc>https://example.com/</loc>\n");
    expect(xml.endsWith("</urlset>\n")).toBe(true);
    expect(xml).not.toContain("xmlns:news");
    expect(xml).not.toContain("xmlns:image");
    expect(xml).not.toContain("xmlns:video");
    expect(xml).not.toContain("xmlns:xhtml");
  });

  it("emits a formatted empty urlset when nothing qualifies", async () => {
    const xml = await buildSitemap([page("/", "https://example.com/", { sitemap: false })]);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>\n');
    expect(xml).toContain("<urlset");
    expect(xml.endsWith("</urlset>\n")).toBe(true);
  });

  it("keeps xhtml alternate links inside the url element", async () => {
    const xml = await buildSitemap([
      page("/en", "https://example.com/en", {
        alternates: [{ hreflang: "fr", href: "https://example.com/fr" }],
      }),
    ]);

    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain("<xhtml:link");
    expect(xml).toContain('hreflang="fr"');
  });
});

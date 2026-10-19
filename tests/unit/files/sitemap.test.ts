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

  it("emits the image namespace and image:image elements when a page has og:image", async () => {
    const xml = await buildSitemap([
      page("/", "https://example.com/", {
        openGraph: { images: [{ src: "https://example.com/og.png", alt: "og" }] } as any,
      }),
    ]);

    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(xml).toContain("<image:image>");
    expect(xml).toContain("<image:loc>https://example.com/og.png</image:loc>");
    expect(xml).toContain("<image:caption>og</image:caption>");
  });

  it("emits the video namespace and video:video elements when a page has og:video", async () => {
    const xml = await buildSitemap([
      page("/", "https://example.com/", {
        openGraph: { videos: [{ src: "https://example.com/clip.mp4", alt: "clip" }] } as any,
      }),
    ]);

    expect(xml).toContain('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"');
    expect(xml).toContain("<video:video>");
    expect(xml).toContain("<video:thumbnail_loc>https://example.com/clip.mp4</video:thumbnail_loc>");
  });

  it("emits the news namespace and news:news elements for an article", async () => {
    const xml = await buildSitemap([
      page("/", "https://example.com/", {
        title: "Press Release",
        openGraph: {
          type: "article",
          siteName: "Example",
          article: { publishedTime: "2024-01-02" },
        } as any,
      }),
    ]);

    expect(xml).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"');
    expect(xml).toContain("<news:news>");
    expect(xml).toContain("<news:publication>");
    expect(xml).toContain("<news:name>Example</news:name>");
    expect(xml).toContain("<news:publication_date>2024-01-02</news:publication_date>");
    expect(xml).toContain("<news:title>Press Release</news:title>");
  });

  it("does not emit the news namespace when the article has no published date", async () => {
    const xml = await buildSitemap([
      page("/", "https://example.com/", {
        openGraph: { type: "article", article: {} } as any,
      }),
    ]);

    expect(xml).not.toContain("xmlns:news");
  });

  it("omits namespaces that no page uses", async () => {
    const xml = await buildSitemap([page("/", "https://example.com/")]);

    expect(xml).not.toContain("xmlns:image");
    expect(xml).not.toContain("xmlns:video");
    expect(xml).not.toContain("xmlns:news");
    expect(xml).not.toContain("xmlns:xhtml");
  });

  it("enforces a single-host sitemap against the configured site", async () => {
    const xml = await buildSitemap(
      [
        page("/", "https://example.com/"),
        page("/other", "https://other.example.com/other"),
      ],
      { siteUrl: "https://example.com" },
    );

    expect(xml).toContain("https://example.com/");
    expect(xml).not.toContain("https://other.example.com");
  });

  it("caps the number of URLs per file", async () => {
    const pages = Array.from({ length: 5 }, (_, i) =>
      page(`/p${i}`, `https://example.com/p${i}`),
    );
    const xml = await buildSitemap(pages, { maxUrls: 2 });

    expect((xml.match(/<url>/g) ?? []).length).toBe(2);
  });
});

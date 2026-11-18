import { describe, expect, it } from "vitest";
import { buildSitemap } from "../../../src/files/sitemap";
import type { ResolvedPage } from "../../../src/types";

function page(
  route: string,
  canonical: string,
  extra: Partial<ResolvedPage> = {},
): ResolvedPage {
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
    const xml = await buildSitemap([
      page("/", "https://example.com/", { sitemap: false }),
    ]);

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

    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    );
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain("<xhtml:link");
    expect(xml).toContain('hreflang="fr"');
  });

  it("emits the image namespace and image:loc elements when a page has og:image", async () => {
    const xml = await buildSitemap([
      page("/", "https://example.com/", {
        openGraph: {
          images: [{ src: "https://example.com/og.png", alt: "og" }],
        } as any,
      }),
    ]);

    expect(xml).toContain(
      'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
    );
    expect(xml).toContain("<image:image>");
    expect(xml).toContain("<image:loc>https://example.com/og.png</image:loc>");
    expect(xml).not.toContain("<image:caption>");
    expect(xml).not.toContain("<image:title>");
  });

  it("caps images at 1000 per URL", async () => {
    const images = Array.from({ length: 1_001 }, (_, i) => ({
      src: `https://example.com/${i}.png`,
    }));
    const xml = await buildSitemap([
      page("/", "https://example.com/", {
        openGraph: { images } as any,
      }),
    ]);

    expect((xml.match(/<image:image>/g) ?? []).length).toBe(1_000);
    expect(xml).toContain("https://example.com/999.png");
    expect(xml).not.toContain("https://example.com/1000.png");
  });

  it("emits the video namespace and video:video elements when a page has og:video", async () => {
    const xml = await buildSitemap([
      page("/", "https://example.com/", {
        title: "A clip",
        openGraph: {
          videos: [
            {
              src: "https://example.com/clip.mp4",
              thumbnail: "https://example.com/clip.jpg",
              alt: "clip",
            },
          ],
        } as any,
      }),
    ]);

    expect(xml).toContain(
      'xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"',
    );
    expect(xml).toContain("<video:video>");
    expect(xml).toContain(
      "<video:thumbnail_loc>https://example.com/clip.jpg</video:thumbnail_loc>",
    );
    expect(xml).toContain(
      "<video:content_loc>https://example.com/clip.mp4</video:content_loc>",
    );
    expect(xml).toContain("<video:title>clip</video:title>");
    expect(xml).toContain("<video:description>clip</video:description>");
  });

  it("uses explicit video title and description, capping both lengths", async () => {
    const xml = await buildSitemap([
      page("/", "https://example.com/", {
        title: "Page title",
        openGraph: {
          videos: [
            {
              src: "https://example.com/clip.mp4",
              thumbnail: "https://example.com/clip.jpg",
              alt: "Alt text",
              title: "T".repeat(150),
              description: "D".repeat(3_000),
            },
          ],
        } as any,
      }),
    ]);

    expect((xml.match(/<video:title>/g) ?? []).length).toBe(1);
    expect(xml).toMatch(/<video:title>T{100}<\/video:title>/);
    expect((xml.match(/<video:description>/g) ?? []).length).toBe(1);
    expect(xml).toMatch(
      new RegExp(`<video:description>D{2048}</video:description>`),
    );
  });

  it("uses player_loc instead of content_loc when a player is configured", async () => {
    const xml = await buildSitemap([
      page("/", "https://example.com/", {
        openGraph: {
          videos: [
            {
              src: "https://example.com/watch/1",
              thumbnail: "https://example.com/1.jpg",
              playerLoc: "https://example.com/embed/1",
              alt: "Clip",
            },
          ],
        } as any,
      }),
    ]);

    expect(xml).toContain(
      "<video:player_loc>https://example.com/embed/1</video:player_loc>",
    );
    expect(xml).not.toContain("<video:content_loc>");
  });

  it("skips video entries that lack a thumbnail (Google requires one)", async () => {
    const xml = await buildSitemap([
      page("/", "https://example.com/", {
        title: "A clip",
        openGraph: { videos: [{ src: "https://example.com/clip.mp4" }] } as any,
      }),
    ]);

    expect(xml).not.toContain("xmlns:video");
    expect(xml).not.toContain("<video:video>");
  });

  it("emits the news namespace and news:news elements for an article", async () => {
    const xml = await buildSitemap(
      [
        page("/", "https://example.com/", {
          title: "Press Release",
          lang: "en-US",
          openGraph: {
            type: "article",
            siteName: "Example",
            article: {
              publishedTime: "2024-01-02",
              tag: ["press", "release"],
            },
          } as any,
        }),
      ],
      { now: new Date("2024-01-03T00:00:00Z") },
    );

    expect(xml).toContain(
      'xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"',
    );
    expect(xml).toContain("<news:news>");
    expect(xml).toContain("<news:publication>");
    expect(xml).toContain("<news:name>Example</news:name>");
    expect(xml).toContain("<news:language>en</news:language>");
    expect(xml).toContain(
      "<news:publication_date>2024-01-02</news:publication_date>",
    );
    expect(xml).toContain("<news:title>Press Release</news:title>");
    expect(xml).not.toContain("news:keywords");
  });

  it("drops news entries older than two days", async () => {
    const articlePage = page("/", "https://example.com/", {
      title: "Old news",
      openGraph: {
        type: "article",
        siteName: "Example",
        article: { publishedTime: "2024-01-01" },
      } as any,
    });
    const xml = await buildSitemap([articlePage], {
      now: new Date("2024-01-04T00:00:00Z"),
    });

    expect(xml).not.toContain("xmlns:news");
    expect(xml).toContain("<loc>https://example.com/</loc>");
  });

  it("keeps a news entry exactly at the two-day boundary", async () => {
    const xml = await buildSitemap(
      [
        page("/", "https://example.com/", {
          title: "Fresh news",
          openGraph: {
            siteName: "Example",
            article: { publishedTime: "2024-01-01T12:00:00Z" },
          } as any,
        }),
      ],
      { now: new Date("2024-01-03T12:00:00Z") },
    );

    expect(xml).toContain("<news:title>Fresh news</news:title>");
  });

  it("drops news entries with a blank publication name or invalid date", async () => {
    const xml = await buildSitemap(
      [
        page("/blank", "https://example.com/blank", {
          title: "Blank",
          openGraph: {
            siteName: "   ",
            article: { publishedTime: "2024-01-02" },
          } as any,
        }),
        page("/invalid", "https://example.com/invalid", {
          title: "Invalid",
          openGraph: {
            siteName: "Example",
            article: { publishedTime: "not a date" },
          } as any,
        }),
      ],
      { now: new Date("2024-01-03T00:00:00Z") },
    );

    expect(xml).not.toContain("xmlns:news");
  });

  it("caps news entries per sitemap file while keeping their URLs", async () => {
    const pages = Array.from({ length: 3 }, (_, i) =>
      page(`/news${i}`, `https://example.com/news${i}`, {
        title: `Story ${i}`,
        openGraph: {
          siteName: "Example",
          article: { publishedTime: "2024-01-02" },
        } as any,
      }),
    );
    const xml = await buildSitemap(pages, {
      maxNews: 2,
      now: new Date("2024-01-03T00:00:00Z"),
    });

    expect((xml.match(/<news:news>/g) ?? []).length).toBe(2);
    expect(xml).toContain("<loc>https://example.com/news2</loc>");
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

  it("excludes error documents and verification files by default", async () => {
    const xml = await buildSitemap([
      page("/", "https://example.com/"),
      page("/404", "https://example.com/404"),
      page("/500", "https://example.com/500"),
      page(
        "/google1234567890abcdef",
        "https://example.com/google1234567890abcdef",
      ),
      page("/yandex_abc123", "https://example.com/yandex_abc123"),
    ]);

    expect(xml).toContain("https://example.com/</loc>");
    expect(xml).not.toContain("/404");
    expect(xml).not.toContain("/500");
    expect(xml).not.toContain("google");
    expect(xml).not.toContain("yandex_");
  });

  it("keeps real pages whose names merely start with an excluded prefix", async () => {
    const xml = await buildSitemap([
      page("/google", "https://example.com/google"),
      page("/404-page", "https://example.com/404-page"),
      page("/yandex", "https://example.com/yandex"),
    ]);

    expect(xml).toContain("https://example.com/google");
    expect(xml).toContain("https://example.com/404-page");
    expect(xml).toContain("https://example.com/yandex");
  });

  it("excludes verification files even when the canonical keeps .html", async () => {
    const xml = await buildSitemap([
      page(
        "/google1234567890abcdef",
        "https://example.com/google1234567890abcdef.html",
      ),
    ]);

    expect(xml).not.toContain("google");
  });

  it("clamps priorities into the protocol range", async () => {
    const xml = await buildSitemap([
      page("/high", "https://example.com/high", { priority: 5 }),
      page("/low", "https://example.com/low", { priority: -1 }),
    ]);

    expect(xml).toContain("<priority>1.0</priority>");
    expect(xml).toContain("<priority>0.0</priority>");
    expect(xml).not.toContain("<priority>5.0</priority>");
  });

  it("omits a non-finite default priority", async () => {
    const xml = await buildSitemap([page("/", "https://example.com/")], {
      defaultPriority: Number.NaN,
    });

    expect(xml).not.toContain("<priority>");
  });

  it("uses the first URL as the host when siteUrl is omitted", async () => {
    const xml = await buildSitemap([
      page("/", "https://example.com/"),
      page("/other", "https://other.example.com/other"),
    ]);

    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).not.toContain("https://other.example.com");
  });

  it("adds a self-referencing xhtml link from the page language", async () => {
    const xml = await buildSitemap([
      page("/en", "https://example.com/en", {
        lang: "en",
        alternates: [{ hreflang: "fr", href: "https://example.com/fr" }],
      }),
    ]);

    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="en" href="https://example.com/en"/>',
    );
    expect(xml).toContain('hreflang="fr"');
  });

  it("fails when the serialized sitemap exceeds maxBytes", async () => {
    await expect(
      buildSitemap([page("/", "https://example.com/")], { maxBytes: 10 }),
    ).rejects.toThrow(/protocol limit/);
  });
});

import { describe, expect, it } from "vitest";
import { resolveSite } from "../../../src/config/resolve";
import { resolvePage } from "../../../src/head/merge";
import { renderHeadTags } from "../../../src/head/render";
import type { HeadTag, PageMeta, ResolvedOptions, SiteConfig } from "../../../src/types";

const BASE_SITE: SiteConfig = { url: "https://example.com", name: "Example" };

function renderSite(meta: PageMeta, site: SiteConfig = BASE_SITE) {
  const resolvedSite = resolveSite(site);
  const options: ResolvedOptions = {
    site: resolvedSite,
    pageMeta: { "/": meta },
    robotsEnabled: false,
    robots: {},
    sitemapEnabled: false,
    sitemap: {},
    validate: false,
  };
  const page = resolvePage("/", options);
  return { page, tags: renderHeadTags(page, resolvedSite) };
}

const find = (tags: HeadTag[], key: string) => tags.find((tag) => tag.key === key);

describe("basic tags", () => {
  it("renders the title, description, canonical and safe defaults", () => {
    const { tags } = renderSite({ title: "Home", description: "Welcome home" });

    expect(find(tags, "title")?.text).toBe("Home");
    expect(find(tags, "meta:description")?.attrs.content).toBe("Welcome home");
    expect(find(tags, "link:canonical")?.attrs.href).toBe("https://example.com/");
    expect(find(tags, "meta:charset")?.onlyIfMissing).toBe(true);
    expect(find(tags, "meta:viewport")?.onlyIfMissing).toBe(true);
  });

  it("applies the title template", () => {
    const { page } = renderSite({ title: "Home" }, { ...BASE_SITE, titleTemplate: "%s | Example" });
    expect(page.title).toBe("Home | Example");
  });

  it("uses the site default title when the page has none", () => {
    const { page } = renderSite(
      {},
      { ...BASE_SITE, title: "Example", titleTemplate: "%s | Example" },
    );
    expect(page.title).toBe("Example");
  });

  it("honors a page canonical override", () => {
    const { tags } = renderSite({ title: "Home", canonical: "/custom" });
    expect(find(tags, "link:canonical")?.attrs.href).toBe("https://example.com/custom");
  });

  it("emits a robots meta for noindex pages", () => {
    const { tags } = renderSite({ title: "Home", noindex: true });
    expect(find(tags, "meta:robots")?.attrs.content).toBe("noindex, nofollow");
  });

  it("emits application-name from the site name", () => {
    const { tags } = renderSite({ title: "Home" });
    expect(find(tags, "meta:application-name")?.attrs.content).toBe("Example");
  });

  it("renders structured robots directives", () => {
    const { tags } = renderSite({
      title: "Home",
      robots: {
        noindex: true,
        nofollow: true,
        nosnippet: false,
        maxSnippet: 160,
        maxImagePreview: "large",
        maxVideoPreview: -1,
      },
    });

    expect(find(tags, "meta:robots")?.attrs.content).toBe(
      "noindex, nofollow, max-snippet:160, max-image-preview:large, max-video-preview:-1",
    );
  });

  it("detects noindex from structured directives", () => {
    const { page } = renderSite({ title: "Home", robots: { noindex: true } });
    expect(page.noindex).toBe(true);
    expect(page.robots).toBe("noindex");
    expect(page.sitemap).toBe(false);
  });

  it("renders site and page per-user-agent robots metas", () => {
    const { tags } = renderSite(
      { title: "Home", robotsByUserAgent: { "AdsBot-Google": "noindex" } },
      { ...BASE_SITE, robotsByUserAgent: { "googlebot-news": { noindex: true } } },
    );

    expect(find(tags, "meta:adsbot-google")?.attrs.content).toBe("noindex");
    expect(find(tags, "meta:googlebot-news")?.attrs.content).toBe("noindex");
  });
});

describe("social tags", () => {
  it("fills Open Graph and Twitter from the page", () => {
    const { tags } = renderSite({ title: "Home", description: "Welcome home" });

    expect(find(tags, "meta:og:type")?.attrs.content).toBe("website");
    expect(find(tags, "meta:og:title")?.attrs.content).toBe("Home");
    expect(find(tags, "meta:og:url")?.attrs.content).toBe("https://example.com/");
    expect(find(tags, "meta:og:site_name")?.attrs.content).toBe("Example");
    expect(find(tags, "meta:twitter:card")?.attrs.content).toBe("summary_large_image");
  });

  it("renders favicon links and theme color", () => {
    const { tags } = renderSite(
      { title: "Home" },
      { ...BASE_SITE, favicon: { icon: "/favicon.ico", themeColor: "#ffffff" } },
    );

    expect(find(tags, "link:icon")?.attrs.href).toBe("https://example.com/favicon.ico");
    expect(find(tags, "meta:theme-color")?.attrs.content).toBe("#ffffff");
  });

  it("renders one theme-color tag per media query", () => {
    const { tags } = renderSite(
      { title: "Home" },
      {
        ...BASE_SITE,
        favicon: {
          themeColor: [
            { color: "#ffffff", media: "(prefers-color-scheme: light)" },
            { color: "#111111", media: "(prefers-color-scheme: dark)" },
            { color: "#000000" },
          ],
        },
      },
    );

    const light = find(tags, "meta:theme-color:(prefers-color-scheme: light)");
    expect(light?.attrs).toEqual({
      name: "theme-color",
      content: "#ffffff",
      media: "(prefers-color-scheme: light)",
    });
    expect(find(tags, "meta:theme-color:(prefers-color-scheme: dark)")?.attrs.content).toBe(
      "#111111",
    );
    expect(find(tags, "meta:theme-color")?.attrs.content).toBe("#000000");
    expect(tags.filter((tag) => tag.key.startsWith("meta:theme-color"))).toHaveLength(3);
  });

  it("renders one alternate link per locale", () => {
    const { tags } = renderSite({
      title: "Home",
      alternates: [
        { hreflang: "en", href: "/en" },
        { hreflang: "x-default", href: "/" },
      ],
    });

    expect(find(tags, "link:alternate:en")?.attrs.href).toBe("https://example.com/en");
    expect(find(tags, "link:alternate:x-default")?.attrs.href).toBe("https://example.com/");
  });
});

describe("json-ld", () => {
  it("emits nothing when there are no nodes", () => {
    const { tags } = renderSite({ title: "Home" });
    expect(find(tags, "script:jsonld")).toBeUndefined();
  });

  it("serializes nodes and escapes angle brackets", () => {
    const { tags } = renderSite(
      { title: "Home" },
      { ...BASE_SITE, jsonLd: { extra: [{ name: "</script>" }] } },
    );
    const script = find(tags, "script:jsonld");

    expect(script?.tag).toBe("script");
    expect(script?.attrs.type).toBe("application/ld+json");
    expect(script?.text).toContain("\\u003c/script");
    expect(script?.text).not.toContain("<");
  });
});

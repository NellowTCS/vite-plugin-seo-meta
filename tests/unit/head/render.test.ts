import { describe, expect, it } from "vitest";
import { resolveSite } from "../../../src/config/resolve";
import { resolvePage } from "../../../src/head/merge";
import { renderHeadTags } from "../../../src/head/render";
import type {
  HeadTag,
  PageMeta,
  ResolvedOptions,
  SiteConfig,
} from "../../../src/types";

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

const find = (tags: HeadTag[], key: string) =>
  tags.find((tag) => {
    if (tag.key === key) return true;
    if (key.startsWith("meta:") && tag.attrs.property) {
      return `meta:${tag.attrs.property.toLowerCase()}` === key;
    }
    return false;
  });

describe("basic tags", () => {
  it("renders the title, description, canonical and safe defaults", () => {
    const { tags } = renderSite({ title: "Home", description: "Welcome home" });

    expect(find(tags, "title")?.text).toBe("Home");
    expect(find(tags, "meta:description")?.attrs.content).toBe("Welcome home");
    expect(find(tags, "link:canonical")?.attrs.href).toBe(
      "https://example.com/",
    );
    expect(find(tags, "meta:charset")?.onlyIfMissing).toBe(true);
    expect(find(tags, "meta:viewport")?.onlyIfMissing).toBe(true);
  });

  it("applies the title template", () => {
    const { page } = renderSite(
      { title: "Home" },
      { ...BASE_SITE, titleTemplate: "%s | Example" },
    );
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
    expect(find(tags, "link:canonical")?.attrs.href).toBe(
      "https://example.com/custom",
    );
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
      {
        ...BASE_SITE,
        robotsByUserAgent: { "googlebot-news": { noindex: true } },
      },
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
    expect(find(tags, "meta:og:url")?.attrs.content).toBe(
      "https://example.com/",
    );
    expect(find(tags, "meta:og:site_name")?.attrs.content).toBe("Example");
    expect(find(tags, "meta:twitter:card")?.attrs.content).toBe(
      "summary_large_image",
    );
  });

  it("renders the full Twitter Card spec", () => {
    const { tags } = renderSite({
      title: "Home",
      twitter: {
        card: "summary_large_image",
        site: "@acme",
        siteId: "123",
        creator: "@author",
        creatorId: "456",
        image: "/og.png",
        imageAlt: "alt",
        imageWidth: 1200,
        imageHeight: 630,
        label1: "Price",
        data1: "$199",
      },
    });
    expect(find(tags, "meta:twitter:site:id")?.attrs.content).toBe("123");
    expect(find(tags, "meta:twitter:creator:id")?.attrs.content).toBe("456");
    expect(find(tags, "meta:twitter:image")?.attrs.content).toBe(
      "https://example.com/og.png",
    );
    expect(find(tags, "meta:twitter:image:alt")?.attrs.content).toBe("alt");
    expect(find(tags, "meta:twitter:image:width")?.attrs.content).toBe("1200");
    expect(find(tags, "meta:twitter:label1")?.attrs.content).toBe("Price");
    expect(find(tags, "meta:twitter:data1")?.attrs.content).toBe("$199");
  });

  it("renders a Player Card through the full page pipeline", () => {
    const { tags } = renderSite({
      title: "Home",
      twitter: {
        card: "player",
        player: { url: "/embed/1", width: 1280, height: 720, stream: "/s.mp4" },
      },
    });
    expect(find(tags, "meta:twitter:player")?.attrs.content).toBe(
      "https://example.com/embed/1",
    );
    expect(find(tags, "meta:twitter:player:width")?.attrs.content).toBe("1280");
    expect(find(tags, "meta:twitter:player:stream")?.attrs.content).toBe(
      "https://example.com/s.mp4",
    );
  });

  it("renders an App Card through the full page pipeline", () => {
    const { tags } = renderSite({
      title: "Home",
      twitter: {
        card: "app",
        apps: {
          country: "US",
          iphone: { name: "App", id: "123", url: "app://x" },
          googleplay: { name: "App", id: "com.app", url: "http://app.com/x" },
        },
      },
    });
    expect(find(tags, "meta:twitter:app:country")?.attrs.content).toBe("US");
    expect(find(tags, "meta:twitter:app:name:iphone")?.attrs.content).toBe(
      "App",
    );
    expect(find(tags, "meta:twitter:app:id:iphone")?.attrs.content).toBe("123");
    expect(find(tags, "meta:twitter:app:url:iphone")?.attrs.content).toBe(
      "app://x",
    );
    expect(find(tags, "meta:twitter:app:id:googleplay")?.attrs.content).toBe(
      "com.app",
    );
    expect(find(tags, "meta:twitter:app:url:googleplay")?.attrs.content).toBe(
      "http://app.com/x",
    );
  });

  it("renders favicon links and theme color", () => {
    const { tags } = renderSite(
      { title: "Home" },
      {
        ...BASE_SITE,
        favicon: { icon: "/favicon.ico", themeColor: "#ffffff" },
      },
    );

    expect(find(tags, "link:icon")?.attrs.href).toBe(
      "https://example.com/favicon.ico",
    );
    expect(find(tags, "meta:theme-color")?.attrs.content).toBe("#ffffff");
  });

  it("renders the full favicon and platform icon spec", () => {
    const { tags } = renderSite(
      { title: "Home" },
      {
        ...BASE_SITE,
        favicon: {
          icon: "/favicon.ico",
          appleTouchIcon: "/apple-touch-icon.png",
          appleTouchIconPrecomposed: "/apple-touch-icon-precomposed.png",
          manifest: "/manifest.json",
          maskIcon: "/mask-icon.svg",
          themeColor: "#ff0000",
          mobileWebApp: {
            title: "App",
            capable: true,
            statusBarStyle: "black-translucent",
          },
          msapplication: {
            tileColor: "#ffffff",
            tileImage: "/tile.png",
            config: "/browserconfig.xml",
          },
        },
      },
    );

    expect(find(tags, "link:icon")?.attrs.href).toBe(
      "https://example.com/favicon.ico",
    );
    expect(find(tags, "link:apple-touch-icon")?.attrs.href).toBe(
      "https://example.com/apple-touch-icon.png",
    );
    expect(find(tags, "link:apple-touch-icon-precomposed")?.attrs.href).toBe(
      "https://example.com/apple-touch-icon-precomposed.png",
    );
    expect(find(tags, "link:manifest")?.attrs.href).toBe(
      "https://example.com/manifest.json",
    );
    expect(find(tags, "link:mask-icon")?.attrs.href).toBe(
      "https://example.com/mask-icon.svg",
    );
    expect(find(tags, "link:mask-icon")?.attrs.color).toBe("#ff0000");
    expect(find(tags, "meta:apple-mobile-web-app-title")?.attrs.content).toBe(
      "App",
    );
    expect(find(tags, "meta:apple-mobile-web-app-capable")?.attrs.content).toBe(
      "yes",
    );
    expect(
      find(tags, "meta:apple-mobile-web-app-status-bar-style")?.attrs.content,
    ).toBe("black-translucent");
    expect(find(tags, "meta:msapplication-tilecolor")?.attrs.content).toBe(
      "#ffffff",
    );
    expect(find(tags, "meta:msapplication-tileimage")?.attrs.content).toBe(
      "https://example.com/tile.png",
    );
    expect(find(tags, "link:msapplication-config")?.attrs.href).toBe(
      "https://example.com/browserconfig.xml",
    );
  });

  it("defaults the mask-icon color when no theme color is set", () => {
    const { tags } = renderSite(
      { title: "Home" },
      { ...BASE_SITE, favicon: { maskIcon: "/mask.svg" } },
    );
    expect(find(tags, "link:mask-icon")?.attrs.color).toBe("#000000");
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
    expect(
      find(tags, "meta:theme-color:(prefers-color-scheme: dark)")?.attrs
        .content,
    ).toBe("#111111");
    expect(find(tags, "meta:theme-color")?.attrs.content).toBe("#000000");
    expect(
      tags.filter((tag) => tag.key.startsWith("meta:theme-color")),
    ).toHaveLength(3);
  });

  it("renders one alternate link per locale", () => {
    const { tags } = renderSite({
      title: "Home",
      alternates: [
        { hreflang: "en", href: "/en" },
        { hreflang: "x-default", href: "/" },
      ],
    });

    expect(find(tags, "link:alternate:en")?.attrs.href).toBe(
      "https://example.com/en",
    );
    expect(find(tags, "link:alternate:x-default")?.attrs.href).toBe(
      "https://example.com/",
    );
  });
});

describe("alternates and locale", () => {
  it("adds a self-referencing alternate for the page language", () => {
    const { tags } = renderSite({
      title: "Home",
      lang: "en-US",
      alternates: [{ hreflang: "de", href: "/de" }],
    });

    expect(find(tags, "link:alternate:en-US")?.attrs.href).toBe(
      "https://example.com/",
    );
    expect(find(tags, "link:alternate:de")?.attrs.href).toBe(
      "https://example.com/de",
    );
  });

  it("normalizes hreflang casing and dedupes by language", () => {
    const { tags } = renderSite({
      title: "Home",
      alternates: [
        { hreflang: "en-us", href: "/en" },
        { hreflang: "EN-US", href: "/en-dup" },
        { hreflang: "X-Default", href: "/" },
      ],
    });

    expect(find(tags, "link:alternate:en-US")?.attrs.href).toBe(
      "https://example.com/en",
    );
    expect(find(tags, "link:alternate:x-default")?.attrs.href).toBe(
      "https://example.com/",
    );
    expect(
      tags.filter((tag) => tag.key.startsWith("link:alternate")),
    ).toHaveLength(2);
  });

  it("derives og:locale from the page language", () => {
    const { tags } = renderSite({ title: "Home", lang: "de-CH" });
    expect(find(tags, "meta:og:locale")?.attrs.content).toBe("de_CH");
  });

  it("falls back to the site language for og:locale", () => {
    const { tags } = renderSite(
      { title: "Home" },
      { ...BASE_SITE, lang: "fr-FR" },
    );
    expect(find(tags, "meta:og:locale")?.attrs.content).toBe("fr_FR");
  });

  it("derives og:locale:alternate from the alternates, excluding self and x-default", () => {
    const { tags } = renderSite({
      title: "Home",
      lang: "en-US",
      alternates: [
        { hreflang: "fr-FR", href: "/fr" },
        { hreflang: "de", href: "/de" },
        { hreflang: "x-default", href: "/" },
      ],
    });

    const alternates = tags.filter(
      (tag) => tag.attrs.property === "og:locale:alternate",
    );

    expect(alternates.map((tag) => tag.attrs.content)).toEqual(["fr_FR"]);
  });

  it("prefers an explicit openGraph.locale and localeAlternate", () => {
    const { tags } = renderSite({
      title: "Home",
      lang: "en-US",
      alternates: [{ hreflang: "fr", href: "/fr" }],
      openGraph: { locale: "en_GB", localeAlternate: ["it_IT"] },
    });

    expect(find(tags, "meta:og:locale")?.attrs.content).toBe("en_GB");
    const alternates = tags.filter(
      (tag) => tag.attrs.property === "og:locale:alternate",
    );
    expect(alternates.map((tag) => tag.attrs.content)).toEqual(["it_IT"]);
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

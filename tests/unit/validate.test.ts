import { describe, expect, it } from "vitest";
import { resolveSite } from "../../src/config/resolve";
import { resolvePage } from "../../src/head/merge";
import { validatePage, validateOptions } from "../../src/validate";
import type { ResolvedOptions, SiteConfig } from "../../src/types";

const BASE_SITE: SiteConfig = {
  url: "https://example.com",
  name: "Example",
  image: "https://example.com/og.png",
};
const LONG_DESC =
  "Welcome home to our example site, where you can learn more about who we are.";

function options(
  meta: Record<string, any> = {},
  site: SiteConfig = BASE_SITE,
): ResolvedOptions {
  return {
    site: resolveSite(site),
    pageMeta: meta,
    robotsEnabled: false,
    robots: {},
    sitemapEnabled: false,
    sitemap: {},
    validate: false,
  };
}

/** resolvePage absolutizes paths, so validation runs on resolved values */
function page(route: string, meta: any = {}) {
  return resolvePage(
    route,
    options({ [route]: { description: LONG_DESC, ...meta } }),
  );
}

describe("validatePage", () => {
  it("passes a well-formed page", () => {
    expect(validatePage(page("/", { title: "Home" }))).toEqual([]);
  });

  it("flags an empty title when nothing falls back to it", () => {
    const opts = options({ "/": { title: "" } });
    opts.site = resolveSite({ url: "https://example.com" });
    expect(
      validatePage(resolvePage("/", opts)).some((i) => i.field === "title"),
    ).toBe(true);
  });

  it("flags a title over 60 chars", () => {
    const issues = validatePage(page("/", { title: "x".repeat(61) }));
    expect(issues.some((i) => i.field === "title")).toBe(true);
  });

  it("flags a description over 160 chars", () => {
    const issues = validatePage(
      page("/", { title: "Home", description: "x".repeat(161) }),
    );
    expect(issues.some((i) => i.field === "description")).toBe(true);
  });

  it("doesn't flag a description between 50 and 160 chars", () => {
    const issues = validatePage(
      page("/", { title: "Home", description: "x".repeat(100) }),
    );
    expect(issues.some((i) => i.field === "description")).toBe(false);
  });

  it("flags a description under 50 chars", () => {
    const issues = validatePage(
      page("/", { title: "Home", description: "short" }),
    );
    expect(issues.some((i) => i.field === "description")).toBe(true);
  });

  it("flags a missing og:image", () => {
    const resolved = page("/", { title: "Home" });
    const issues = validatePage({
      ...resolved,
      openGraph: { ...resolved.openGraph, image: undefined, images: [] },
    });
    expect(
      issues.some(
        (i) => i.field === "openGraph.image" && i.message.includes("og:image"),
      ),
    ).toBe(true);
  });

  it("accepts structured og:images in place of a scalar image", () => {
    const issues = validatePage(
      page("/", {
        title: "Home",
        openGraph: {
          images: [{ src: "https://example.com/a.jpg" }],
        },
      }),
    );
    expect(issues.some((i) => i.field === "openGraph.image")).toBe(false);
  });

  it("flags a locale that is not language_TERRITORY", () => {
    const resolved = page("/", { title: "Home" });
    const issues = validatePage({
      ...resolved,
      openGraph: { ...resolved.openGraph, locale: "en" },
    });
    expect(issues.some((i) => i.field === "openGraph.locale")).toBe(true);
  });

  it("flags a malformed og:locale:alternate", () => {
    const resolved = page("/", { title: "Home" });
    const issues = validatePage({
      ...resolved,
      openGraph: {
        ...resolved.openGraph,
        localeAlternate: ["de_DE", "nope"],
      },
    });
    expect(
      issues.some(
        (i) =>
          i.field === "openGraph.localeAlternate" && i.message.includes("nope"),
      ),
    ).toBe(true);
  });

  it("flags an unparseable article date string", () => {
    const issues = validatePage(
      page("/", {
        title: "Home",
        openGraph: { article: { publishedTime: "last tuesday" } },
      }),
    );
    expect(
      issues.some((i) => i.field === "openGraph.article.publishedTime"),
    ).toBe(true);
  });

  it("accepts an ISO article date string", () => {
    expect(
      validatePage(
        page("/", {
          title: "Home",
          openGraph: { article: { publishedTime: "2024-01-15T00:00:00.000Z" } },
        }),
      ),
    ).toEqual([]);
  });

  it.each([
    {
      openGraph: { music: { duration: 0 } },
      field: "openGraph.music.duration",
    },
    {
      openGraph: { video: { duration: -1 } },
      field: "openGraph.video.duration",
    },
  ])("flags an out-of-range duration", ({ openGraph, field }) => {
    const issues = validatePage(page("/", { title: "Home", openGraph }));
    expect(issues.some((i) => i.field === field)).toBe(true);
  });

  it("flags an out-of-range priority", () => {
    expect(
      validatePage(page("/", { title: "Home", priority: 2 })).some(
        (i) => i.field === "priority",
      ),
    ).toBe(true);
  });

  it("flags an invalid changefreq", () => {
    const issues = validatePage(
      page("/", { title: "Home", changefreq: "sometimes" as any }),
    );
    expect(issues.some((i) => i.field === "changefreq")).toBe(true);
  });

  it("accepts the valid changefreq", () => {
    for (const cf of [
      "always",
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "yearly",
      "never",
    ]) {
      expect(
        validatePage(page("/", { title: "Home", changefreq: cf as any })),
      ).toEqual([]);
    }
  });

  it("flags an invalid twitter card", () => {
    const issues = validatePage(
      page("/", { title: "Home", twitter: { card: "banana" as any } }),
    );
    expect(issues.some((i) => i.field === "twitter.card")).toBe(true);
  });

  it("accepts every valid twitter card", () => {
    for (const card of ["summary", "summary_large_image", "app", "player"]) {
      expect(
        validatePage(
          page("/", { title: "Home", twitter: { card: card as any } }),
        ),
      ).toEqual([]);
    }
  });

  it("flags a twitter title over 70 chars", () => {
    const issues = validatePage(
      page("/", { title: "Home", twitter: { title: "x".repeat(71) } }),
    );
    expect(issues.some((i) => i.field === "twitter.title")).toBe(true);
  });

  it("flags a twitter description over 200 chars", () => {
    const issues = validatePage(
      page("/", { title: "Home", twitter: { description: "x".repeat(201) } }),
    );
    expect(issues.some((i) => i.field === "twitter.description")).toBe(true);
  });

  it("flags a non-HTTPS twitter image", () => {
    const issues = validatePage(
      page("/", {
        title: "Home",
        twitter: { image: "http://example.com/img.png" },
      }),
    );
    expect(issues.some((i) => i.field === "twitter.image")).toBe(true);
  });

  it("accepts an HTTPS twitter image", () => {
    expect(
      validatePage(
        page("/", {
          title: "Home",
          twitter: { image: "https://example.com/img.png" },
        }),
      ),
    ).toEqual([]);
  });

  it("flags a non-HTTPS twitter player URL", () => {
    const issues = validatePage(
      page("/", {
        title: "Home",
        twitter: {
          player: {
            url: "http://example.com/player",
            width: 480,
            height: 480,
          },
        },
      }),
    );
    expect(issues.some((i) => i.field === "twitter.player.url")).toBe(true);
  });

  it("accepts an HTTPS twitter player URL", () => {
    expect(
      validatePage(
        page("/", {
          title: "Home",
          twitter: {
            player: {
              url: "https://example.com/player",
              width: 480,
              height: 480,
            },
          },
        }),
      ),
    ).toEqual([]);
  });

  it("keeps the absolute-URL error for a relative twitter image", () => {
    const resolved = page("/", { title: "Home" });
    const issues = validatePage({
      ...resolved,
      twitter: { ...resolved.twitter, image: "/img.png" },
    });
    expect(
      issues.some(
        (i) =>
          i.field === "twitter.image" &&
          i.message.includes("not an absolute URL"),
      ),
    ).toBe(true);
  });

  it("flags an unrecognized robots directive", () => {
    const issues = validatePage(
      page("/", { title: "Home", robots: "nope, noindex" }),
    );
    expect(issues.some((i) => i.field === "robots")).toBe(true);
  });

  it("accepts max-* and unavailable_after directives", () => {
    expect(
      validatePage(
        page("/", {
          title: "Home",
          robots: "max-snippet:50, unavailable_after: 2026-01-01",
        }),
      ),
    ).toEqual([]);
  });

  it("accepts the default index and follow directives", () => {
    expect(
      validatePage(page("/", { title: "Home", robots: "index, follow" })),
    ).toEqual([]);
  });

  it("flags an unknown max-* directive", () => {
    const issues = validatePage(
      page("/", { title: "Home", robots: "max-banana: 5" }),
    );
    expect(
      issues.some(
        (i) =>
          i.field === "robots" &&
          i.message.includes('max-banana: 5" is not recognized'),
      ),
    ).toBe(true);
  });

  it.each(["max-snippet:banana", "max-video-preview:soon"])(
    "flags %s without a parseable number",
    (directive) => {
      const issues = validatePage(
        page("/", { title: "Home", robots: directive }),
      );
      expect(
        issues.some(
          (i) => i.field === "robots" && i.message.includes("parseable number"),
        ),
      ).toBe(true);
    },
  );

  it("flags an unsupported max-image-preview value", () => {
    const issues = validatePage(
      page("/", { title: "Home", robots: "max-image-preview:banana" }),
    );
    expect(
      issues.some(
        (i) => i.field === "robots" && i.message.includes("max-image-preview"),
      ),
    ).toBe(true);
  });

  it("accepts a valid max-image-preview value", () => {
    expect(
      validatePage(
        page("/", { title: "Home", robots: "max-image-preview:LARGE" }),
      ),
    ).toEqual([]);
  });

  it("flags an unavailable_after value with no parseable date", () => {
    const issues = validatePage(
      page("/", { title: "Home", robots: "unavailable_after: whenever" }),
    );
    expect(
      issues.some(
        (i) => i.field === "robots" && i.message.includes("parseable date"),
      ),
    ).toBe(true);
  });

  it("accepts structured unavailable_after dates", () => {
    expect(
      validatePage(
        page("/", {
          title: "Home",
          robots: { unavailableAfter: new Date("2027-01-01T00:00:00.000Z") },
        }),
      ),
    ).toEqual([]);
  });

  it("validates per-user-agent robots content", () => {
    const issues = validatePage(
      page("/", {
        title: "Home",
        robotsByUserAgent: { googlebot: "definitely-not-a-directive" },
      }),
    );
    expect(
      issues.some(
        (i) =>
          i.field === "robots:googlebot" &&
          i.message.includes("not recognized"),
      ),
    ).toBe(true);
  });

  it("accepts valid per-user-agent robots content", () => {
    expect(
      validatePage(
        page("/", {
          title: "Home",
          robotsByUserAgent: { googlebot: "noindex, max-snippet:50" },
        }),
      ),
    ).toEqual([]);
  });

  it("flags indexifembedded without noindex", () => {
    const issues = validatePage(
      page("/", { title: "Home", robots: "indexifembedded" }),
    );
    expect(
      issues.some(
        (i) => i.field === "robots" && i.message.includes("indexifembedded"),
      ),
    ).toBe(true);
  });

  it("accepts indexifembedded with noindex", () => {
    expect(
      validatePage(
        page("/", { title: "Home", robots: "noindex, indexifembedded" }),
      ),
    ).toEqual([]);
  });

  it("flags none and all emitted together", () => {
    for (const robots of ["none, all", { none: true, all: true }]) {
      const issues = validatePage(page("/", { title: "Home", robots }));
      expect(
        issues.some(
          (i) => i.field === "robots" && i.message.includes('dropping "all"'),
        ),
      ).toBe(true);
    }
  });

  it("accepts redundant but non-conflicting directive combinations", () => {
    for (const robots of ["none, noindex, nofollow", "all, noindex"])
      expect(validatePage(page("/", { title: "Home", robots }))).toEqual([]);
  });

  it("flags empty custom meta content", () => {
    const issues = validatePage(
      page("/", { title: "Home", meta: { "x-foo": "   " } }),
    );
    expect(issues.some((i) => i.field === "meta:x-foo")).toBe(true);
  });

  it("flags a custom link missing rel", () => {
    const issues = validatePage(
      page("/", {
        title: "Home",
        links: [
          { rel: "", href: "/x" },
          { rel: "next", href: "/y" },
        ],
      }),
    );
    expect(issues.filter((i) => i.field === "links")).toHaveLength(1);
  });

  it("flags a non-ISO 639-1 language subtag", () => {
    const issues = validatePage(
      page("/", {
        title: "Home",
        alternates: [{ hreflang: "zho", href: "/zh" }],
      }),
    );
    expect(
      issues.some(
        (i) => i.field === "alternates" && i.message.includes("639-1"),
      ),
    ).toBe(true);
  });

  it("flags an unassigned two-letter language subtag", () => {
    const issues = validatePage(
      page("/", {
        title: "Home",
        alternates: [{ hreflang: "zz", href: "/zz" }],
      }),
    );
    expect(
      issues.some(
        (i) => i.field === "alternates" && i.message.includes('"zz"'),
      ),
    ).toBe(true);
  });

  it("flags a numeric region subtag", () => {
    const issues = validatePage(
      page("/", {
        title: "Home",
        alternates: [{ hreflang: "es-419", href: "/es" }],
      }),
    );
    expect(
      issues.some(
        (i) => i.field === "alternates" && i.message.includes("numeric region"),
      ),
    ).toBe(true);
  });

  it("flags an unassigned region subtag", () => {
    const issues = validatePage(
      page("/", {
        title: "Home",
        alternates: [{ hreflang: "en-XX", href: "/en" }],
      }),
    );
    expect(
      issues.some(
        (i) => i.field === "alternates" && i.message.includes('"XX"'),
      ),
    ).toBe(true);
  });

  it("accepts language, region, script and x-default tags", () => {
    for (const hreflang of [
      "en",
      "en-US",
      "en-GB",
      "zh-Hant",
      "zh-Hans-CN",
      "x-default",
    ])
      expect(
        validatePage(
          page("/", {
            title: "Home",
            lang: "en",
            alternates: [{ hreflang, href: hreflang === "en" ? "/" : "/x" }],
          }),
        ),
      ).toEqual([]);
  });

  it("flags alternates without a lang or self-reference", () => {
    const issues = validatePage(
      page("/", {
        title: "Home",
        alternates: [{ hreflang: "fr", href: "/fr" }],
      }),
    );
    expect(
      issues.some(
        (i) =>
          i.field === "alternates" && i.message.includes("self-referencing"),
      ),
    ).toBe(true);
  });

  it("flags alternates that shadow the page language", () => {
    const issues = validatePage(
      page("/", {
        title: "Home",
        lang: "en",
        alternates: [{ hreflang: "en", href: "/other" }],
      }),
    );
    expect(
      issues.some(
        (i) =>
          i.field === "alternates" && i.message.includes("self-referencing"),
      ),
    ).toBe(true);
  });

  it("accepts a manual self-reference when no lang is configured", () => {
    expect(
      validatePage(
        page("/", {
          title: "Home",
          alternates: [{ hreflang: "en", href: "/" }],
        }),
      ),
    ).toEqual([]);
  });
});

describe("validateOptions", () => {
  it("flags duplicate titles across routes", () => {
    const issues = validateOptions(
      options({ "/a": { title: "Same" }, "/b": { title: "Same" } }),
    );
    expect(
      issues.some(
        (i) => i.field === "title" && i.message.includes("duplicate title"),
      ),
    ).toBe(true);
  });

  it("flags duplicate canonicals", () => {
    const issues = validateOptions(
      options({
        "/a": { title: "A", canonical: "https://example.com/x" },
        "/b": { title: "B", canonical: "https://example.com/x" },
      }),
    );
    expect(
      issues.some(
        (i) =>
          i.field === "canonical" && i.message.includes("duplicate canonical"),
      ),
    ).toBe(true);
  });

  it("flags a noindex page marked for the sitemap", () => {
    const issues = validateOptions(
      options({
        "/private": { title: "Private", noindex: true, sitemap: true },
      }),
    );
    expect(issues.some((i) => i.field === "sitemap")).toBe(true);
  });

  it("flags a sitemap-excluded page with hreflang alternates", () => {
    const issues = validateOptions(
      options({
        "/x": {
          title: "X",
          sitemap: false,
          alternates: [{ hreflang: "en", href: "/en" }],
        },
      }),
    );
    expect(issues.some((i) => i.field === "sitemap")).toBe(true);
  });

  it("allows a deliberately sitemap-excluded page with no alternates", () => {
    const issues = validateOptions(
      options({ "/x": { title: "X", noindex: false, sitemap: false } }),
    );
    expect(issues.some((i) => i.field === "sitemap")).toBe(false);
  });

  it("flags non-reciprocal hreflang alternates", () => {
    const issues = validateOptions(
      options({
        "/a": {
          title: "A",
          description: LONG_DESC,
          lang: "en",
          alternates: [{ hreflang: "fr", href: "/b" }],
        },
        "/b": { title: "B", description: LONG_DESC, lang: "fr" },
      }),
    );
    expect(
      issues.some(
        (i) => i.field === "alternates" && i.message.includes("reciprocity"),
      ),
    ).toBe(true);
  });

  it("accepts reciprocal hreflang alternates", () => {
    const issues = validateOptions(
      options({
        "/a": {
          title: "A",
          description: LONG_DESC,
          lang: "en",
          alternates: [{ hreflang: "fr", href: "/b" }],
        },
        "/b": {
          title: "B",
          description:
            "Learn about our company, our team, and what we build every day.",
          lang: "fr",
          alternates: [{ hreflang: "en", href: "/a" }],
        },
      }),
    );
    expect(issues).toEqual([]);
  });

  it("ignores alternates that point outside the configured pages", () => {
    const issues = validateOptions(
      options({
        "/a": {
          title: "A",
          description: LONG_DESC,
          lang: "en",
          alternates: [{ hreflang: "fr", href: "https://example.com/fr" }],
        },
      }),
    );
    expect(issues.some((i) => i.field === "alternates")).toBe(false);
  });

  it("flags robots user-agents that cannot match a crawler", () => {
    const opts = options();
    opts.robotsEnabled = true;
    opts.robots = { userAgent: "Mozilla/5.0 (compatible; FooBot)" };
    const issues = validateOptions(opts);
    expect(issues.some((i) => i.field === "robots.userAgent")).toBe(true);
  });

  it("accepts RFC 9309 product tokens", () => {
    const opts = options();
    opts.robotsEnabled = true;
    opts.robots = {
      userAgent: ["*", "Googlebot-News", "GPTBot"],
      groups: [{ userAgent: "bing_bot" }],
    };
    expect(validateOptions(opts)).toEqual([]);
  });

  it("flags negative crawl delays", () => {
    const opts = options();
    opts.robotsEnabled = true;
    opts.robots = {
      crawlDelay: -1,
      groups: [{ userAgent: "Googlebot", crawlDelay: Number.NaN }],
    };
    const issues = validateOptions(opts);
    expect(issues.filter((i) => i.field === "robots.crawlDelay")).toHaveLength(
      2,
    );
  });

  it("skips robots validation when robots are disabled", () => {
    const opts = options();
    opts.robots = { userAgent: "not a token" };
    expect(
      validateOptions(opts).some((i) => i.field === "robots.userAgent"),
    ).toBe(false);
  });

  it("returns no issues for a clean config", () => {
    expect(
      validateOptions(
        options({
          "/": { title: "Home", description: LONG_DESC },
          "/about": {
            title: "About",
            description:
              "Learn about our company, our team, and what we build every day.",
          },
        }),
      ),
    ).toEqual([]);
  });

  it("flags unparseable Article dates but accepts loose date strings", () => {
    const issues = validateOptions(
      options({
        "/bad": {
          title: "Bad",
          description: LONG_DESC,
          jsonLd: {
            article: {
              headline: "Hello",
              datePublished: "not a date",
              dateModified: new Date("bad"),
            },
          },
        },
        "/good": {
          title: "Good",
          description: LONG_DESC,
          jsonLd: {
            article: { headline: "Hello", datePublished: "Jan 1 2024" },
          },
        },
      }),
    );
    expect(
      issues.filter(
        (i) => i.route === "/bad" && i.field.startsWith("jsonLd.article.date"),
      ),
    ).toHaveLength(2);
    expect(
      issues.some(
        (i) => i.route === "/good" && i.field.startsWith("jsonLd.article"),
      ),
    ).toBe(false);
  });

  it("flags an overly long Article headline", () => {
    const issues = validateOptions(
      options({
        "/": {
          title: "Home",
          description: LONG_DESC,
          jsonLd: { article: { headline: "x".repeat(111) } },
        },
      }),
    );
    expect(issues.some((i) => i.field === "jsonLd.article.headline")).toBe(
      true,
    );
  });

  it("flags aggregateRating without a count and accepts ratingCount", () => {
    const issues = validateOptions(
      options({
        "/bad": {
          title: "Bad",
          description: LONG_DESC,
          jsonLd: { product: { name: "Widget", ratingValue: 5 } },
        },
        "/good": {
          title: "Good",
          description: LONG_DESC,
          jsonLd: {
            product: { name: "Widget", ratingValue: 5, ratingCount: 12 },
          },
        },
      }),
    );
    expect(
      issues.some(
        (i) =>
          i.route === "/bad" && i.field === "jsonLd.product.aggregateRating",
      ),
    ).toBe(true);
    expect(
      issues.some(
        (i) =>
          i.route === "/good" && i.field === "jsonLd.product.aggregateRating",
      ),
    ).toBe(false);
  });

  it("flags a WebSite searchUrl without the search term placeholder", () => {
    const issues = validateOptions(
      options(
        { "/": { title: "Home", description: LONG_DESC } },
        {
          ...BASE_SITE,
          jsonLd: {
            website: { searchUrl: "https://example.com/search?q=term" },
          },
        },
      ),
    );
    expect(issues.some((i) => i.field === "jsonLd.website.searchUrl")).toBe(
      true,
    );
  });

  it("accepts a WebSite searchUrl with the search term placeholder", () => {
    const issues = validateOptions(
      options(
        { "/": { title: "Home", description: LONG_DESC } },
        {
          ...BASE_SITE,
          jsonLd: {
            website: {
              searchUrl: "https://example.com/search?q={search_term_string}",
            },
          },
        },
      ),
    );
    expect(issues).toEqual([]);
  });
});

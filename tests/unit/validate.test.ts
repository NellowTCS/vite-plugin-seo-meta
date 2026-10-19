import { describe, expect, it } from "vitest";
import { resolveSite } from "../../src/config/resolve";
import { resolvePage } from "../../src/head/merge";
import { validatePage, validateOptions } from "../../src/validate";
import type { ResolvedOptions, SiteConfig } from "../../src/types";

const BASE_SITE: SiteConfig = { url: "https://example.com", name: "Example" };
const LONG_DESC =
  "Welcome home to our example site, where you can learn more about who we are.";

function options(meta: Record<string, any> = {}): ResolvedOptions {
  return {
    site: resolveSite(BASE_SITE),
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
});

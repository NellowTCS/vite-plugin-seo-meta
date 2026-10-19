import { describe, expect, it } from "vitest";
import { buildRobots, mergeRobots, noindexDisallow } from "../../../src/files/robots";
import type { ResolvedPage, ResolvedSite } from "../../../src/types";

const SITE: ResolvedSite = {
  url: "https://example.com",
  locale: "en_US",
  keywords: [],
  robotsByUserAgent: {},
  favicon: {},
  openGraph: { type: "website" },
  jsonLd: {},
};

function page(route: string, extra: Partial<ResolvedPage> = {}): ResolvedPage {
  return {
    route,
    title: "Page",
    canonical: `https://example.com${route}`,
    keywords: [],
    noindex: false,
    robotsByUserAgent: {},
    openGraph: {} as ResolvedPage["openGraph"],
    twitter: {} as ResolvedPage["twitter"],
    jsonLd: [],
    alternates: [],
    meta: {},
    links: [],
    sitemap: true,
    ...extra,
  } as ResolvedPage;
}

describe("buildRobots", () => {
  it("renders a default group with no rules", () => {
    expect(buildRobots(SITE, {})).toBe("User-agent: *\n\nSitemap: https://example.com/sitemap.xml\n");
  });

  it("renders the RFC 9309 simple example", () => {
    const txt = buildRobots(SITE, {
      userAgent: "*",
      disallow: ["*.gif$", "/example/"],
      allow: ["/publications/"],
    });
    expect(txt).toContain("User-agent: *");
    expect(txt).toContain("Disallow: *.gif$");
    expect(txt).toContain("Disallow: /example/");
    expect(txt).toContain("Allow: /publications/");
  });

  it("passes through the * and $ wildcards verbatim", () => {
    const txt = buildRobots(SITE, { disallow: ["/private/*.html$"] });
    expect(txt).toContain("Disallow: /private/*.html$");
  });

  it("emits multiple user-agent lines for a group", () => {
    const txt = buildRobots(SITE, { userAgent: ["barbot", "bazbot"], disallow: ["/example/page.html"] });
    expect(txt).toContain("User-agent: barbot\nUser-agent: bazbot\nDisallow: /example/page.html");
  });

  it("emits additional groups after the default", () => {
    const txt = buildRobots(SITE, {
      userAgent: "*",
      disallow: ["/a"],
      groups: [{ userAgent: "foobot", disallow: ["/foo"], allow: ["/example/page.html"] }],
    });
    expect(txt).toContain("User-agent: *\nDisallow: /a");
    expect(txt).toContain("User-agent: foobot\nDisallow: /foo\nAllow: /example/page.html");
  });

  it("emits Crawl-delay and Clean-param", () => {
    const txt = buildRobots(SITE, { crawlDelay: 5, cleanParam: ["sessionid"] });
    expect(txt).toContain("Crawl-delay: 5");
    expect(txt).toContain("Clean-param: sessionid");
  });

  it("emits Clean-param as a list", () => {
    const txt = buildRobots(SITE, { cleanParam: ["sessionid", "ref"] });
    expect(txt).toContain("Clean-param: sessionid");
    expect(txt).toContain("Clean-param: ref");
  });

  it("emits a Host record outside any group", () => {
    const txt = buildRobots(SITE, { host: "example.com" });
    expect(txt).toContain("Host: example.com");
  });

  it("omits the Sitemap record when disabled", () => {
    const txt = buildRobots(SITE, { sitemap: false });
    expect(txt).not.toContain("Sitemap:");
  });

  it("uses a custom Sitemap URL", () => {
    const txt = buildRobots(SITE, { sitemap: "https://cdn.example.com/sitemap.xml" });
    expect(txt).toContain("Sitemap: https://cdn.example.com/sitemap.xml");
  });

  it("appends raw rules after the groups", () => {
    const txt = buildRobots(SITE, { rules: ["# custom", "Disallow: /tmp"] });
    expect(txt).toContain("# custom\nDisallow: /tmp");
  });

  it("does not emit Disallow for noindex pages unless disallowNoindex is set", () => {
    const pages = [page("/"), page("/private", { noindex: true })];
    expect(buildRobots(SITE, {}, noindexDisallow(pages, false))).not.toContain("Disallow: /private");
    expect(buildRobots(SITE, {}, noindexDisallow(pages, true))).toContain("Disallow: /private");
  });
});

describe("noindexDisallow", () => {
  it("returns routes of noindex pages", () => {
    expect(noindexDisallow([page("/a"), page("/b", { noindex: true })], true)).toEqual(["/b"]);
  });

  it("returns an empty list when disabled", () => {
    expect(noindexDisallow([page("/b", { noindex: true })], false)).toEqual([]);
  });
});

describe("mergeRobots", () => {
  it("uses the generated file when existing is blank", () => {
    const generated = buildRobots(SITE, { disallow: ["/a"] });
    expect(mergeRobots("   \n  ", generated)).toBe(generated);
  });

  it("appends generated directives, dropping duplicates", () => {
    const existing = "User-agent: *\nDisallow: /a\n";
    const generated = buildRobots(SITE, { disallow: ["/a", "/b"] });
    const merged = mergeRobots(existing, generated);
    expect(merged).toContain("Disallow: /a");
    expect(merged).toContain("Disallow: /b");
    expect((merged.match(/disallow: \/a/gi) ?? []).length).toBe(1);
  });

  it("dedupes case-insensitively and collapses whitespace", () => {
    const existing = "User-agent: *\nDISALLOW:/a\n";
    const generated = buildRobots(SITE, { disallow: ["/a"] });
    const merged = mergeRobots(existing, generated);
    expect((merged.match(/disallow:\s*\/a/gi) ?? []).length).toBe(1);
  });

  it("keeps comments and non-directive lines from the existing file", () => {
    const existing = "# my robots\nUser-agent: *\n";
    const merged = mergeRobots(existing, buildRobots(SITE, {}));
    expect(merged.startsWith("# my robots\n")).toBe(true);
  });
});
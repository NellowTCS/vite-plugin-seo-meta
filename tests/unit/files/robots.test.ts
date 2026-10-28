import { describe, expect, it } from "vitest";
import {
  buildRobots,
  mergeRobots,
  noindexDisallow,
} from "../../../src/files/robots";
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
    expect(buildRobots(SITE, {})).toBe(
      "User-agent: *\n\nSitemap: https://example.com/sitemap.xml\n",
    );
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
    const txt = buildRobots(SITE, {
      userAgent: ["barbot", "bazbot"],
      disallow: ["/example/page.html"],
    });
    expect(txt).toContain(
      "User-agent: barbot\nUser-agent: bazbot\nDisallow: /example/page.html",
    );
  });

  it("emits additional groups after the default", () => {
    const txt = buildRobots(SITE, {
      userAgent: "*",
      disallow: ["/a"],
      groups: [
        {
          userAgent: "foobot",
          disallow: ["/foo"],
          allow: ["/example/page.html"],
        },
      ],
    });
    expect(txt).toContain("User-agent: *\nDisallow: /a");
    expect(txt).toContain(
      "User-agent: foobot\nDisallow: /foo\nAllow: /example/page.html",
    );
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
    const txt = buildRobots(SITE, {
      sitemap: "https://cdn.example.com/sitemap.xml",
    });
    expect(txt).toContain("Sitemap: https://cdn.example.com/sitemap.xml");
  });

  it("appends raw rules after the groups", () => {
    const txt = buildRobots(SITE, { rules: ["# custom", "Disallow: /tmp"] });
    expect(txt).toContain("# custom\nDisallow: /tmp");
  });

  it("does not emit Disallow for noindex pages unless disallowNoindex is set", () => {
    const pages = [page("/"), page("/private", { noindex: true })];
    expect(buildRobots(SITE, {}, noindexDisallow(pages, false))).not.toContain(
      "Disallow: /private",
    );
    expect(buildRobots(SITE, {}, noindexDisallow(pages, true))).toContain(
      "Disallow: /private",
    );
  });
});

describe("noindexDisallow", () => {
  it("returns routes of noindex pages", () => {
    expect(
      noindexDisallow([page("/a"), page("/b", { noindex: true })], true),
    ).toEqual(["/b"]);
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

  it("appends generated rules to the matching user-agent group", () => {
    const existing =
      "User-agent: *\nDisallow: /a\n\n" +
      "User-agent: foobot\nDisallow: /foo\n";
    const generated = buildRobots(SITE, {
      userAgent: "*",
      disallow: ["/a", "/b"],
      groups: [{ userAgent: "foobot", disallow: ["/foo", "/bar"] }],
    });
    const merged = mergeRobots(existing, generated);

    // The * group's new rule lands between the two groups, not at the end
    const starGroup = merged.match(
      /User-agent: \*\n([\s\S]*?)(?=User-agent:|$)/,
    );
    expect(starGroup).not.toBeNull();
    const starRules = starGroup![1]!;
    expect(starRules).toContain("Disallow: /a");
    expect(starRules).toContain("Disallow: /b");
    expect((starRules.match(/disallow: \/a/gi) ?? []).length).toBe(1);

    const fooGroup = merged.match(/User-agent: foobot\n([\s\S]*?)(?=\n\n|$)/);
    expect(fooGroup).not.toBeNull();
    const fooRules = fooGroup![1]!;
    expect(fooRules).toContain("Disallow: /foo");
    expect(fooRules).toContain("Disallow: /bar");
    expect(fooRules).not.toContain("Sitemap:");
    expect((fooRules.match(/disallow: \/foo/gi) ?? []).length).toBe(1);
  });

  it("appends a generated group whole when the file has no such group", () => {
    const existing = "User-agent: *\nDisallow: /a\n";
    const generated = buildRobots(SITE, {
      userAgent: "*",
      groups: [{ userAgent: "newbot", disallow: ["/newpath"] }],
    });
    const merged = mergeRobots(existing, generated);

    expect(merged).toContain("User-agent: newbot\nDisallow: /newpath");
    expect(merged.indexOf("User-agent: newbot")).toBeGreaterThan(
      merged.indexOf("Disallow: /a"),
    );
  });

  it("dedupes Host and Sitemap records across the file", () => {
    const existing =
      "Host: example.com\nSitemap: https://example.com/sitemap.xml\n";
    const generated = buildRobots(SITE, { host: "example.com" });
    const merged = mergeRobots(existing, generated);

    expect((merged.match(/Host: example.com/gi) ?? []).length).toBe(1);
    expect((merged.match(/Sitemap:/gi) ?? []).length).toBe(1);
  });

  it("keeps a generated rule that another group already has", () => {
    const existing = "User-agent: GPTBot\nDisallow: /\n";
    const generated = buildRobots(SITE, { userAgent: "*", disallow: ["/"] });
    const merged = mergeRobots(existing, generated);

    const starGroup = merged.match(/User-agent: \*\n([\s\S]*?)(?=\n\n|$)/);
    expect(starGroup).not.toBeNull();
    expect(starGroup![1]!).toContain("Disallow: /");
  });

  it("does not split a run of User-agent lines when merging", () => {
    const existing = "User-agent: a\nUser-agent: b\nDisallow: /shared\n";
    const generated = buildRobots(SITE, { userAgent: "a", disallow: ["/new"] });
    const merged = mergeRobots(existing, generated);

    expect(merged.indexOf("Disallow: /new")).toBeGreaterThan(
      merged.indexOf("Disallow: /shared"),
    );
    expect(merged).toContain("User-agent: a\nUser-agent: b\nDisallow: /shared");
  });

  it("keys generated groups by their whole agent set", () => {
    const existing = "User-agent: a\nUser-agent: b\nDisallow: /shared\n";
    const generated = buildRobots(SITE, {
      userAgent: ["a", "b"],
      disallow: ["/new"],
    });
    const merged = mergeRobots(existing, generated);

    // [a, b] is one group, so the generated rule merges into the shared run
    expect(merged.indexOf("Disallow: /new")).toBeGreaterThan(
      merged.indexOf("Disallow: /shared"),
    );
  });
});

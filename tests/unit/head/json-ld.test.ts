import { describe, expect, it } from "vitest";
import { resolveSite } from "../../../src/config/resolve";
import { buildJsonLd } from "../../../src/head/tags/json-ld";
import type { JsonLdConfig, SiteConfig } from "../../../src/types";

const BASE_SITE: SiteConfig = { url: "https://example.com", name: "Example" };

function build(
  pageConfig: JsonLdConfig | undefined,
  siteConfig: JsonLdConfig | undefined = undefined,
): Record<string, unknown>[] {
  const site = resolveSite({ ...BASE_SITE, jsonLd: siteConfig });
  return buildJsonLd(site, pageConfig, {
    title: "A page",
    description: "A description",
    canonical: "https://example.com/page",
    image: "/img.png",
    author: "Fallback Author",
  });
}

const nodeOfType = (nodes: Record<string, unknown>[], type: string) =>
  nodes.find((node) => node["@type"] === type);

describe("buildJsonLd", () => {
  it("emits nothing when nothing is configured", () => {
    expect(build(undefined)).toEqual([]);
  });

  it("prepends a WebPage node describing the current page", () => {
    const nodes = build({ article: { headline: "Hello" } });
    expect(nodes[0]).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebPage",
      url: "https://example.com/page",
      name: "A page",
      description: "A description",
    });
  });

  it("skips an Article with no headline", () => {
    expect(
      nodeOfType(build({ article: { headline: "" } }), "Article"),
    ).toBeUndefined();
  });

  it("normalizes Date article dates to ISO 8601", () => {
    const article = nodeOfType(
      build({
        article: {
          headline: "Hello",
          datePublished: new Date("2024-01-02T03:04:05Z"),
          dateModified: new Date("2024-06-20T00:00:00Z"),
        },
      }),
      "Article",
    );
    expect(article?.datePublished).toBe("2024-01-02T03:04:05.000Z");
    expect(article?.dateModified).toBe("2024-06-20T00:00:00.000Z");
  });

  it("normalizes loose date strings to ISO 8601", () => {
    const article = nodeOfType(
      build({
        article: { headline: "Hello", datePublished: "Jan 1 2024" },
      }),
      "Article",
    );
    expect(article?.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(article?.datePublished).toBe(
      new Date(Date.parse("Jan 1 2024")).toISOString(),
    );
  });

  it("drops article dates that do not parse", () => {
    const article = nodeOfType(
      build({
        article: {
          headline: "Hello",
          datePublished: "not a date",
          dateModified: new Date("bad"),
        },
      }),
      "Article",
    );
    expect(article).toBeDefined();
    expect(article).not.toHaveProperty("datePublished");
    expect(article).not.toHaveProperty("dateModified");
  });

  it("emits a string author as a Person", () => {
    const article = nodeOfType(
      build({ article: { headline: "Hello", author: "Alice" } }),
      "Article",
    );
    expect(article?.author).toEqual({ "@type": "Person", name: "Alice" });
  });

  it("emits an Organization author when @type is set", () => {
    const article = nodeOfType(
      build({
        article: {
          headline: "Hello",
          author: {
            "@type": "Organization",
            name: "Acme",
            url: "https://acme.example",
            sameAs: ["https://social.example/acme"],
          },
        },
      }),
      "Article",
    );
    expect(article?.author).toEqual({
      "@type": "Organization",
      name: "Acme",
      url: "https://acme.example",
      sameAs: ["https://social.example/acme"],
    });
  });

  it("defaults an object author to a Person and keeps sameAs", () => {
    const article = nodeOfType(
      build({
        article: {
          headline: "Hello",
          author: {
            name: "Alice",
            sameAs: ["https://social.example/alice"],
          },
        },
      }),
      "Article",
    );
    expect(article?.author).toEqual({
      "@type": "Person",
      name: "Alice",
      sameAs: ["https://social.example/alice"],
    });
  });

  it("emits a publisher as an Organization by default", () => {
    const article = nodeOfType(
      build({ article: { headline: "Hello", publisher: "Acme Inc" } }),
      "Article",
    );
    expect(article?.publisher).toEqual({
      "@type": "Organization",
      name: "Acme Inc",
    });
  });

  it("omits a publisher when none is configured", () => {
    const article = nodeOfType(
      build({ article: { headline: "Hello" } }),
      "Article",
    );
    expect(article).not.toHaveProperty("publisher");
  });

  it("emits price zero and short availability names", () => {
    const product = nodeOfType(
      build({
        product: { name: "Widget", price: 0, availability: "InStock" },
      }),
      "Product",
    );
    expect(product?.offers).toEqual({
      "@type": "Offer",
      price: 0,
      availability: "https://schema.org/InStock",
    });
  });

  it("passes full availability URLs through and strips leading slashes", () => {
    const full = nodeOfType(
      build({
        product: {
          name: "A",
          price: 1,
          availability: "https://schema.org/OutOfStock",
        },
      }),
      "Product",
    );
    expect(full).toMatchObject({
      offers: { availability: "https://schema.org/OutOfStock" },
    });

    const slash = nodeOfType(
      build({ product: { name: "B", price: 1, availability: "/InStock" } }),
      "Product",
    );
    expect(slash).toMatchObject({
      offers: { availability: "https://schema.org/InStock" },
    });
    expect(JSON.stringify(slash)).not.toContain("//InStock");
  });

  it("emits ratingCount and reviewCount on AggregateRating", () => {
    const product = nodeOfType(
      build({
        product: {
          name: "Widget",
          ratingValue: 4.8,
          ratingCount: 127,
          reviewCount: 42,
        },
      }),
      "Product",
    );
    expect(product?.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.8,
      ratingCount: 127,
      reviewCount: 42,
    });
  });

  it("omits rating counts that are not configured", () => {
    const product = nodeOfType(
      build({ product: { name: "Widget", ratingValue: 4 } }),
      "Product",
    );
    expect(product?.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4,
    });
  });

  it("emits the SearchAction with the URL template verbatim", () => {
    const website = nodeOfType(
      build(undefined, {
        website: {
          searchUrl: "https://example.com/search?q={search_term_string}",
        },
      }),
      "WebSite",
    );
    expect(website?.potentialAction).toEqual({
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://example.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    });
  });

  it("emits site-wide Organization markup on every page", () => {
    expect(
      nodeOfType(build(undefined, { organization: true }), "Organization"),
    ).toBeDefined();
    expect(
      nodeOfType(
        build({ article: { headline: "Hi" } }, { organization: true }),
        "Organization",
      ),
    ).toBeDefined();
  });
});

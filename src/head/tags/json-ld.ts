/** JSON-LD structured data builders */

import type {
  ArticleJsonLd,
  HeadTag,
  JsonLdConfig,
  JsonLdPerson,
  OrganizationJsonLd,
  ProductJsonLd,
  ResolvedPage,
  ResolvedSite,
  WebSiteJsonLd,
} from "../../types";
import { toAbsolute } from "../../url";

/** A single JSON-LD node */
type JsonLdNode = Record<string, unknown>;

/** Values shared by the page-level nodes */
export interface PageContext {
  title: string;
  description?: string;
  canonical: string;
  image?: string;
  author?: string;
}

const CONTEXT = "https://schema.org";

/** Turns `InStock` into `https://schema.org/InStock`, leaving full URLs alone */
function schemaUrl(value: string): string {
  return value.startsWith("http") ? value : `${CONTEXT}/${value}`;
}

/** Normalizes an Author into a `Person` node */
function personFrom(
  author: string | JsonLdPerson | undefined,
): JsonLdNode | undefined {
  if (!author) return undefined;
  if (typeof author === "string") return { "@type": "Person", name: author };
  const person: JsonLdNode = { "@type": "Person", name: author.name };
  if (author.url) person.url = author.url;
  return person;
}

/** `Organization` node, from site name/url or an explicit object */
function buildOrganization(
  site: ResolvedSite,
  config: boolean | OrganizationJsonLd,
): JsonLdNode | undefined {
  if (config === false) return undefined;
  const source: OrganizationJsonLd | undefined =
    config === true ? (site.name ? { name: site.name } : undefined) : config;
  if (!source) return undefined;
  const node: JsonLdNode = {
    "@context": CONTEXT,
    "@type": "Organization",
    name: source.name,
  };
  node.url = source.url ? toAbsolute(source.url, site.url) : site.url;
  if (source.logo) node.logo = toAbsolute(source.logo, site.url);
  if (source.sameAs) node.sameAs = source.sameAs;
  return node;
}

/** `WebSite` node, with a `SearchAction` when `searchUrl` is set */
function buildWebSite(
  site: ResolvedSite,
  config: boolean | WebSiteJsonLd,
): JsonLdNode | undefined {
  if (config === false) return undefined;
  const source: WebSiteJsonLd =
    config === true
      ? { name: site.name, url: site.url, description: site.description }
      : config;
  const node: JsonLdNode = { "@context": CONTEXT, "@type": "WebSite" };
  const name = source.name ?? site.name;
  const url = source.url ? toAbsolute(source.url, site.url) : site.url;
  const description = source.description ?? site.description;
  if (name) node.name = name;
  if (url) node.url = url;
  if (description) node.description = description;
  if (source.searchUrl) {
    node.potentialAction = {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: source.searchUrl },
      "query-input": "required name=search_term_string",
    };
  }
  return node;
}

/** `WebPage` node describing the current page, derived from the resolved values */
function buildWebPage(ctx: PageContext): JsonLdNode {
  const node: JsonLdNode = {
    "@context": CONTEXT,
    "@type": "WebPage",
    url: ctx.canonical,
  };
  if (ctx.title) node.name = ctx.title;
  if (ctx.description) node.description = ctx.description;
  if (ctx.image)
    node.primaryImageOfPage = { "@type": "ImageObject", url: ctx.image };
  return node;
}

/** `Article`/`BlogPosting` node, page level only */
function buildArticle(
  ctx: PageContext,
  site: ResolvedSite,
  config: boolean | ArticleJsonLd,
): JsonLdNode | undefined {
  if (config === false) return undefined;
  const source: ArticleJsonLd =
    config === true
      ? {
          headline: ctx.title,
          description: ctx.description,
          image: ctx.image,
          author: ctx.author,
        }
      : config;
  if (!source.headline) return undefined;
  const node: JsonLdNode = {
    "@context": CONTEXT,
    "@type": source.type ?? "Article",
    headline: source.headline,
  };
  if (source.description) node.description = source.description;
  if (source.image) node.image = toAbsolute(source.image, site.url);
  if (source.datePublished) node.datePublished = source.datePublished;
  if (source.dateModified) node.dateModified = source.dateModified;
  const author = personFrom(source.author);
  if (author) node.author = author;
  return node;
}

/** `Product` node, page level only */
function buildProduct(
  ctx: PageContext,
  site: ResolvedSite,
  config: boolean | ProductJsonLd,
): JsonLdNode | undefined {
  if (config === false) return undefined;
  const source: ProductJsonLd =
    config === true
      ? { name: ctx.title, description: ctx.description, image: ctx.image }
      : config;
  if (!source.name) return undefined;
  const node: JsonLdNode = {
    "@context": CONTEXT,
    "@type": "Product",
    name: source.name,
  };
  if (source.description) node.description = source.description;
  if (source.image) node.image = toAbsolute(source.image, site.url);
  if (source.sku) node.sku = source.sku;
  if (source.brand) node.brand = { "@type": "Brand", name: source.brand };
  if (source.price !== undefined) {
    const offer: JsonLdNode = { "@type": "Offer", price: source.price };
    if (source.priceCurrency) offer.priceCurrency = source.priceCurrency;
    if (source.availability)
      offer.availability = schemaUrl(source.availability);
    node.offers = offer;
  }
  if (source.ratingValue !== undefined) {
    const rating: JsonLdNode = {
      "@type": "AggregateRating",
      ratingValue: source.ratingValue,
    };
    if (source.reviewCount !== undefined)
      rating.reviewCount = source.reviewCount;
    node.aggregateRating = rating;
  }
  return node;
}

/**
 * Assembles every JSON-LD node for a page
 * - a `WebPage` node is prepended whenever anything else is present
 * - returns an empty array when nothing is configured, so no script is emitted
 */
export function buildJsonLd(
  site: ResolvedSite,
  pageConfig: JsonLdConfig | undefined,
  ctx: PageContext,
): JsonLdNode[] {
  const siteConfig = site.jsonLd;
  const nodes: JsonLdNode[] = [];

  if (siteConfig.organization) {
    const node = buildOrganization(site, siteConfig.organization);
    if (node) nodes.push(node);
  }
  if (siteConfig.website) {
    const node = buildWebSite(site, siteConfig.website);
    if (node) nodes.push(node);
  }
  if (pageConfig?.article) {
    const node = buildArticle(ctx, site, pageConfig.article);
    if (node) nodes.push(node);
  }
  if (pageConfig?.product) {
    const node = buildProduct(ctx, site, pageConfig.product);
    if (node) nodes.push(node);
  }
  nodes.push(...(siteConfig.extra ?? []), ...(pageConfig?.extra ?? []));

  return nodes.length === 0 ? [] : [buildWebPage(ctx), ...nodes];
}

/** Serializes JSON-LD, escaping `<` and the JS line separators so it is safe inside a `<script>` */
// I know, ew, raw Unicode, but it's the easiest way
function serializeJsonLd(nodes: JsonLdNode[]): string {
  return JSON.stringify(nodes)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

// So we don't support existing JSON-LD, those are removed and replaced with generated stuff
// The reason why is a bit of a pain:
//  - merging existing JSON-LD with generated JSON-LD is a nightmare, because the existing stuff 
//    could be anything, and we don't know what it is (YES XSS TOO AAAAA).
//  - Also, there's no point tbh as you can just add it to our config and let us do the hard work
//
// "Trust *us* with your JSON-LD" ~ Vox-but-SEO-edition
/** One `<script type="application/ld+json">`, or nothing when the page has no nodes */
export function jsonLdTags(page: ResolvedPage): HeadTag[] {
  if (page.jsonLd.length === 0) return [];
  return [
    {
      tag: "script",
      attrs: { type: "application/ld+json" },
      text: serializeJsonLd(page.jsonLd),
      key: "script:jsonld",
    },
  ];
}

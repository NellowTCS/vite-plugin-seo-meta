import { absolutize, toKeywords } from "../config/resolve";
import { buildJsonLd } from "./tags/json-ld";
import type {
  HreflangAlternate,
  OpenGraphInfo,
  ResolvedOptions,
  ResolvedPage,
  TwitterInfo,
} from "../types";
import { normalizeRoute, toAbsolute } from "../url";

const DEFAULT_TWITTER_CARD = "summary_large_image";
const MENTIONS_NOINDEX = /\b(noindex|none)\b/i;

/** Applies the `%s` title template when there is both a template and a title */
function applyTitleTemplate(rawTitle: string, template: string | undefined): string {
  if (!template || !rawTitle) return rawTitle;
  return template.replace("%s", rawTitle);
}

/**
 * Resolves the document title
 */
function resolveTitle(pageTitle: string | undefined, site: ResolvedOptions["site"]): string {
  if (pageTitle) return applyTitleTemplate(pageTitle, site.titleTemplate);
  return site.title ?? site.name ?? "";
}

/** Absolutizes (fun word) every alternate href, passing through relative ones */
function resolveAlternates(
  alternates: HreflangAlternate[] | undefined,
  siteUrl: string,
): HreflangAlternate[] {
  return (alternates ?? []).map((alternate) => ({
    hreflang: alternate.hreflang,
    href: toAbsolute(alternate.href, siteUrl),
  }));
}

/** Builds the Open Graph information for a page */
function resolveOpenGraph(
  page: ResolvedOptions["pageMeta"][string],
  site: ResolvedOptions["site"],
  fallback: { title: string; description?: string; canonical: string; image?: string; imageAlt?: string },
): OpenGraphInfo {
  const openGraph = page.openGraph;
  return {
    ...site.openGraph,
    ...openGraph,
    title: openGraph?.title ?? fallback.title,
    description: openGraph?.description ?? fallback.description,
    url: openGraph?.url ?? fallback.canonical,
    siteName: openGraph?.siteName ?? site.openGraph.siteName,
    locale: openGraph?.locale ?? site.openGraph.locale,
    image: absolutize(openGraph?.image ?? fallback.image ?? site.openGraph.image, site.url),
    imageAlt: openGraph?.imageAlt ?? fallback.imageAlt ?? site.openGraph.imageAlt,
  };
}

/** Same as Open Graph but for the Twitter card fields */
function resolveTwitter(
  page: ResolvedOptions["pageMeta"][string],
  site: ResolvedOptions["site"],
  fallback: OpenGraphInfo,
): TwitterInfo {
  return {
    card: page.twitter?.card ?? site.twitter?.card ?? DEFAULT_TWITTER_CARD,
    title: page.twitter?.title ?? fallback.title,
    description: page.twitter?.description ?? fallback.description,
    site: page.twitter?.site ?? site.twitter?.site,
    creator: page.twitter?.creator ?? site.twitter?.creator,
    image: absolutize(page.twitter?.image ?? fallback.image, site.url),
    imageAlt: page.twitter?.imageAlt ?? fallback.imageAlt,
  };
}

/**
 * Resolves a route into a populated page (heh, alliteration)
 * - `noindex` implies `sitemap: false` unless the page says otherwise.
 */
export function resolvePage(route: string, options: ResolvedOptions): ResolvedPage {
  const normalized = normalizeRoute(route);
  const page = options.pageMeta[normalized] ?? {};
  const site = options.site;

  const canonical = page.canonical ? toAbsolute(page.canonical, site.url) : toAbsolute(normalized, site.url);
  const title = resolveTitle(page.title, site);
  const description = page.description ?? site.description;
  const image = absolutize(page.image ?? site.image, site.url);
  const imageAlt = page.imageAlt ?? site.imageAlt;
  const author = page.author ?? site.author;
  const noindex = page.noindex ?? MENTIONS_NOINDEX.test(page.robots ?? "");

  const openGraph = resolveOpenGraph(page, site, { title, description, canonical, image, imageAlt });
  const twitter = resolveTwitter(page, site, openGraph);

  return {
    route: normalized,
    title,
    description,
    canonical,
    image,
    imageAlt,
    keywords: page.keywords !== undefined ? toKeywords(page.keywords) : site.keywords,
    author,
    robots: page.robots ?? (noindex ? "noindex, nofollow" : undefined),
    noindex,
    openGraph,
    twitter,
    jsonLd: buildJsonLd(site, page.jsonLd, { title, description, canonical, image, author }),
    alternates: resolveAlternates(page.alternates, site.url),
    meta: page.meta ?? {},
    links: (page.links ?? []).map((link) => ({ ...link, href: toAbsolute(link.href, site.url) })),
    sitemap: page.sitemap ?? !noindex,
    priority: page.priority,
    changefreq: page.changefreq,
    lastmod: page.lastmod instanceof Date ? page.lastmod.toISOString() : page.lastmod,
  };
}

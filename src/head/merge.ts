import { absolutize, toKeywords } from "../config/resolve";
import { normalizeLanguageTag } from "../locale";
import { resolveOpenGraph } from "./open-graph";
import { renderRobotsMeta } from "./robots-meta";
import { buildJsonLd } from "./tags/json-ld";
import type {
  HreflangAlternate,
  OpenGraphInfo,
  ResolvedOptions,
  ResolvedPage,
  RobotsDirectives,
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

/**
 * Normalizes alternate hreflang casing, absolutizes hrefs and appends a
 * self-referencing alternate (Google asks pages to list themselves sighhhhh)
 * - Blank hrefs and duplicate hreflangs get dropped
 *
 * Ref: https://developers.google.com/search/docs/specialty/international/localized-versions
 */
function resolveAlternates(
  alternates: HreflangAlternate[] | undefined,
  siteUrl: string,
  selfLanguage: string | undefined,
  canonical: string,
): HreflangAlternate[] {
  const resolved: HreflangAlternate[] = [];
  const seen = new Set<string>();
  const push = (hreflang: string, href: string) => {
    const tag = normalizeLanguageTag(hreflang);
    const target = toAbsolute(href, siteUrl);
    if (tag === "" || href === "" || seen.has(tag)) return;
    seen.add(tag);
    resolved.push({ hreflang: tag, href: target });
  };

  for (const alternate of alternates ?? []) push(alternate.hreflang, alternate.href);
  if (resolved.length > 0 && selfLanguage) push(selfLanguage, canonical);
  return resolved;
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

function resolveRobotsByUserAgent(
  siteMap: Record<string, string | RobotsDirectives>,
  pageMap: Record<string, string | RobotsDirectives> | undefined,
): Record<string, string> {
  const merged: Record<string, string | RobotsDirectives> = { ...siteMap, ...pageMap };
  const rendered: Record<string, string> = {};
  for (const [userAgent, value] of Object.entries(merged)) {
    const content = renderRobotsMeta(value);
    if (content !== undefined) rendered[userAgent] = content;
  }
  return rendered;
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
  const lang = normalizeLanguageTag(page.lang ?? site.lang ?? "") || undefined;
  const title = resolveTitle(page.title, site);
  const description = page.description ?? site.description;
  const image = absolutize(page.image ?? site.image, site.url);
  const imageAlt = page.imageAlt ?? site.imageAlt;
  const author = page.author ?? site.author;
  const pageRobots = renderRobotsMeta(page.robots);
  const noindex = page.noindex ?? MENTIONS_NOINDEX.test(pageRobots ?? "");
  const alternates = resolveAlternates(page.alternates, site.url, lang, canonical);

  const openGraph = resolveOpenGraph(
    page,
    site,
    { title, description, canonical, image, imageAlt },
    alternates,
    lang,
  );
  const twitter = resolveTwitter(page, site, openGraph);

  return {
    route: normalized,
    title,
    description,
    canonical,
    lang,
    image,
    imageAlt,
    keywords: page.keywords !== undefined ? toKeywords(page.keywords) : site.keywords,
    author,
    robots: pageRobots ?? (noindex ? "noindex, nofollow" : undefined),
    robotsByUserAgent: resolveRobotsByUserAgent(site.robotsByUserAgent, page.robotsByUserAgent),
    noindex,
    openGraph,
    twitter,
    jsonLd: buildJsonLd(site, page.jsonLd, { title, description, canonical, image, author }),
    alternates,
    meta: page.meta ?? {},
    links: (page.links ?? []).map((link) => ({ ...link, href: toAbsolute(link.href, site.url) })),
    sitemap: page.sitemap ?? !noindex,
    priority: page.priority,
    changefreq: page.changefreq,
    lastmod: page.lastmod instanceof Date ? page.lastmod.toISOString() : page.lastmod,
  };
}

/** sitemap.xml generation */

import { EnumChangefreq, SitemapStream, streamToPromise } from "sitemap";
import type { SitemapItemLoose } from "sitemap";
import xmlFormat from "xml-formatter";
import type { ResolvedPage, SitemapChangefreq, SitemapOptions } from "../types";

/** Maps our changefreq strings onto sitemap's enum (same values) */
const CHANGEFREQ: Record<SitemapChangefreq, EnumChangefreq> = {
  always: EnumChangefreq.ALWAYS,
  hourly: EnumChangefreq.HOURLY,
  daily: EnumChangefreq.DAILY,
  weekly: EnumChangefreq.WEEKLY,
  monthly: EnumChangefreq.MONTHLY,
  yearly: EnumChangefreq.YEARLY,
  never: EnumChangefreq.NEVER,
};

const EMPTY_SITEMAP =
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';

function formatXml(xml: string): string {
  const formatted = xmlFormat(xml, {
    indentation: "  ",
    lineSeparator: "\n",
    collapseContent: true,
  });
  return formatted.endsWith("\n") ? formatted : `${formatted}\n`;
}

/** One entry for a page, or undefined when it is excluded or opted out */
function toItem(
  page: ResolvedPage,
  options: SitemapOptions,
  exclude: Set<string>,
): SitemapItemLoose | undefined {
  if (!page.sitemap || !page.canonical) return undefined;
  if (exclude.has(page.route) || exclude.has(page.canonical)) return undefined;

  const changefreq = page.changefreq ?? options.defaultChangefreq;
  return {
    url: page.canonical,
    changefreq: changefreq ? CHANGEFREQ[changefreq] : undefined,
    priority: page.priority ?? options.defaultPriority,
    lastmod: page.lastmod,
    links: page.alternates.length > 0
      ? page.alternates.map((alternate) => ({ lang: alternate.hreflang, url: alternate.href }))
      : undefined,
  };
}

/**
 * Builds the contents of `sitemap.xml`
 * - Skips pages with `sitemap: false` (for example noindex) and any route in `exclude`
 * - Emits `xhtml:link` alternates for pages with hreflang companions
 *
 * @returns the XML contents, an empty `<urlset>` when nothing fits
 */
export async function buildSitemap(
  pages: ResolvedPage[],
  options: SitemapOptions = {},
): Promise<string> {
  const exclude = new Set(options.exclude ?? []);
  const items = pages
    .map((page) => toItem(page, options, exclude))
    .filter((item): item is SitemapItemLoose => item !== undefined);

  // Formatting XML, bite me
  if (items.length === 0) return formatXml(EMPTY_SITEMAP);

  const hasAlternates = items.some((item) => item.links && item.links.length > 0);
  const stream = new SitemapStream({
    xmlns: { news: false, image: false, video: false, xhtml: hasAlternates },
  });
  for (const item of items) stream.write(item);
  stream.end();

  return formatXml((await streamToPromise(stream)).toString());
}

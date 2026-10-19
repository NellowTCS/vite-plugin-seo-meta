/** sitemap.xml generation
 *
 * Ref: https://www.sitemaps.org/protocol.html
 * Image: https://support.google.com/webmasters/answer/74288?hl=en&ref_topic=4581190
 * Video: https://support.google.com/webmasters/answer/80471?hl=en&ref_topic=4581190
 * News: https://support.google.com/webmasters/answer/74288?hl=en&ref_topic=4581190
 */

import { EnumChangefreq, SitemapStream, streamToPromise } from "sitemap";
import type { Img, NewsItem, SitemapItemLoose, VideoItemLoose } from "sitemap";
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

/** Hard cap on URLs per sitemap file */
const MAX_URLS = 50_000;

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

/** Returns the origin (scheme + hostt) of a URL, or "" when it is not absolute */
function originOf(url: string): string {
  try {
    const parsed = new URL(url);
    if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || !parsed.host) return "";
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
}

/** Maps a page's structured media into sitemap image entries */
// I suspect this was made for Wikis (Wikipedia) and Google Images lolll
function imageItems(page: ResolvedPage): Img[] | undefined {
  const images = page.openGraph.images;
  if (!images || images.length === 0) return undefined;
  const out: Img[] = [];
  for (const ref of images) {
    if (!ref.src) continue;
    const item: Img = { url: ref.src };
    if (ref.alt) item.caption = ref.alt;
    if (ref.width !== undefined) item.title = String(ref.width);
    out.push(item);
  }
  return out.length > 0 ? out : undefined;
}

/** Maps a page's structured video into sitemap video entries */
// Gasp videos, almost like someone big might have a video platform *cough, cough* Youtube, 
// and want to index videos in search results. I wonder who that could be. (hint: it rhymes with "Poogle")
function videoItems(page: ResolvedPage): VideoItemLoose[] | undefined {
  const videos = page.openGraph.videos;
  if (!videos || videos.length === 0) return undefined;
  const out: VideoItemLoose[] = [];
  for (const ref of videos) {
    if (!ref.src) continue;
    const item: VideoItemLoose = {
      thumbnail_loc: ref.src,
      title: ref.alt ?? ref.src,
      description: ref.alt ?? "",
    };
    if (ref.width !== undefined && ref.height !== undefined) {
      item.tag = [`${ref.width}x${ref.height}`];
    }
    out.push(item);
  }
  return out.length > 0 ? out : undefined;
}

/** Maps a page's news article into a sitemap news entry */
// You ever wonder why a sitemap has a news entry? Well it's because of a little thing called
// Google News. Since GN aggregates all the news articles rather than making its own, it relies on websites 
// to tell it what articles are news. 
function newsItem(page: ResolvedPage): NewsItem | undefined {
  const article = page.openGraph.article;
  if (!article) return undefined;
  if (!article.publishedTime) return undefined;
  return {
    publication: {
      name: page.openGraph.siteName ?? "",
      language: page.lang ?? "en",
    },
    publication_date: article.publishedTime,
    title: page.title,
    keywords: article.tag ? article.tag.join(", ") : undefined,
  };
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
  const item: SitemapItemLoose = {
    url: page.canonical,
    changefreq: changefreq ? CHANGEFREQ[changefreq] : undefined,
    priority: page.priority ?? options.defaultPriority,
    lastmod: page.lastmod,
    img: imageItems(page),
    video: videoItems(page),
    news: newsItem(page),
    links: page.alternates.length > 0
      ? page.alternates.map((alternate) => ({ lang: alternate.hreflang, url: alternate.href }))
      : undefined,
  };
  return item;
}

/**
 * Builds the contents of `sitemap.xml`.
 * - Skips pages with `sitemap: false` (for example noindex) and any route in `exclude`
 * - Emits `xhtml:link` alternates, image, video, and news namespaces when any page uses them
 * - TODO: enforces a single-host sitemap, maybe change
 * - Caps the number of URLs per file (however, cause i'm nice, this is extensible)
 *
 * @returns the XML contents, an empty `<urlset>` when nothing fits
 */
export async function buildSitemap(
  pages: ResolvedPage[],
  options: SitemapOptions = {},
): Promise<string> {
  const exclude = new Set(options.exclude ?? []);
  const maxUrls = options.maxUrls ?? MAX_URLS;
  const siteOrigin = originOf(options.siteUrl ?? "");
  const items: SitemapItemLoose[] = [];
  for (const page of pages) {
    const item = toItem(page, options, exclude);
    if (!item) continue;
    if (siteOrigin && originOf(item.url) !== siteOrigin) continue;
    if (items.length >= maxUrls) continue;
    items.push(item);
  }

  if (items.length === 0) return formatXml(EMPTY_SITEMAP);

  const hasNews = items.some((item) => item.news !== undefined);
  const hasImage = items.some((item) => Array.isArray(item.img) && item.img.length > 0);
  const hasVideo = items.some((item) => Array.isArray(item.video) && item.video.length > 0);
  const hasAlternates = items.some((item) => item.links && item.links.length > 0);

  const stream = new SitemapStream({
    xmlns: { news: hasNews, image: hasImage, video: hasVideo, xhtml: hasAlternates },
  });
  for (const item of items) stream.write(item);
  stream.end();

  return formatXml((await streamToPromise(stream)).toString());
}

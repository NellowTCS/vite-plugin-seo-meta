/** sitemap.xml generation
 *
 * Refs:
 * - https://www.sitemaps.org/protocol.html
 * - Image: https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
 * - Video: https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps
 * - News: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */

import { EnumChangefreq, SitemapStream, streamToPromise } from "sitemap";
import type { Img, NewsItem, SitemapItemLoose, VideoItemLoose } from "sitemap";
import xmlFormat from "xml-formatter";
import type { ResolvedPage, SitemapChangefreq, SitemapOptions } from "../types";

/** Maps our changefreq strings onto sitemap's enum (wow how surprising they're the same values) */
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

/**
 * Verification pages and error pages; automatically excluded.
 */
const DEFAULT_EXCLUDE_PATTERNS = [
  /^\/404(?:\.html)?$/i,
  /^\/500(?:\.html)?$/i,
  // taken from online examples, but the regex is a bit more strict than the docs say it should be (for both)
  /^\/google(?=[0-9a-z-]*[0-9])[0-9a-z-]{10,}(?:\.html)?$/i,
  /^\/yandex_[0-9a-z]+$/i,
  // todo: add more for Bing, etc...
];

function isDefaultExcluded(route: string): boolean {
  return DEFAULT_EXCLUDE_PATTERNS.some((pattern) => pattern.test(route));
}

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
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      !parsed.host
    )
      return "";
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
}

/** Maps a page's structured media into sitemap image entries */
function imageItems(page: ResolvedPage): Img[] | undefined {
  const images = page.openGraph.images;
  if (!images || images.length === 0) return undefined;
  const out: Img[] = [];
  for (const ref of images) {
    if (!ref.src) continue;
    const item: Img = { url: ref.src };
    if (ref.alt) item.caption = ref.alt;
    out.push(item);
  }
  return out.length > 0 ? out : undefined;
}

/** Maps a page's structured video into sitemap video entries
 * - `content_loc` is the video media URL
 * - Important:`thumbnail_loc` is required by Google, so entries without an explicit thumbnail are skipped!
 */
function videoItems(page: ResolvedPage): VideoItemLoose[] | undefined {
  const videos = page.openGraph.videos;
  if (!videos || videos.length === 0) return undefined;
  const out: VideoItemLoose[] = [];
  for (const ref of videos) {
    if (!ref.src || !ref.thumbnail) continue;
    const description = ref.alt ?? page.title;
    const item: VideoItemLoose = {
      thumbnail_loc: ref.thumbnail,
      title: description,
      description,
      content_loc: ref.src,
    };
    out.push(item);
  }
  return out.length > 0 ? out : undefined;
}

/** Maps a page's news article into a sitemap news entry */
// You ever wonder why a sitemap has a news entry? Well it's because of a little thing called
// Google News. Since GN aggregates all the news articles rather than making its own,
// it relies on websites to tell it what articles are news.
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
  if (isDefaultExcluded(page.route)) return undefined;

  const changefreq = page.changefreq ?? options.defaultChangefreq;
  const item: SitemapItemLoose = {
    url: page.canonical,
    changefreq: changefreq ? CHANGEFREQ[changefreq] : undefined,
    priority: page.priority ?? options.defaultPriority,
    lastmod: page.lastmod,
    img: imageItems(page),
    video: videoItems(page),
    news: newsItem(page),
    links:
      page.alternates.length > 0
        ? page.alternates.map((alternate) => ({
            lang: alternate.hreflang,
            url: alternate.href,
          }))
        : undefined,
  };
  return item;
}

/**
 * Builds the contents of `sitemap.xml`.
 * - Skips pages with `sitemap: false` (for example noindex), any route in `exclude`, and error/verification files
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
  const hasImage = items.some(
    (item) => Array.isArray(item.img) && item.img.length > 0,
  );
  const hasVideo = items.some(
    (item) => Array.isArray(item.video) && item.video.length > 0,
  );
  const hasAlternates = items.some(
    (item) => item.links && item.links.length > 0,
  );

  const stream = new SitemapStream({
    xmlns: {
      news: hasNews,
      image: hasImage,
      video: hasVideo,
      xhtml: hasAlternates,
    },
  });
  for (const item of items) stream.write(item);
  stream.end();

  return formatXml((await streamToPromise(stream)).toString());
}

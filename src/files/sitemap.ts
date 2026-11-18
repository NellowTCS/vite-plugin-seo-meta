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

const MAX_SITEMAP_BYTES = 50 * 1024 * 1024;

/** Google caps images, video thumbnails, and news entries per URL/file */
const MAX_IMAGES = 1_000;
const MAX_NEWS = 1_000;

/** Google caps `<video:title>` and `<video:description>` */
const VIDEO_TITLE_MAX = 100;
const VIDEO_DESCRIPTION_MAX = 2_048;

/** Google only accepts news articles published within this window (weird... but sure) */
const NEWS_MAX_AGE_DAYS = 2;
const DAY_MS = 24 * 60 * 60 * 1_000;

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

/** Maps a page's structured media into sitemap image entries
 *
 * Note: https://developers.google.com/search/blog/2022/06/search-console-deprecations
 */
function imageItems(page: ResolvedPage): Img[] | undefined {
  const images = page.openGraph.images;
  if (!images || images.length === 0) return undefined;
  const out: Img[] = [];
  for (const ref of images) {
    if (!ref.src) continue;
    if (out.length >= MAX_IMAGES) break;
    out.push({ url: ref.src });
  }
  return out.length > 0 ? out : undefined;
}

/** Maps a page's structured video into sitemap video entries
 * - `content_loc` is the video media URL
 * - `player_loc` replaces `content_loc` when a player URL is configured
 * - Important: `thumbnail_loc` is required by Google, so entries without an explicit thumbnail are skipped!
 */
function videoItems(page: ResolvedPage): VideoItemLoose[] | undefined {
  const videos = page.openGraph.videos;
  if (!videos || videos.length === 0) return undefined;
  const out: VideoItemLoose[] = [];
  for (const ref of videos) {
    if (!ref.src || !ref.thumbnail) continue;
    const title = (ref.title ?? ref.alt ?? page.title).trim();
    const description = (ref.description ?? ref.alt ?? page.title).trim();
    if (title === "" || description === "") continue;
    const item: VideoItemLoose = {
      thumbnail_loc: ref.thumbnail,
      title: title.slice(0, VIDEO_TITLE_MAX),
      description: description.slice(0, VIDEO_DESCRIPTION_MAX),
    };
    if (ref.playerLoc) item.player_loc = ref.playerLoc;
    else item.content_loc = ref.src;
    out.push(item);
  }
  return out.length > 0 ? out : undefined;
}

/** Maps a page's news article into a sitemap news entry
 *
 * Referring to: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
// You ever wonder why a sitemap has a news entry? Well it's because of a little thing called
// Google News. Since GN aggregates all the news articles rather than making its own,
// it relies on websites to tell it what articles are news.
function newsItem(
  page: ResolvedPage,
  options: SitemapOptions,
): NewsItem | undefined {
  const article = page.openGraph.article;
  const siteName = page.openGraph.siteName?.trim();
  if (!article?.publishedTime || !siteName) return undefined;
  const title = page.title.trim();
  if (title === "") return undefined;

  const published = Date.parse(article.publishedTime);
  if (Number.isNaN(published)) return undefined;

  const maxAgeDays = options.newsMaxAgeDays ?? NEWS_MAX_AGE_DAYS;
  if (maxAgeDays > 0) {
    const configuredNow = options.now?.getTime();
    const now =
      configuredNow !== undefined && !Number.isNaN(configuredNow)
        ? configuredNow
        : Date.now();
    if (published < now - maxAgeDays * DAY_MS) return undefined;
  }

  return {
    publication: {
      name: siteName,
      language: (page.lang?.split("-")[0] ?? "en").toLowerCase(),
    },
    publication_date: article.publishedTime,
    title,
  };
}

function clampPriority(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.min(Math.max(value, 0), 1);
}

/** Builds `<xhtml:link>` entries,
 * Note: This appends the page's own alternate when missing
 *
 */
function alternateLinks(
  page: ResolvedPage,
): Array<{ lang: string; url: string }> | undefined {
  if (page.alternates.length === 0) return undefined;
  const links = page.alternates.map((alternate) => ({
    lang: alternate.hreflang,
    url: alternate.href,
  }));
  if (page.lang && !links.some((link) => link.lang === page.lang))
    links.push({ lang: page.lang, url: page.canonical });
  return links;
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
  const priority = clampPriority(page.priority ?? options.defaultPriority);
  const item: SitemapItemLoose = {
    url: page.canonical,
    changefreq: changefreq ? CHANGEFREQ[changefreq] : undefined,
    priority,
    lastmod: page.lastmod,
    img: imageItems(page),
    video: videoItems(page),
    news: newsItem(page, options),
    links: alternateLinks(page),
  };
  return item;
}

/**
 * Builds the contents of `sitemap.xml`.
 * - Skips pages with `sitemap: false` (for example noindex), any route in `exclude`, and error/verification files
 * - Emits `xhtml:link` alternates, image, video, and news namespaces when any page uses them
 * - TODO: enforces a single host, falling back to the first absolute URL when `siteUrl` is omitted
 * - Caps URLs, images, news entries, and the serialized file size
 *
 * @returns the XML contents, an empty `<urlset>` when nothing fits
 * @throws When the serialized sitemap exceeds `maxBytes`
 */
export async function buildSitemap(
  pages: ResolvedPage[],
  options: SitemapOptions = {},
): Promise<string> {
  const exclude = new Set(options.exclude ?? []);
  const maxUrls = options.maxUrls ?? MAX_URLS;
  const maxNews = options.maxNews ?? MAX_NEWS;
  const explicitOrigin = originOf(options.siteUrl ?? "");

  const candidates: SitemapItemLoose[] = [];
  for (const page of pages) {
    const item = toItem(page, options, exclude);
    if (item) candidates.push(item);
  }

  const firstAbsolute = candidates.find((item) => originOf(item.url) !== "");
  const siteOrigin =
    explicitOrigin || (firstAbsolute ? originOf(firstAbsolute.url) : "");
  const sameHost = siteOrigin
    ? candidates.filter((item) => originOf(item.url) === siteOrigin)
    : candidates;

  const items: SitemapItemLoose[] = [];
  let newsCount = 0;
  for (const item of sameHost) {
    if (items.length >= maxUrls) break;
    if (item.news) {
      if (newsCount >= maxNews) delete item.news;
      else newsCount += 1;
    }
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

  const xml = formatXml((await streamToPromise(stream)).toString());
  const maxBytes = options.maxBytes ?? MAX_SITEMAP_BYTES;
  const bytes = Buffer.byteLength(xml, "utf8");
  if (bytes > maxBytes)
    throw new Error(
      `sitemap.xml is ${bytes} bytes, over the ${maxBytes}-byte protocol limit; lower maxUrls or split the sitemap`,
    );
  return xml;
}

import type {
  FaviconConfig,
  OpenGraphInfo,
  PageMeta,
  ResolvedOptions,
  ResolvedSite,
  RobotsFileOptions,
  SeoOptions,
  SeoPluginOptions,
  SitemapOptions,
  SiteConfig,
  ThemeColorEntry,
  TwitterInfo,
} from "../types";
import { languageTagToOgLocale, normalizeLanguageTag } from "../locale";
import { normalizeRoute, normalizeSiteUrl, toAbsolute } from "../url";

const DEFAULT_LOCALE = "en_US";

/** Splits a comma string or array into a trimmed, non-empty keyword list */
export function toKeywords(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : value.split(",");
  return list
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}

/** Resolves a possibly root-relative path to an absolute URL, passing through undefined */
export function absolutize(
  value: string | undefined,
  siteUrl: string,
): string | undefined {
  return value ? toAbsolute(value, siteUrl) : undefined;
}

/**
 * Normalizes `theme-color` config into renderable entries
 * - A bare color string becomes one entry without a media query
 * - Blank colors and blank media queries are dropped cause... well isn't it obvious
 */
export function normalizeThemeColors(
  value: string | ThemeColorEntry[] | undefined,
): ThemeColorEntry[] {
  if (!value) return [];
  const entries = typeof value === "string" ? [{ color: value }] : value;
  const colors: ThemeColorEntry[] = [];
  for (const entry of entries) {
    if (typeof entry?.color !== "string") continue;
    const color = entry.color.trim();
    if (color.length === 0) continue;
    const media = typeof entry.media === "string" ? entry.media.trim() : "";
    colors.push(media.length > 0 ? { color, media } : { color });
  }
  return colors;
}

function resolveFavicon(
  favicon: FaviconConfig | undefined,
  siteUrl: string,
): FaviconConfig {
  if (!favicon) return {};
  return {
    icon: absolutize(favicon.icon, siteUrl),
    appleTouchIcon: absolutize(favicon.appleTouchIcon, siteUrl),
    appleTouchIconPrecomposed: absolutize(
      favicon.appleTouchIconPrecomposed,
      siteUrl,
    ),
    manifest: absolutize(favicon.manifest, siteUrl),
    maskIcon: absolutize(favicon.maskIcon, siteUrl),
    themeColor: normalizeThemeColors(favicon.themeColor),
    mobileWebApp: favicon.mobileWebApp,
    msapplication: favicon.msapplication
      ? {
          tileColor: favicon.msapplication.tileColor,
          tileImage: absolutize(favicon.msapplication.tileImage, siteUrl),
          config: absolutize(favicon.msapplication.config, siteUrl),
        }
      : undefined,
  };
}

/** Accepts the `@handle` shorthand or a full {@link TwitterInfo}. */
function resolveTwitter(
  twitter: string | TwitterInfo | undefined,
): TwitterInfo | undefined {
  if (!twitter) return undefined;
  return typeof twitter === "string" ? { site: twitter } : twitter;
}

/** Validates and normalizes the site config into defaults */
export function resolveSite(site: SiteConfig): ResolvedSite {
  const url = normalizeSiteUrl(site.url);
  const lang = site.lang
    ? normalizeLanguageTag(site.lang) || undefined
    : undefined;
  const openGraph: OpenGraphInfo = {
    type: "website",
    ...site.openGraph,
    siteName: site.openGraph?.siteName ?? site.name,
    locale:
      site.openGraph?.locale ??
      site.locale ??
      languageTagToOgLocale(site.lang) ??
      DEFAULT_LOCALE,
    image: absolutize(site.openGraph?.image ?? site.image, url),
    imageAlt: site.openGraph?.imageAlt ?? site.imageAlt,
  };
  return {
    url,
    name: site.name,
    title: site.title,
    titleTemplate: site.titleTemplate,
    description: site.description,
    image: absolutize(site.image, url),
    imageAlt: site.imageAlt,
    twitter: resolveTwitter(site.twitter),
    locale: site.locale ?? DEFAULT_LOCALE,
    lang,
    author: site.author,
    keywords: toKeywords(site.keywords),
    robotsByUserAgent: site.robotsByUserAgent ?? {},
    favicon: resolveFavicon(site.favicon, url),
    openGraph,
    jsonLd: site.jsonLd ?? {},
  };
}

interface ResolvedToggle<T> {
  enabled: boolean;
  options: T;
}

function resolveRobots(
  value: SeoOptions["robots"],
): ResolvedToggle<RobotsFileOptions> {
  if (value === false) return { enabled: false, options: {} };
  if (value === undefined || value === true || value === "auto") {
    return { enabled: true, options: {} };
  }
  return { enabled: true, options: value };
}

function resolveSitemap(
  value: SeoOptions["sitemap"],
): ResolvedToggle<SitemapOptions> {
  if (value === false) return { enabled: false, options: {} };
  if (value === undefined || value === true || value === "auto") {
    return { enabled: true, options: {} };
  }
  return { enabled: true, options: value };
}

/** Normalizes page keys to canonical routes. */
function resolvePages(
  pages: Record<string, PageMeta> | undefined,
): Record<string, PageMeta> {
  const resolved: Record<string, PageMeta> = {};
  for (const [route, meta] of Object.entries(pages ?? {})) {
    resolved[normalizeRoute(route)] = meta;
  }
  return resolved;
}

/**
 * Merges the auto-loaded file config under the inline options.
 * Inline options win, but the file config is used as a fallback for any missing keys
 */
export function mergeOptions(
  fileConfig: SeoOptions | undefined,
  inline: SeoPluginOptions,
): SeoPluginOptions {
  if (!fileConfig) return inline;
  return {
    ...fileConfig,
    ...inline,
    // only 1 level deep
    site: { ...fileConfig.site, ...inline.site } as SiteConfig,
    pages: { ...fileConfig.pages, ...inline.pages },
    robots: inline.robots ?? fileConfig.robots,
    sitemap: inline.sitemap ?? fileConfig.sitemap,
    validate: inline.validate ?? fileConfig.validate,
    configFile: inline.configFile ?? fileConfig.configFile,
    coexistence: inline.coexistence ?? fileConfig.coexistence,
  };
}

/**
 * Merges file and inline options, then resolves site, toggles, and page keys.
 *
 * @throws When neither source supplies `site.url`.
 */
export function resolveOptions(
  fileConfig: SeoOptions | undefined,
  inline: SeoPluginOptions,
): ResolvedOptions {
  const merged = mergeOptions(fileConfig, inline);
  if (!merged.site) {
    throw new Error(
      "site configuration is required: pass site.url to seo() or define it in seo.config.ts",
    );
  }
  const robots = resolveRobots(merged.robots);
  const sitemap = resolveSitemap(merged.sitemap);
  return {
    site: resolveSite(merged.site),
    pageMeta: resolvePages(merged.pages),
    robotsEnabled: robots.enabled,
    robots: robots.options,
    sitemapEnabled: sitemap.enabled,
    sitemap: sitemap.options,
    validate: merged.validate ?? "warn",
  };
}

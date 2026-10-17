/* All types we use 
 * (lots of borrowing from alternate implementations and references lol) 
 */

// TODO: Be more consistent with JSDoc comments

/** Twitter (no i'm not calling it X) card layout
 * I referenced https://ha.mr/#WLFjM~@NCzcO[mQzbrV5r[2n2WdeJU.X741Ih9Z=wG24sfYy_:]LqEeBDkkldg:M5v0oD-W~-v4?Ym@d4Nc=./:1( 
 * for the available options.
 */
export type TwitterCardType = "summary" | "summary_large_image" | "app" | "player";

/** sitemap change frequency values */
export type SitemapChangefreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

/** Favicon and related icon links. 
 * Important: Paths are resolved to absolute URLs!
 * */
export interface FaviconConfig {
  /** Standard `<link rel="icon">` */
  icon?: string;
  /** `<link rel="apple-touch-icon">` */
  appleTouchIcon?: string;
  /** `<link rel="manifest">`: web app manifest */
  manifest?: string;
  /** `<link rel="mask-icon">`: SVG for Safari pinned tabs */
  maskIcon?: string;
  /** `<meta name="theme-color">`: basically a bare color, or one entry per media query */
  themeColor?: string | ThemeColorEntry[];
}

/** One `<meta name="theme-color">` entry, optionally scoped to a media query */
export interface ThemeColorEntry {
  /** CSS color, like `#ffffff` or `rgb(255 255 255)` (obviously) */
  color: string;
  /** Media query the color applies to, for example `(prefers-color-scheme: dark)` */
  media?: string;
}

/**
 * Structured `<meta name="robots">` directives.
 * Ref: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#directives
 */
export interface RobotsDirectives {
  noindex?: boolean;
  nofollow?: boolean;
  /** `none` is shorthand for `noindex, nofollow` */
  none?: boolean;
  /** Allow indexing of everything (default; rarely needs emitting) */
  all?: boolean;
  nosnippet?: boolean;
  /** Deprecated but still honored by Bing lollll; opt-in */
  noarchive?: boolean;
  noimageindex?: boolean;
  notranslate?: boolean;
  /** Only meaningful together with `noindex` (Gooooooogle) */
  indexifembedded?: boolean;
  nositelinkssearchbox?: boolean;
  /** Snippet character cap. `-1` means no limit, `0` no snippet */
  maxSnippet?: number;
  /** Preview size cap for image search results */
  maxImagePreview?: "none" | "standard" | "large";
  /** Video preview cap in seconds. `-1` means no limit, `0` no video */
  maxVideoPreview?: number;
  /** After this date the page should not be shown *shakes finger*. ISO string or `Date` */
  unavailableAfter?: string | Date;
}

/** A image reference used across head tags, JSON-LD and sitemaps. */
export interface ImageRef {
  /** Image URL (absolute preferred). */
  src: string;
  /** Alternative text. */
  alt?: string;
  /** Image width in pixels. */
  width?: number;
  /** Image height in pixels. */
  height?: number;
  /** MIME type (e.g. `image/jpeg`). */
  type?: string;
  /** HTTPS URL equivalent. */
  secureUrl?: string;
}

/** Flexible image input accepted by the config layer. */
export type ImageInput =
  | string
  | ImageRef
  | {
      src?: string;
      url?: string;
      href?: string;
      alt?: string;
      width?: number | string;
      height?: number | string;
      type?: string;
      secureUrl?: string;
      secure_url?: string;
    };


/** An `hreflang` alternate link. */
export interface HreflangAlternate {
  /** (BCP-47) language tag, for example `en-US` or `x-default`. */
  hreflang: string;
  /** Absolute or root-relative URL of the localized page */
  href: string;
}

/** Open Graph values */
export interface OpenGraphInfo {
  title?: string;
  description?: string;
  /** `og:type`, stuff like `website` or `article`. Defaults to `website` */
  type?: string;
  url?: string;
  siteName?: string;
  locale?: string;
  localeAlternate?: string[];
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
}

/** Twitter Card values */
export interface TwitterInfo {
  card?: TwitterCardType;
  title?: string;
  description?: string;
  /** `twitter:site`, the site's `@handle` */
  site?: string;
  /** `twitter:creator`, the content author's `@handle` */
  creator?: string;
  image?: string;
  imageAlt?: string;
}

/** A named author for Article structured data */
export interface JsonLdPerson {
  name: string;
  url?: string;
}

/** `Organization` structured data */
export interface OrganizationJsonLd {
  name: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
}

/** `WebSite` structured data optionally with a SearchAction */
export interface WebSiteJsonLd {
  name?: string;
  url?: string;
  description?: string;
  /** URL template for search, like `https://example.com/search?q={search_term_string}`. */
  searchUrl?: string;
}

/** `Article` / `BlogPosting` structured data. */
export interface ArticleJsonLd {
  headline: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string | JsonLdPerson;
  /** Schema.org type, defaults to `Article` */
  type?: "Article" | "BlogPosting" | "NewsArticle";
}

/** `Product` structured data, with the optional offer and rating */
export interface ProductJsonLd {
  name: string;
  description?: string;
  image?: string;
  sku?: string;
  brand?: string;
  price?: number | string;
  priceCurrency?: string;
  /** Schema.org availability URL or short name, like `InStock`. */
  availability?: string;
  ratingValue?: number;
  reviewCount?: number;
}

/** JSON-LD blocks */
export interface JsonLdConfig {
  /** `true` uses site name/url */
  organization?: boolean | OrganizationJsonLd;
  website?: boolean | WebSiteJsonLd;
  /** Page-level only */
  article?: boolean | ArticleJsonLd;
  /** Page-level only */
  product?: boolean | ProductJsonLd;
  /** Extra nodes appended verbatim */
  extra?: Record<string, unknown>[];
}

/** Site-wide configuration */
export interface SiteConfig {
  /** Canonical origin, for example `https://example.com`. Required. */
  url: string;
  /** Site name. Feeds `og:site_name`, `application-name`, and WebSite JSON-LD. */
  name?: string;
  /** Default document title for pages without their own. */
  title?: string;
  /** Template applied to page titles, for example `%s | My Site`. `%s` is replaced. */
  titleTemplate?: string;
  /** Default meta description. */
  description?: string;
  /** Default social share image. Paths are resolved to absolute URLs. */
  image?: string;
  imageAlt?: string;
  /** Default Twitter values, or a bare `@handle` shorthand for `twitter:site`. */
  twitter?: string | TwitterInfo;
  /** `og:locale`, defaults to `en_US` */
  locale?: string;
  /** (BCP 47) language tag for the site, for example `en-US`. */
  lang?: string;
  /** `<meta name="author">` default */
  author?: string;
  keywords?: string | string[];
  /** Site-wide per-user-agent robots metas */
  robotsByUserAgent?: Record<string, string | RobotsDirectives>;
  favicon?: FaviconConfig;
  openGraph?: OpenGraphInfo;
  jsonLd?: JsonLdConfig;
}

/** Per-page metadata (overrides site defaults) */
export interface PageMeta {
  title?: string;
  description?: string;
  /** Canonical path or absolute URL. Defaults to `site.url + route`. */
  canonical?: string;
  /** (BCP 47) language tag for the site, for example `en-US`. */
  lang?: string;
  image?: string;
  imageAlt?: string;
  keywords?: string | string[];
  author?: string;
  /** Exclude from `sitemap.xml` and emit a `noindex` robots directive. */
  noindex?: boolean;
  /** Robots directive: raw string, or structured {@link RobotsDirectives}. Overrides `noindex`. */
  robots?: string | RobotsDirectives;
  /** Extra per-user-agent robots metas, for example `{ "googlebot-news": { noindex: true } }`. */
  robotsByUserAgent?: Record<string, string | RobotsDirectives>;
  openGraph?: OpenGraphInfo;
  twitter?: TwitterInfo;
  jsonLd?: JsonLdConfig;
  /** `hreflang` alternates for this page */
  alternates?: HreflangAlternate[];
  /** Include in `sitemap.xml`. Defaults to `!noindex` */
  sitemap?: boolean;
  priority?: number;
  changefreq?: SitemapChangefreq;
  lastmod?: string | Date;
  /** Extra `<meta name=... content=...>` entries. */
  meta?: Record<string, string>;
  /** Extra `<link>` entries. `rel` and `href` are required */
  links?: Array<{ rel: string; href: string } & Record<string, string>>;
}

/** Options for the generated `robots.txt` */
export interface RobotsFileOptions {
  /** User agents the rules apply to. Default `*`. */
  userAgent?: string | string[];
  /** Paths to disallow for the configured agents. */
  disallow?: string[];
  /** Paths to explicitly allow. */
  allow?: string[];
  /** Raw lines appended as is after the generated rules. */
  rules?: string[];
  /** Sitemap URL to advertise, or `false` to omit. Defaults to `site.url + /sitemap.xml`. */
  sitemap?: string | false;
  /** Merge with an existing `robots.txt` in the output dir instead of overwriting. Default `true`. */
  merge?: boolean;
  /** When true, automatically add `Disallow: <route>` for pages with `noindex: true` */
  disallowNoindex?: boolean;
}

/** Options for the generated `sitemap.xml` */
export interface SitemapOptions {
  /** Output filename within `build.outDir`. Default `sitemap.xml` */
  filename?: string;
  /** Routes to exclude from the sitemap */
  exclude?: string[];
  /** Fallback changefreq for pages without one */
  defaultChangefreq?: SitemapChangefreq;
  /** Fallback priority for pages without one */
  defaultPriority?: number;
}

/**
 * Options accepted by the `seo()` plugin
 */
export type SeoPluginOptions = Omit<SeoOptions, "site"> & { site?: SiteConfig };

/** Plugin options passed to `seo()` */
export interface SeoOptions {
  site: SiteConfig;
  /** Route to metadata map, by pathname (`/`, `/about`). */
  pages?: Record<string, PageMeta>;
  /** `auto` (default) generates `robots.txt` on build; `false` disables. */
  robots?: "auto" | boolean | RobotsFileOptions;
  /** `auto` (default) generates `sitemap.xml` on build when a `site.url` exists. */
  sitemap?: "auto" | boolean | SitemapOptions;
  /** Validation policy. `warn` (default), `error` throws, `false` disables. */
  validate?: "warn" | "error" | false;
  /** Path to a config file, or `false` to skip auto-detection */
  configFile?: string | false;
}

/** A rendered head element */
export interface HeadTag {
  tag: "title" | "meta" | "link" | "script";
  attrs: Record<string, string>;
  text?: string;
  /** Dedupe key: an existing element with the same key is replaced. */
  key: string;
  /** When true, the tag is only added if no element with `key` already exists. */
  onlyIfMissing?: boolean;
}

/** Fully resolved site configuration */
export interface ResolvedSite {
  url: string;
  name?: string;
  title?: string;
  titleTemplate?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  twitter?: TwitterInfo;
  locale: string;
  /** (BCP 47) site language tag, when configured. */
  lang?: string;
  author?: string;
  keywords: string[];
  robotsByUserAgent: Record<string, string | RobotsDirectives>;
  favicon: FaviconConfig;
  openGraph: OpenGraphInfo;
  jsonLd: JsonLdConfig;
}

/** Fully resolved page */
export interface ResolvedPage {
  route: string;
  title: string;
  description?: string;
  canonical: string;
  /** (BCP 47) page language tag, when configured. */
  lang?: string;
  image?: string;
  imageAlt?: string;
  keywords: string[];
  author?: string;
  robots?: string;
  robotsByUserAgent: Record<string, string>;
  noindex: boolean;
  openGraph: OpenGraphInfo;
  twitter: TwitterInfo;
  jsonLd: Record<string, unknown>[];
  alternates: HreflangAlternate[];
  meta: Record<string, string>;
  links: Array<{ rel: string; href: string } & Record<string, string>>;
  sitemap: boolean;
  priority?: number;
  changefreq?: SitemapChangefreq;
  lastmod?: string;
}

/** Fully resolved plugin options
 * Per-page values resolve lazily from `pageMeta`.
 */
export interface ResolvedOptions {
  site: ResolvedSite;
  pageMeta: Record<string, PageMeta>;
  robotsEnabled: boolean;
  robots: RobotsFileOptions;
  sitemapEnabled: boolean;
  sitemap: SitemapOptions;
  validate: "warn" | "error" | false;
}

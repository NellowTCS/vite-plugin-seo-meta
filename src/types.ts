/* All types we use
 * (lots of borrowing from alternate implementations and references lol)
 */

// TODO: Be more consistent with JSDoc comments

/** Twitter (no i'm not calling it X) card layout
 * I referenced https://ha.mr/#WLFjM~@NCzcO[mQzbrV5r[2n2WdeJU.X741Ih9Z=wG24sfYy_:]LqEeBDkkldg:M5v0oD-W~-v4?Ym@d4Nc=./:1(
 * for the available options.
 */
export type TwitterCardType =
  "summary" | "summary_large_image" | "app" | "player";

/** sitemap change frequency values */
export type SitemapChangefreq =
  "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

/** Favicon and related icon links.
 * Important: Paths are resolved to absolute URLs!
 * */
export interface FaviconConfig {
  /** Standard `<link rel="icon">` */
  icon?: string;
  /** `<link rel="apple-touch-icon">` */
  appleTouchIcon?: string;
  /** `<link rel="apple-touch-icon-precomposed">` */
  appleTouchIconPrecomposed?: string;
  /** `<link rel="manifest">`: web app manifest */
  manifest?: string;
  /** `<link rel="mask-icon">`: SVG for Safari pinned tabs */
  maskIcon?: string;
  /** `<meta name="theme-color">`: basically a bare color, or one entry per media query */
  themeColor?: string | ThemeColorEntry[];
  /** Apple `<meta name="apple-mobile-web-app-*">` tags */
  mobileWebApp?: MobileWebAppConfig;
  /** Microsoft IE/Edge tile tags (`<meta name="msapplication-*">`) */
  // WHY am i supporting this in 2024? because some people still use IE lmao
  // (no really, people still use it. I'm completely serious.)
  // But also it's handy for other Microsoft stuff lolllll
  msapplication?: MsTileConfig;
}

/** Apple mobile web app meta tags */
export interface MobileWebAppConfig {
  /** `<meta name="apple-mobile-web-app-title">`, shown under the icon on the home screen */
  title?: string;
  /** `<meta name="apple-mobile-web-app-capable">`: run the site full-screen */
  capable?: boolean;
  /** `<meta name="apple-mobile-web-app-status-bar-style">` */
  statusBarStyle?: "default" | "black" | "black-translucent" | "transparent";
}

/** Microsoft IE/Edge start-screen tile tags */
export interface MsTileConfig {
  /** `<meta name="msapplication-TileColor">` */
  tileColor?: string;
  /** `<meta name="msapplication-TileImage">` */
  tileImage?: string;
  /** `<link rel="msapplication-config">` pointing at a `browserconfig.xml` */
  // what's that you may ask? it's basically a Microsoft version of a web app manifest,
  // but in XML. shrug, Microsoft doing Microsoft things
  config?: string;
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
  /** Video thumbnail URL */
  thumbnail?: string;
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
      thumbnail?: string;
    };

/** An `hreflang` alternate link. */
export interface HreflangAlternate {
  /** (BCP-47) language tag, for example `en-US` or `x-default`. */
  hreflang: string;
  /** Absolute or root-relative URL of the localized page */
  href: string;
}

/** `og:determiner` values (ogp.me text type). `""` and `auto` are both defaults */
export type OgDeterminer = "a" | "an" | "the" | "" | "auto";

/** `article:*` properties (ogp.me article type) */
export interface OpenGraphArticle {
  publishedTime?: string | Date;
  modifiedTime?: string | Date;
  expirationTime?: string | Date;
  /** Profile URLs of the authors */
  author?: string | string[];
  section?: string;
  tag?: string | string[];
}

/** `book:*` properties (ogp.me book type) */
export interface OpenGraphBook {
  /** Profile URLs of the authors */
  author?: string | string[];
  isbn?: string;
  releaseDate?: string | Date;
  tag?: string | string[];
}

/** `profile:*` properties (ogp.me profile type) */
export interface OpenGraphProfile {
  firstName?: string;
  lastName?: string;
  username?: string;
  gender?: "male" | "female";
}

/** a `music:album` / `music:song` reference: basically a URL plus its position on a disc */
export interface OpenGraphMusicRef {
  url: string;
  /** Disc number, defaults to 1 */
  disc?: number;
  /** Track number, defaults to 1 */
  track?: number;
}

/** `music:*` properties (ogp.me music.* types) */
export interface OpenGraphMusic {
  /** `music:duration`, seconds */
  duration?: number;
  /** `music:album` refs (music.song) */
  album?: OpenGraphMusicRef[];
  /** `music:musician` profile URLs, the artist(s) */
  musician?: string[];
  /** `music:song` refs (music.album, music.playlist) */
  song?: OpenGraphMusicRef[];
  releaseDate?: string | Date;
  /** `music:creator` profile URLs (music.playlist, music.radio_station) */
  creator?: string[];
}

/** A `video:actor` reference: a profile URL plus the character played */
export interface OpenGraphVideoActor {
  url: string;
  role?: string;
}

/** `video:*` properties (ogp.me video.* types) */
export interface OpenGraphVideo {
  actor?: OpenGraphVideoActor[];
  /** Profile URLs of the directors */
  director?: string[];
  /** Profile URLs of the writers */
  writer?: string[];
  /** `video:duration`, seconds */
  duration?: number;
  releaseDate?: string | Date;
  tag?: string[];
  /** `video:series` URL (video.episode) */
  series?: string;
}

/** `payment:*` properties (ogp.me payment.link) */
export interface OpenGraphPayment {
  description?: string;
  /** ISO 4217 currency code */
  currency?: string;
  amount?: number;
  expiresAt?: string | Date;
  status?: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  id?: string;
  successUrl?: string;
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
  /** `og:determiner` */
  determiner?: OgDeterminer;
  /** Structured `og:image` entries; overrides `image` when present */
  images?: ImageInput[];
  /** Structured `og:video` entries */
  videos?: ImageInput[];
  /** Structured `og:audio` entries */
  audios?: ImageInput[];
  article?: OpenGraphArticle;
  book?: OpenGraphBook;
  profile?: OpenGraphProfile;
  music?: OpenGraphMusic;
  video?: OpenGraphVideo;
  payment?: OpenGraphPayment;
}

/** A resolved `article:*` block (dates are ISO strings, lists are arrays) */
export interface ResolvedOpenGraphArticle {
  publishedTime?: string;
  modifiedTime?: string;
  expirationTime?: string;
  author?: string[];
  section?: string;
  tag?: string[];
}

/** A resolved `book:*` block (dates are ISO strings, lists are arrays) */
export interface ResolvedOpenGraphBook {
  author?: string[];
  isbn?: string;
  releaseDate?: string;
  tag?: string[];
}

/** A resolved `music:*` block (dates are ISO strings, lists are arrays) */
export interface ResolvedOpenGraphMusic {
  duration?: number;
  album?: OpenGraphMusicRef[];
  musician?: string[];
  song?: OpenGraphMusicRef[];
  releaseDate?: string;
  creator?: string[];
}

/** A resolved `video:*` block (dates are ISO strings, lists are arrays) */
export interface ResolvedOpenGraphVideo {
  actor?: OpenGraphVideoActor[];
  director?: string[];
  writer?: string[];
  duration?: number;
  releaseDate?: string;
  tag?: string[];
  series?: string;
}

/** A resolved `payment:*` block (dates are ISO strings) */
export interface ResolvedOpenGraphPayment {
  description?: string;
  currency?: string;
  amount?: number;
  expiresAt?: string;
  status?: OpenGraphPayment["status"];
  id?: string;
  successUrl?: string;
}

/** Resolved Open Graph values (media URLs absolute, dates ISO, lists arrays) */
export interface ResolvedOpenGraphInfo extends Omit<
  OpenGraphInfo,
  | "images"
  | "videos"
  | "audios"
  | "article"
  | "book"
  | "profile"
  | "music"
  | "video"
  | "payment"
> {
  images?: ImageRef[];
  videos?: ImageRef[];
  audios?: ImageRef[];
  article?: ResolvedOpenGraphArticle;
  book?: ResolvedOpenGraphBook;
  profile?: OpenGraphProfile;
  music?: ResolvedOpenGraphMusic;
  video?: ResolvedOpenGraphVideo;
  payment?: ResolvedOpenGraphPayment;
}

/** A Twitter/X handle, with or without the leading `@` */
export type TwitterHandle = string;

/** Platform names recognized by the App Card (wow no huawei? depressing /j) */
export type TwitterAppPlatform = "iphone" | "ipad" | "googleplay";

/** `twitter:player` card: an HTTPS iframe URL plus its pixel dimensions */
export interface TwitterPlayer {
  /** HTTPS URL of the player iframe */
  url: string;
  /** Width of the iframe in pixels */
  width: number;
  /** Height of the iframe in pixels */
  height: number;
  /** Optional URL to a raw video or audio stream */
  stream?: string;
}

/** One app entry per platform, for the App Card */
export interface TwitterAppEntry {
  /** App name, e.g. `twitter:app:name:iphone` */
  name?: string;
  /** App ID in the respective app store (`twitter:app:id:iphone`) */
  id?: string;
  /** Custom URL scheme, must include `://` (`twitter:app:url:iphone`) */
  url?: string;
}

/** App Card configuration: one entry per supported platform */
export interface TwitterApps {
  iphone?: TwitterAppEntry;
  ipad?: TwitterAppEntry;
  googleplay?: TwitterAppEntry;
  /** Two-letter ISO country code for the App Store that holds the app
   * ("The shape goes into a shape press that presses the shape into a pressed shape")
   */
  country?: string;
}

/** Twitter Card values
 * Ref: https://web.archive.org/web/20231217013914/https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup
 */
export interface TwitterInfo {
  card?: TwitterCardType;
  title?: string;
  description?: string;
  /** `twitter:site`, the site's `@handle` */
  site?: TwitterHandle;
  /** `twitter:site:id`, the site's numeric Twitter ID (alternative to `site`) */
  siteId?: string;
  /** `twitter:creator`, the content author's `@handle` */
  creator?: TwitterHandle;
  /** `twitter:creator:id`, the creator's numeric Twitter ID (alternative to `creator`) */
  creatorId?: string;
  image?: string;
  /** `twitter:image:alt`, alt text for visually impaired users (max 420 chars) */
  imageAlt?: string;
  /** `twitter:image:width` / `twitter:image:height`, the card image dimensions */
  imageWidth?: number;
  imageHeight?: number;
  /** `twitter:label1` / `twitter:label2`, paired with `data1` / `data2` (opt-in) */
  label1?: string;
  data1?: string;
  label2?: string;
  data2?: string;
  /** Player Card: HTTPS iframe URL plus pixel dimensions */
  player?: TwitterPlayer;
  /** App Card: per-platform app store entries */
  apps?: TwitterApps;
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
  /** (BCP 47) language tag for the page, for example `en-US`. */
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

/** Options for the generated `robots.txt`
 * Ref: https://www.rfc-editor.org/rfc/rfc9309.txt
 * Gasp I can't believe the time has come for me to be refering to
 * RFCs in my own code. I feel like a real software engineer now. (I am not.)
 */
export interface RobotsFileOptions {
  /** User agents the rules apply to. Default `*`. */
  userAgent?: string | string[];
  /** Paths to disallow for the configured agents. */
  disallow?: string[];
  /** Paths to explicitly allow. */
  allow?: string[];
  /** Additional user-agent groups, each with their own rules. */
  // I never knew that `robots.txt` could have more than User-agent: * and Disallow: / lolll
  groups?: RobotsGroup[];
  /** Raw lines appended as is after the generated rules. */
  rules?: string[];
  /** Sitemap URL to advertise, or `false` to omit. Defaults to `site.url + /sitemap.xml`. */
  sitemap?: string | false;
  /** Merge with an existing `robots.txt` in the output dir instead of overwriting. Default `true`. */
  merge?: boolean;
  /** When true, automatically add `Disallow: <route>` for pages with `noindex: true` */
  disallowNoindex?: boolean;
  /** `Host:` record (standalone, not part of any group) */
  host?: string;
  /** `Crawl-delay:` in seconds, applied to the default group */
  crawlDelay?: number;
  /** `Clean-param:` rules, applied to the default group */
  cleanParam?: string | string[];
}

/** One robots.txt thing: user-agent lines + rules */
export interface RobotsGroup {
  userAgent: string | string[];
  disallow?: string[];
  allow?: string[];
  /** `Crawl-delay:` in seconds */
  crawlDelay?: number;
  /** `Clean-param:` rules */
  cleanParam?: string | string[];
}

/** Options for the generated `sitemap.xml` */
export interface SitemapOptions {
  /** Output filename within `build.outDir`. Default `sitemap.xml` */
  filename?: string;
  /** Routes to exclude from the sitemap.
   * Note: Error pages (`/404`, `/500`) and verification files (`google<token>.html`) are auto excluded */
  exclude?: string[];
  /** Fallback changefreq for pages without one */
  defaultChangefreq?: SitemapChangefreq;
  /** Fallback priority for pages without one */
  defaultPriority?: number;
  /** Le site origin used to enforce a single-host sitemap */
  siteUrl?: string;
  /** Maximum number of URLs per sitemap file. Default 50000.
   * Yes. 50000. That's a lot of URLs. I don't know why they picked that number,
   * but it's the number they picked.
   */
  maxUrls?: number;
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
  /** Defer `robots.txt`/`sitemap.xml` generation to a different plugin or build step.
   * Default `true` and set `false` to always generate both files
   * (i'm not sure why you'd want this unless you're comparing but still, it's there) */
  coexistence?: boolean;
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
  openGraph: ResolvedOpenGraphInfo;
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

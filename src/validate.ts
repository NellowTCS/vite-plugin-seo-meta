/** Pre-build validation */

import { resolvePage } from "./head/merge";
import { isAlphaRegion, isNumericRegion, isScriptSubtag } from "./locale";
import { ISO_3166_1_ALPHA_2, ISO_639_1 } from "./locale-codes";
import type { Logger } from "./log";
import type {
  JsonLdConfig,
  RobotsFileOptions,
  ResolvedOptions,
  ResolvedPage,
} from "./types";
import { isAbsoluteUrl } from "./url";

/** Rendered titles past this get cut off in search results */
const TITLE_MAX = 60;

/** Rendered descriptions past this get cut off */
const DESCRIPTION_MAX = 160;

/** Descriptions under this are too smol to be useful */
const DESCRIPTION_MIN = 50;

/** Twitter Card title cap (~~X~~ Twitter truncates past this) */
const TWITTER_TITLE_MAX = 70;

/** Twitter Card description cap (~~X~~ Twitter truncates past this) */
const TWITTER_DESCRIPTION_MAX = 200;

/** 
 * Google killed the hard Article headline limit (another kill? a "good" one?), 
 * but long ones still get truncated in search
 */
const ARTICLE_HEADLINE_MAX = 110;

/** SearchAction needs this so the query can be substituted */
const SEARCH_TERM_PLACEHOLDER = "{search_term_string}";

/** Allowed `<meta name="robots">` directives */
const VALID_ROBOTS_DIRECTIVES = new Set([
  // index/follow are the defaults ofc
  "index",
  "follow",
  "noindex",
  "nofollow",
  "none",
  "all",
  "nosnippet",
  "noarchive",
  "noimageindex",
  "notranslate",
  "indexifembedded",
  "nositelinkssearchbox",
]);

/** Allowed `max-image-preview` values */
const VALID_IMAGE_PREVIEWS = new Set(["none", "standard", "large"]);

/** True when a directive value parses as a number (for max-snippet etc. idk) */
function isNumericValue(value: string): boolean {
  return value.trim().length > 0 && !Number.isNaN(Number(value));
}

/** True when a directive value parses as a date Google would accept (aka, is it valid) */
function isDateValue(value: string): boolean {
  return !Number.isNaN(Date.parse(value.trim()));
}

/** Allowed `twitter:card` values */
const VALID_TWITTER_CARDS = new Set([
  "summary",
  "summary_large_image",
  "app",
  "player",
]);

/** Allowed sitemap changefreq values */
const VALID_CHANGEFREQ = new Set([
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
]);

/** RFC 9309 product token: `*` or letters, `_`, and `-` (digits are excluded) */
const ROBOTS_PRODUCT_TOKEN = /^(?:\*|[A-Za-z_-]+)$/;

/** A single validation finding */
export interface ValidationIssue {
  /** Route the issue belongs to, or a comma list for cross-route issues */
  route: string;
  /** Field name, for example `title` */
  field: string;
  /** Explanation */
  message: string;
}

/**
 * Validates the language and region subtags of an hreflang value.
 * Google only supports ISO 639-1 languages and ISO 3166-1 alpha-2 regions;
 * other well-formed BCP 47 subtags (like `zho` or `es-419`) are ignored.
 *
 * Ref: https://developers.google.com/search/docs/specialty/international/localized-versions
 */
function validateHreflangCode(
  hreflang: string,
  add: (field: string, message: string) => void,
): void {
  const tag = hreflang.trim();
  if (!tag || tag.toLowerCase() === "x-default") return;

  const [rawLanguage, ...rest] = tag.split("-");
  const language = rawLanguage?.toLowerCase();
  if (!language) return;
  if (!ISO_639_1.has(language)) {
    add(
      "alternates",
      `hreflang "${tag}" uses an unsupported language subtag "${rawLanguage}"; only ISO 639-1 (2-letter) codes are supported`,
    );
    return;
  }

  for (const part of rest) {
    if (!part || isScriptSubtag(part)) continue;
    if (isAlphaRegion(part)) {
      if (!ISO_3166_1_ALPHA_2.has(part.toUpperCase()))
        add(
          "alternates",
          `hreflang "${tag}" uses an unassigned ISO 3166-1 alpha-2 region "${part}"`,
        );
      continue;
    }
    if (isNumericRegion(part))
      add(
        "alternates",
        `hreflang "${tag}" uses a numeric region "${part}" (not ISO 3166-1 alpha-2); only 2-letter region codes are supported`,
      );
  }
}

/**
 * Validates robots.txt options that the builder emits verbatim.
 * Product tokens with punctuation or digits never match a crawler, and
 * `Crawl-delay` must be a non-negative number of seconds.
 *
 * Ref: https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.1
 */
function validateRobotsOptions(robots: RobotsFileOptions): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (field: string, message: string) =>
    issues.push({ route: "(robots)", field, message });

  const agents: string[] = [];
  const collect = (value: string | string[] | undefined) => {
    if (typeof value === "string") agents.push(value);
    else if (value) agents.push(...value);
  };
  collect(robots.userAgent);
  for (const group of robots.groups ?? []) collect(group.userAgent);

  for (const agent of agents)
    if (agent && !ROBOTS_PRODUCT_TOKEN.test(agent))
      add(
        "robots.userAgent",
        `user-agent "${agent}" is not a valid RFC 9309 product token; use letters, "_", "-", or "*" (digits are not allowed)`,
      );

  const delays = [
    robots.crawlDelay,
    ...(robots.groups ?? []).map((group) => group.crawlDelay),
  ];
  for (const delay of delays)
    if (delay !== undefined && (!Number.isFinite(delay) || delay < 0))
      add(
        "robots.crawlDelay",
        `crawl-delay ${delay} must be a non-negative number`,
      );

  return issues;
}

/** Checks a `meta name=robots` content string (works for per-agent metas too!!!! :D) */
function validateRobotsDirectives(
  content: string | undefined,
  add: (field: string, message: string) => void,
): void {
  if (!content) return;
  for (const directive of content.split(",")) {
    const trimmed = directive.trim();
    const key = trimmed.split(":")[0]?.trim().toLowerCase() ?? "";
    if (!key) continue;
    if (VALID_ROBOTS_DIRECTIVES.has(key)) continue;
    const value = trimmed.includes(":")
      ? (trimmed.slice(trimmed.indexOf(":") + 1) ?? "")
      : "";
    // max-*: Google only parses max-snippet/max-image-preview/max-video-preview,
    // and ignores the rule entirely when the value doesn't parse! very nice that they don't make me suffer
    if (key === "max-snippet" || key === "max-video-preview") {
      if (!isNumericValue(value))
        add("robots", `robots directive "${trimmed}" has no parseable number`);
    } else if (key === "max-image-preview") {
      if (!VALID_IMAGE_PREVIEWS.has(value.trim().toLowerCase()))
        add(
          "robots",
          `max-image-preview must be one of ${[...VALID_IMAGE_PREVIEWS].join(", ")}, got "${value.trim()}"`,
        );
    } else if (key === "unavailable_after") {
      // Google ignores the rule (so the page never expires) on an unparseable date haha
      if (!isDateValue(value))
        add("robots", `robots directive "${trimmed}" has no parseable date`);
    } else {
      add("robots", `robots directive "${trimmed}" is not recognized`);
    }
  }
}

/** Validates site-wide JSON-LD config */
function validateSiteJsonLd(jsonLd: JsonLdConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const website = jsonLd.website;
  if (
    website &&
    typeof website === "object" &&
    website.searchUrl &&
    !website.searchUrl.includes(SEARCH_TERM_PLACEHOLDER)
  )
    issues.push({
      route: "(site)",
      field: "jsonLd.website.searchUrl",
      message: `searchUrl "${website.searchUrl}" is missing ${SEARCH_TERM_PLACEHOLDER}, so the search query cannot be substituted`,
    });
  return issues;
}

/** Validates raw page JSON-LD before the builders normalize it */
function validatePageJsonLd(
  jsonLd: JsonLdConfig | undefined,
  route: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (field: string, message: string) =>
    issues.push({ route, field, message });

  const article = jsonLd?.article;
  if (article && typeof article === "object") {
    for (const key of ["datePublished", "dateModified"] as const) {
      const value = article[key];
      if (!value) continue;
      const valid =
        value instanceof Date
          ? !Number.isNaN(value.getTime())
          : isDateValue(value);
      if (!valid)
        add(
          `jsonLd.article.${key}`,
          `${key} "${String(value)}" is not a parseable date and will be omitted (Google expects ISO 8601)`,
        );
    }
    if (article.headline && article.headline.length > ARTICLE_HEADLINE_MAX)
      add(
        "jsonLd.article.headline",
        `headline is ${article.headline.length} characters; long headlines may be truncated in search results`,
      );
  }

  const product = jsonLd?.product;
  if (
    product &&
    typeof product === "object" &&
    product.ratingValue !== undefined &&
    product.reviewCount === undefined &&
    product.ratingCount === undefined
  )
    add(
      "jsonLd.product.aggregateRating",
      "aggregateRating needs reviewCount or ratingCount alongside ratingValue to be eligible for rich results",
    );

  return issues;
}

/** Checks a single resolved page. Returns an empty array when it passes. */
export function validatePage(page: ResolvedPage): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (field: string, message: string) =>
    issues.push({ route: page.route, field, message });

  const title = page.title.trim();
  if (!title) add("title", "title is empty");
  else if (title.length > TITLE_MAX)
    add(
      "title",
      `title is ${title.length} characters, over the recommended ${TITLE_MAX}`,
    );

  const description = page.description?.trim() ?? "";
  if (!description) add("description", "description is empty");
  else if (description.length > DESCRIPTION_MAX)
    add(
      "description",
      `description is ${description.length} characters, over the recommended ${DESCRIPTION_MAX}`,
    );
  else if (description.length < DESCRIPTION_MIN)
    add(
      "description",
      `description is ${description.length} characters, under the recommended ${DESCRIPTION_MIN}`,
    );

  if (page.priority !== undefined && (page.priority < 0 || page.priority > 1))
    add("priority", `priority ${page.priority} is outside the 0.0-1.0 range`);

  if (page.changefreq && !VALID_CHANGEFREQ.has(page.changefreq))
    add(
      "changefreq",
      `changefreq "${page.changefreq}" is not one of ${[...VALID_CHANGEFREQ].join(", ")}`,
    );

  if (page.canonical && !isAbsoluteUrl(page.canonical))
    add("canonical", `canonical is not an absolute URL: "${page.canonical}"`);

  if (page.openGraph.url && !isAbsoluteUrl(page.openGraph.url))
    add(
      "openGraph.url",
      `og:url is not an absolute URL: "${page.openGraph.url}"`,
    );

  const twitter = page.twitter;
  if (twitter.card && !VALID_TWITTER_CARDS.has(twitter.card))
    add(
      "twitter.card",
      `twitter card "${twitter.card}" is not one of ${[...VALID_TWITTER_CARDS].join(", ")}`,
    );
  if (twitter.title && twitter.title.length > TWITTER_TITLE_MAX)
    add(
      "twitter.title",
      `twitter title is ${twitter.title.length} characters, over the recommended ${TWITTER_TITLE_MAX}`,
    );
  if (
    twitter.description &&
    twitter.description.length > TWITTER_DESCRIPTION_MAX
  )
    add(
      "twitter.description",
      `twitter description is ${twitter.description.length} characters, over the recommended ${TWITTER_DESCRIPTION_MAX}`,
    );
  if (twitter.image && !isAbsoluteUrl(twitter.image))
    add(
      "twitter.image",
      `twitter:image is not an absolute URL: "${twitter.image}"`,
    );
  if (twitter.player?.url && !isAbsoluteUrl(twitter.player.url))
    add(
      "twitter.player.url",
      `twitter:player is not an absolute URL: "${twitter.player.url}"`,
    );

  // Validate hreflang codes
  for (const alternate of page.alternates) {
    validateHreflangCode(alternate.hreflang, add);
  }
  if (
    page.alternates.length > 0 &&
    !page.alternates.some((alternate) => alternate.href === page.canonical)
  )
    add(
      "alternates",
      "page has hreflang alternates but no self-referencing alternate; add the page's own URL or configure its lang",
    );

  validateRobotsDirectives(page.robots, add);
  for (const [agent, content] of Object.entries(page.robotsByUserAgent)) {
    validateRobotsDirectives(content, (field, message) =>
      add(`${field}:${agent}`, message),
    );
  }

  for (const [name, content] of Object.entries(page.meta)) {
    if (typeof content !== "string" || content.trim().length === 0)
      add(`meta:${name}`, `meta "${name}" has an empty content value`);
  }
  for (const link of page.links) {
    if (!link.rel?.trim()) add("links", "a custom link is missing its rel");
    if (!link.href?.trim() || !isAbsoluteUrl(link.href))
      add("links", `link href is not an absolute URL: "${link.href ?? ""}"`);
  }

  return issues;
}

/** Groups a value by the routes that produced it, for duplicate detection */
function collect(
  index: Map<string, string[]>,
  value: string,
  route: string,
): void {
  const routes = index.get(value);
  if (routes) routes.push(route);
  else index.set(value, [route]);
}

/** Validates every configured page, including cross-page checks */
export function validateOptions(options: ResolvedOptions): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const titles = new Map<string, string[]>();
  const descriptions = new Map<string, string[]>();
  const canonicals = new Map<string, string[]>();

  if (!options.site.url)
    issues.push({
      route: "(site)",
      field: "site.url",
      message: "site.url is required",
    });

  if (options.robotsEnabled)
    issues.push(...validateRobotsOptions(options.robots));
  issues.push(...validateSiteJsonLd(options.site.jsonLd));

  const resolvedPages = new Map<string, ResolvedPage>();
  for (const [route, raw] of Object.entries(options.pageMeta)) {
    const page = resolvePage(route, options);
    resolvedPages.set(page.route, page);
    issues.push(...validatePage(page));
    issues.push(...validatePageJsonLd(raw.jsonLd, page.route));

    const title = page.title.trim();
    if (title) collect(titles, title, page.route);
    const description = page.description?.trim();
    if (description) collect(descriptions, description, page.route);
    collect(canonicals, page.canonical, page.route);

    if (raw.noindex && raw.sitemap === true)
      issues.push({
        route: page.route,
        field: "sitemap",
        message: "noindex page is explicitly marked for the sitemap",
      });
    if (raw.sitemap === false && raw.alternates && raw.alternates.length > 0)
      issues.push({
        route: page.route,
        field: "sitemap",
        message:
          "page is excluded from the sitemap but has hreflang alternates",
      });
  }

  // hreflang reciprocity: if page X links to page Y, page Y must link back to page X
  const pagesByCanonical = new Map<string, ResolvedPage>();
  for (const page of resolvedPages.values())
    pagesByCanonical.set(page.canonical, page);

  const reciprocityChecked = new Set<string>();
  for (const [route, page] of resolvedPages) {
    if (page.alternates.length === 0) continue;
    for (const alt of page.alternates) {
      if (alt.hreflang === "x-default") continue;
      const target = pagesByCanonical.get(alt.href);
      if (!target || target.route === route) continue;

      const key = [route, target.route].sort().join("|");
      if (reciprocityChecked.has(key)) continue;
      reciprocityChecked.add(key);

      const linksBack = target.alternates.some(
        (alternate) => alternate.href === page.canonical,
      );
      if (!linksBack)
        issues.push({
          route: `${route}, ${target.route}`,
          field: "alternates",
          message:
            "hreflang reciprocity missing: pages do not link back to each other",
        });
    }
  }

  for (const [title, routes] of titles)
    if (routes.length > 1)
      issues.push({
        route: routes.join(", "),
        field: "title",
        message: `duplicate title "${title}"`,
      });

  for (const [description, routes] of descriptions)
    if (routes.length > 1)
      issues.push({
        route: routes.join(", "),
        field: "description",
        message: `duplicate description "${description}"`,
      });

  for (const [canonical, routes] of canonicals)
    if (routes.length > 1)
      issues.push({
        route: routes.join(", "),
        field: "canonical",
        message: `duplicate canonical "${canonical}"`,
      });

  return issues;
}

/** Formats issues as a bullet list, one per line */
function formatIssues(issues: ValidationIssue[]): string {
  return issues
    .map((issue) => `  - ${issue.route}: ${issue.message}`)
    .join("\n");
}

/**
 * Runs validation according to `options.validate` and returns the issues.
 * `'warn'` logs them, `'error'` throws, `false` skips entirely.
 *
 * @param options Resolved plugin options.
 * @param logger Logger used in `'warn'` mode.
 */
export function runValidation(
  options: ResolvedOptions,
  logger: Logger,
): ValidationIssue[] {
  if (options.validate === false) return [];

  const issues = validateOptions(options);
  if (issues.length === 0) return [];

  if (options.validate === "error")
    throw new Error(
      `SEO validation failed with ${issues.length} issue(s):\n${formatIssues(issues)}`,
    );

  for (const issue of issues) logger.warn(`${issue.route}: ${issue.message}`);
  return issues;
}

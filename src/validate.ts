/** Pre-build validation */

import { resolvePage } from "./head/merge";
import type { Logger } from "./log";
import type { ResolvedOptions, ResolvedPage } from "./types";
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

/** Allowed `<meta name="robots">` directives */
const VALID_ROBOTS_DIRECTIVES = new Set([
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

/** Allowed `twitter:card` values */
const VALID_TWITTER_CARDS = new Set(["summary", "summary_large_image", "app", "player"]);

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

/** A single validation finding */
export interface ValidationIssue {
  /** Route the issue belongs to, or a comma list for cross-route issues */
  route: string;
  /** Field name, for example `title` */
  field: string;
  /** Explanation */
  message: string;
}

/** Checks a single resolved page. Returns an empty array when it passes. */
export function validatePage(page: ResolvedPage): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (field: string, message: string) => issues.push({ route: page.route, field, message });

  const title = page.title.trim();
  if (!title) add("title", "title is empty");
  else if (title.length > TITLE_MAX)
    add("title", `title is ${title.length} characters, over the recommended ${TITLE_MAX}`);

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
    add("changefreq", `changefreq "${page.changefreq}" is not one of ${[...VALID_CHANGEFREQ].join(", ")}`);

  if (page.canonical && !isAbsoluteUrl(page.canonical))
    add("canonical", `canonical is not an absolute URL: "${page.canonical}"`);

  if (page.openGraph.url && !isAbsoluteUrl(page.openGraph.url))
    add("openGraph.url", `og:url is not an absolute URL: "${page.openGraph.url}"`);

  const twitter = page.twitter;
  if (twitter.card && !VALID_TWITTER_CARDS.has(twitter.card))
    add("twitter.card", `twitter card "${twitter.card}" is not one of ${[...VALID_TWITTER_CARDS].join(", ")}`);
  if (twitter.title && twitter.title.length > TWITTER_TITLE_MAX)
    add(
      "twitter.title",
      `twitter title is ${twitter.title.length} characters, over the recommended ${TWITTER_TITLE_MAX}`,
    );
  if (twitter.description && twitter.description.length > TWITTER_DESCRIPTION_MAX)
    add(
      "twitter.description",
      `twitter description is ${twitter.description.length} characters, over the recommended ${TWITTER_DESCRIPTION_MAX}`,
    );
  if (twitter.image && !isAbsoluteUrl(twitter.image))
    add("twitter.image", `twitter:image is not an absolute URL: "${twitter.image}"`);
  if (twitter.player?.url && !isAbsoluteUrl(twitter.player.url))
    add("twitter.player.url", `twitter:player is not an absolute URL: "${twitter.player.url}"`);

  if (page.robots) {
    for (const directive of page.robots.split(",")) {
      const key = directive.trim().split(":")[0]?.trim().toLowerCase() ?? "";
      if (key && !VALID_ROBOTS_DIRECTIVES.has(key) && !key.startsWith("max-") && key !== "unavailable_after")
        add("robots", `robots directive "${directive.trim()}" is not recognized`);
    }
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
function collect(index: Map<string, string[]>, value: string, route: string): void {
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

  if (!options.site.url) issues.push({ route: "(site)", field: "site.url", message: "site.url is required" });

  for (const [route, raw] of Object.entries(options.pageMeta)) {
    const page = resolvePage(route, options);
    issues.push(...validatePage(page));

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
        message: "page is excluded from the sitemap but has hreflang alternates",
      });
  }

  for (const [title, routes] of titles)
    if (routes.length > 1)
      issues.push({ route: routes.join(", "), field: "title", message: `duplicate title "${title}"` });

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
  return issues.map((issue) => `  - ${issue.route}: ${issue.message}`).join("\n");
}

/**
 * Runs validation according to `options.validate` and returns the issues.
 * `'warn'` logs them, `'error'` throws, `false` skips entirely.
 *
 * @param options Resolved plugin options.
 * @param logger Logger used in `'warn'` mode.
 */
export function runValidation(options: ResolvedOptions, logger: Logger): ValidationIssue[] {
  if (options.validate === false) return [];

  const issues = validateOptions(options);
  if (issues.length === 0) return [];

  if (options.validate === "error")
    throw new Error(`SEO validation failed with ${issues.length} issue(s):\n${formatIssues(issues)}`);

  for (const issue of issues) logger.warn(`${issue.route}: ${issue.message}`);
  return issues;
}

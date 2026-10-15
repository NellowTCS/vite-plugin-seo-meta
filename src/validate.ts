/** Pre-build validation */
import { resolvePage } from "./head/merge";
import type { Logger } from "./log";
import type { ResolvedOptions, ResolvedPage } from "./types";

/** Rendered titles past this get cut off in search results */
const TITLE_MAX = 60;

/** Rendered descriptions past this get cut off */
const DESCRIPTION_MAX = 160;

/** Descriptions under this are too smol to be useful */
const DESCRIPTION_MIN = 50;

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

  for (const [route, raw] of Object.entries(options.pageMeta)) {
    const page = resolvePage(route, options);
    issues.push(...validatePage(page));

    const title = page.title.trim();
    if (title) collect(titles, title, page.route);
    const description = page.description?.trim();
    if (description) collect(descriptions, description, page.route);

    if (raw.noindex && raw.sitemap === true)
      issues.push({
        route: page.route,
        field: "sitemap",
        message: "noindex page is explicitly marked for the sitemap",
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

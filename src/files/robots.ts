/** robots.txt generation */

import type { RobotsFileOptions, ResolvedPage, ResolvedSite } from "../types";

const DEFAULT_USER_AGENT = "*";

/** Dedupes while keeping the original order */
function unique(paths: string[]): string[] {
  return [...new Set(paths)];
}

/** Splits on any line ending, dropping the empty tail a trailing newline leaves behind */
function toLines(content: string): string[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/** Drops trailing blank lines */
function trimTrailingBlanks(lines: string[]): string[] {
  const copy = [...lines];
  while (copy.at(-1)?.trim() === "") copy.pop();
  return copy;
}

/**
 * Normalizes a directive for comparison, or undefined for blanks and comments
 * - Squashes whitespace and lowercases the key so `Disallow:/a` and `disallow: /a` collide
 */
function normalizeDirective(line: string): string | undefined {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return undefined;
  const colon = trimmed.indexOf(":");
  if (colon === -1) return undefined;
  const key = trimmed.slice(0, colon).trim().toLowerCase();
  const value = trimmed.slice(colon + 1).trim().replace(/\s+/g, " ");
  return `${key}: ${value}`;
}

/** One `User-agent` group with its rules */
function renderGroup(agents: string[], disallow: string[], allow: string[]): string {
  const lines = agents.map((agent) => `User-agent: ${agent}`);
  for (const path of disallow) lines.push(`Disallow: ${path}`);
  for (const path of allow) lines.push(`Allow: ${path}`);
  return lines.join("\n");
}

/** The sitemap URL, or undefined when it is turned off */
function sitemapUrl(site: ResolvedSite, options: RobotsFileOptions): string | undefined {
  if (options.sitemap === false) return undefined;
  if (typeof options.sitemap === "string") return options.sitemap;
  return site.url ? `${site.url}/sitemap.xml` : undefined;
}

/**
 * Paths to disallow for noindex pages
 * When `disallowNoindex` is true, block crawling of pages that should not be indexed
 */
export function noindexDisallow(pages: ResolvedPage[], disallowNoindex = false): string[] {
  if (!disallowNoindex) return [];
  return pages.filter((page) => page.noindex).map((page) => page.route);
}

/**
 * Builds the contents of `robots.txt`
 * - `pageDisallow` holds paths from noindex pages, merged into the rules
 *
 * @returns the file contents, ending in a newline
 */
export function buildRobots(
  site: ResolvedSite,
  options: RobotsFileOptions,
  pageDisallow: string[] = [],
): string {
  const configured = options.userAgent ?? DEFAULT_USER_AGENT;
  const agents = (Array.isArray(configured) ? configured : [configured]).filter(Boolean);
  const disallow = unique([...(options.disallow ?? []), ...pageDisallow]);
  const allow = unique(options.allow ?? []);

  const blocks: string[] = [renderGroup(agents, disallow, allow)];
  if (options.rules && options.rules.length > 0) blocks.push(options.rules.join("\n"));

  const sitemap = sitemapUrl(site, options);
  if (sitemap) blocks.push(`Sitemap: ${sitemap}`);

  return `${blocks.join("\n\n")}\n`;
}

/**
 * Merges generated rules into an existing `robots.txt`
 * - Existing lines are kept, generated lines are appended
 *
 * TODO: robots.txt groups are positional, so appended rules land in whatever agent group the
 * file ends on.
 *
 * @param existing - the file already on disk (for example a hand-written `public/robots.txt`)
 * @param generated - output of {@link buildRobots}
 * @returns the merged contents, ending in a newline
 */
export function mergeRobots(existing: string, generated: string): string {
  const existingLines = toLines(existing);
  if (existingLines.every((line) => line.trim() === "")) {
    return `${toLines(generated).join("\n")}\n`;
  }

  const seen = new Set<string>();
  for (const line of existingLines) {
    const directive = normalizeDirective(line);
    if (directive) seen.add(directive);
  }

  const appended: string[] = [];
  for (const line of toLines(generated)) {
    const directive = normalizeDirective(line);
    if (directive) {
      if (seen.has(directive)) continue;
      seen.add(directive);
      appended.push(line.trimEnd());
    } else if (line.trim() !== "") {
      appended.push(line.trimEnd());
    }
  }

  const head = trimTrailingBlanks(existingLines).map((line) => line.trimEnd());
  if (appended.length === 0) return `${head.join("\n")}\n`;
  return `${head.join("\n")}\n\n${appended.join("\n")}\n`;
}

/** robots.txt generation */

import type { RobotsFileOptions, ResolvedSite } from "../types";

const DEFAULT_USER_AGENT = "*";

/** Dedupes while keeping the original order */
function unique(paths: string[]): string[] {
  return [...new Set(paths)];
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

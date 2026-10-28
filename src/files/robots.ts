/** robots.txt generation
 *
 * Ref: https://www.rfc-editor.org/rfc/rfc9309.txt
 */

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
  const value = trimmed
    .slice(colon + 1)
    .trim()
    .replace(/\s+/g, " ");
  return `${key}: ${value}`;
}

/** Renders a single group */
function renderGroup(
  agents: string[],
  disallow: string[],
  allow: string[],
  crawlDelay?: number,
  cleanParam?: string[],
): string {
  const lines = agents.map((agent) => `User-agent: ${agent}`);

  for (const path of disallow) lines.push(`Disallow: ${path}`);
  for (const path of allow) lines.push(`Allow: ${path}`);

  if (crawlDelay !== undefined) lines.push(`Crawl-delay: ${crawlDelay}`);
  for (const param of cleanParam ?? []) lines.push(`Clean-param: ${param}`);

  return lines.join("\n");
}

/** The sitemap URL, or undefined when it is turned off */
function sitemapUrl(
  site: ResolvedSite,
  options: RobotsFileOptions,
): string | undefined {
  if (options.sitemap === false) return undefined;
  if (typeof options.sitemap === "string") return options.sitemap;
  return site.url ? `${site.url}/sitemap.xml` : undefined;
}

/**
 * Paths to disallow for noindex pages
 * When `disallowNoindex` is true, block crawling of pages that should not be indexed
 */
export function noindexDisallow(
  pages: ResolvedPage[],
  disallowNoindex = false,
): string[] {
  if (!disallowNoindex) return [];
  return pages.filter((page) => page.noindex).map((page) => page.route);
}

/**
 * Builds the contents of `robots.txt`
 * - `pageDisallow` holds paths from noindex pages, merged into the default group's rules.
 * - Groups are positional; the default group comes first, then configured groups, then
 *   `Host:`/`Sitemap:` records (which are not part of any group).
 *
 * @returns the file contents, ending in a newline
 */
export function buildRobots(
  site: ResolvedSite,
  options: RobotsFileOptions,
  pageDisallow: string[] = [],
): string {
  const defaultAgents = (
    Array.isArray(options.userAgent)
      ? options.userAgent
      : [options.userAgent ?? DEFAULT_USER_AGENT]
  ).filter(Boolean);
  const defaultDisallow = unique([
    ...(options.disallow ?? []),
    ...pageDisallow,
  ]);
  const defaultAllow = unique(options.allow ?? []);
  const defaultCleanParam = unique(
    typeof options.cleanParam === "string"
      ? [options.cleanParam]
      : (options.cleanParam ?? []),
  );
  const blocks: string[] = [
    renderGroup(
      defaultAgents,
      defaultDisallow,
      defaultAllow,
      options.crawlDelay,
      defaultCleanParam,
    ),
  ];

  for (const group of options.groups ?? []) {
    const agents = (
      Array.isArray(group.userAgent) ? group.userAgent : [group.userAgent]
    ).filter(Boolean);
    const disallow = unique(group.disallow ?? []);
    const allow = unique(group.allow ?? []);
    const cleanParam = unique(
      typeof group.cleanParam === "string"
        ? [group.cleanParam]
        : (group.cleanParam ?? []),
    );
    blocks.push(
      renderGroup(agents, disallow, allow, group.crawlDelay, cleanParam),
    );
  }

  if (options.rules && options.rules.length > 0)
    blocks.push(options.rules.join("\n"));
  if (options.host) blocks.push(`Host: ${options.host}`);

  const sitemap = sitemapUrl(site, options);
  if (sitemap) blocks.push(`Sitemap: ${sitemap}`);

  return `${blocks.join("\n\n")}\n`;
}

/**
 * Merges generated rules into an existing `robots.txt`
 * - Existing lines are kept; generated rules are inserted into the matching
 *   user-agent group (keyed by the group's whole agent set), or appended whole
 *   when the group is new sigh
 * - a run of `User-agent:` lines is one group; rules go after the last agent line, never between em
 * - `Host:`/`Sitemap:` records are global and deduped across the file
 * - duplicate directives within a group are dropped (obviously);
 *   same directive across different groups is fine and kept
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

  // group by the whole agent set - `a` then `b` is one group,
  // keying by single agent would split the run and mess things up
  const agentKey = (agents: string[]) => [...agents].sort().join("|");
  const byGroup = new Map<string, { agents: string[]; rules: string[] }>();
  const records: string[] = [];
  let group = "";
  // User-agent extends the run until a rule or blank line closes it;
  // after that next User-agent starts a new group
  let groupHasRules = false;
  for (const line of toLines(generated)) {
    const directive = normalizeDirective(line);
    if (!directive) {
      if (line.trim() === "") {
        group = "";
        groupHasRules = false;
      }
      continue;
    }
    if (directive.startsWith("user-agent:")) {
      const agent = directive.slice("user-agent:".length).trim().toLowerCase();
      const extending = group !== "" && !groupHasRules;
      const newKey = agentKey(
        extending ? [...group.split("|"), agent] : [agent],
      );
      groupHasRules = false;
      if (extending && newKey !== group) {
        // key grew (a -> a|b), isn't that obvious
        const prev = byGroup.get(group);
        byGroup.delete(group);
        byGroup.set(newKey, {
          agents: [...(prev?.agents ?? []), line.trimEnd()],
          rules: prev?.rules ?? [],
        });
      } else {
        if (!byGroup.has(newKey))
          byGroup.set(newKey, { agents: [], rules: [] });
        byGroup.get(newKey)!.agents.push(line.trimEnd());
      }
      group = newKey;
    } else if (
      directive.startsWith("sitemap:") ||
      directive.startsWith("host:")
    ) {
      records.push(line.trimEnd());
    } else {
      byGroup.get(group)!.rules.push(line.trimEnd());
      groupHasRules = true;
    }
  }

  const out: string[] = [];
  const tail: string[] = [];
  const matched = new Set<string>();
  const seenByGroup = new Map<string, Set<string>>();
  const seenRecords = new Set<string>();
  let currentAgents: string[] = [];
  let currentKey = "";
  let insertAt = -1;

  const seenFor = (key: string) => {
    let seen = seenByGroup.get(key);
    if (!seen) {
      seen = new Set<string>();
      seenByGroup.set(key, seen);
    }
    return seen;
  };

  const flush = () => {
    if (!currentKey) return;
    const entry = byGroup.get(currentKey);
    if (!entry) return;
    matched.add(currentKey);
    const seen = seenFor(currentKey);
    const newRules = entry.rules.filter((rule) => {
      const directive = normalizeDirective(rule);
      if (directive && seen.has(directive)) return false;
      if (directive) seen.add(directive);
      return true;
    });
    if (newRules.length > 0) {
      out.splice(insertAt + 1, 0, ...newRules);
      insertAt += newRules.length;
    }
  };

  for (let i = 0; i < existingLines.length; i++) {
    const line = existingLines[i] ?? "";
    const directive = normalizeDirective(line);

    if (line.trim() === "") {
      flush();
      currentAgents = [];
      currentKey = "";
      insertAt = -1;
      groupHasRules = false;
      out.push(line);
      continue;
    }

    if (directive?.startsWith("user-agent:")) {
      // extend the run ONLYYY if we're in it, otherwise we get some bad behavior
      const isConsecutive = currentAgents.length > 0 && !groupHasRules;
      if (!isConsecutive) flush();
      if (!isConsecutive) currentAgents = [];
      currentAgents.push(
        directive.slice("user-agent:".length).trim().toLowerCase(),
      );
      currentKey = agentKey(currentAgents);
      groupHasRules = false;
      out.push(line);
      insertAt = out.length; // after this agent line; a rule below moves it further
      continue;
    }

    if (directive) {
      if (currentAgents.length > 0) insertAt = out.length;
      if (currentKey) {
        const seen = seenFor(currentKey);
        seen.add(directive);
        groupHasRules = true;
      } else {
        seenRecords.add(directive);
      }
    }
    out.push(line);
  }
  flush();

  // Groups with no match in the existing file, plus records, go to the tail
  for (const [key, { agents, rules }] of byGroup) {
    if (matched.has(key)) continue;
    const seen = seenFor(key);
    for (const line of [...agents, ...rules]) {
      const directive = normalizeDirective(line);
      if (directive && seen.has(directive)) continue;
      if (directive) seen.add(directive);
      tail.push(line);
    }
  }
  for (const record of records) {
    const directive = normalizeDirective(record);
    if (directive && seenRecords.has(directive)) continue;
    if (directive) seenRecords.add(directive);
    tail.push(record);
  }

  if (tail.length > 0) {
    out.push("");
    out.push(...tail);
  }

  return `${trimTrailingBlanks(out).join("\n")}\n`;
}

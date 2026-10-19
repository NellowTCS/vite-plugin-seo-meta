/** Renders `<meta name="robots">` */

import type { RobotsDirectives } from "../types";

/** ISO 8601 for `Date` */
function formatUnavailableAfter(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value.trim();
}

/**
 * Renders robots directives into a meta content string
 * - Mind you, a raw string passes through (trimmed, empty becomes `undefined`)
 * - Structured directives are ordered
 *
 * @returns the content value, or `undefined` when there is nothing to render
 */
export function renderRobotsMeta(
  value: string | RobotsDirectives | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  const parts: string[] = [];
  if (value.none) parts.push("none");
  if (value.all) parts.push("all");
  if (value.noindex) parts.push("noindex");
  if (value.nofollow) parts.push("nofollow");
  if (value.nosnippet) parts.push("nosnippet");
  if (value.noimageindex) parts.push("noimageindex");
  if (value.notranslate) parts.push("notranslate");
  if (value.indexifembedded) parts.push("indexifembedded");
  if (value.noarchive) parts.push("noarchive");
  if (value.nositelinkssearchbox) parts.push("nositelinkssearchbox");
  if (value.maxSnippet !== undefined)
    parts.push(`max-snippet:${value.maxSnippet}`);
  if (value.maxImagePreview !== undefined) {
    parts.push(`max-image-preview:${value.maxImagePreview}`);
  }
  if (value.maxVideoPreview !== undefined) {
    parts.push(`max-video-preview:${value.maxVideoPreview}`);
  }
  if (value.unavailableAfter !== undefined) {
    const when = formatUnavailableAfter(value.unavailableAfter);
    if (when.length > 0) parts.push(`unavailable_after:${when}`);
  }
  return parts.length > 0 ? parts.join(", ") : undefined;
}

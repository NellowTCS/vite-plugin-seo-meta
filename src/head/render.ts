/** Renders every head tag for a page */

import type { HeadTag, ResolvedPage, ResolvedSite } from "../types";
import { basicTags } from "./tags/basic";
import { canonicalTags } from "./tags/canonical";
import { openGraphTags } from "./tags/open-graph";

/**
 * Collects all head tags
 */
export function renderHeadTags(page: ResolvedPage, site: ResolvedSite): HeadTag[] {
  return [...basicTags(page, site), ...canonicalTags(page), ...openGraphTags(page)];
}

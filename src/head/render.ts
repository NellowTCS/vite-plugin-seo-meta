/** Renders every head tag for a page */

import type { HeadTag, ResolvedPage, ResolvedSite } from "../types.js";
import { basicTags } from "./tags/basic.js";

/**
 * Collects all head tags
 */
export function renderHeadTags(page: ResolvedPage, site: ResolvedSite): HeadTag[] {
  return [...basicTags(page, site)];
}

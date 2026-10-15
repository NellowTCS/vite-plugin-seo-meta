/** Renders every head tag for a page */

import type { HeadTag, ResolvedPage, ResolvedSite } from "../types";
import { basicTags } from "./tags/basic";
import { canonicalTags } from "./tags/canonical";
import { faviconTags } from "./tags/favicon";
import { hreflangTags } from "./tags/hreflang";
import { jsonLdTags } from "./tags/json-ld";
import { openGraphTags } from "./tags/open-graph";
import { twitterTags } from "./tags/twitter";

/**
 * Collects all head tags
 */
export function renderHeadTags(page: ResolvedPage, site: ResolvedSite): HeadTag[] {
  return [
    ...basicTags(page, site),
    ...faviconTags(site),
    ...canonicalTags(page),
    ...hreflangTags(page),
    ...openGraphTags(page),
    ...twitterTags(page),
    ...jsonLdTags(page),
  ];
}

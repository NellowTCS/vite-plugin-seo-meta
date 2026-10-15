/** Open Graph (`property="og:*"`) tags */

import type { HeadTag, ResolvedPage } from "../../types";

/** Builds a `<meta property content>` tag */
function ogTag(property: string, content: string): HeadTag {
  return { tag: "meta", attrs: { property, content }, key: `meta:${property.toLowerCase()}` };
}

/** Builds the Open Graph meta tags for a page */
export function openGraphTags(page: ResolvedPage): HeadTag[] {
  const og = page.openGraph;
  const tags: HeadTag[] = [];
  if (og.type) tags.push(ogTag("og:type", og.type));
  if (og.title) tags.push(ogTag("og:title", og.title));
  if (og.description) tags.push(ogTag("og:description", og.description));
  if (og.url) tags.push(ogTag("og:url", og.url));
  if (og.siteName) tags.push(ogTag("og:site_name", og.siteName));
  if (og.locale) tags.push(ogTag("og:locale", og.locale));
  if (og.image) {
    tags.push(ogTag("og:image", og.image));
    if (og.imageAlt) tags.push(ogTag("og:image:alt", og.imageAlt));
    if (og.imageWidth !== undefined) tags.push(ogTag("og:image:width", String(og.imageWidth)));
    if (og.imageHeight !== undefined) tags.push(ogTag("og:image:height", String(og.imageHeight)));
  }
  return tags;
}

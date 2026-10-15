/** Twitter card (`name="twitter:*"`) tags */

import type { HeadTag, ResolvedPage } from "../../types";

/** Builds a `<meta name content>` tag */
function twitterTag(name: string, content: string): HeadTag {
  return { tag: "meta", attrs: { name: `twitter:${name}`, content }, key: `meta:twitter:${name}` };
}

/** Builds the Twitter meta tags for a page */
export function twitterTags(page: ResolvedPage): HeadTag[] {
  const twitter = page.twitter;
  const empty =
    !twitter.title && !twitter.description && !twitter.image && !twitter.site && !twitter.creator;
  if (empty) return [];

  const tags: HeadTag[] = [];
  if (twitter.card) tags.push(twitterTag("card", twitter.card));
  if (twitter.title) tags.push(twitterTag("title", twitter.title));
  if (twitter.description) tags.push(twitterTag("description", twitter.description));
  if (twitter.site) tags.push(twitterTag("site", twitter.site));
  if (twitter.creator) tags.push(twitterTag("creator", twitter.creator));
  if (twitter.image) {
    tags.push(twitterTag("image", twitter.image));
    if (twitter.imageAlt) tags.push(twitterTag("image:alt", twitter.imageAlt));
  }
  return tags;
}

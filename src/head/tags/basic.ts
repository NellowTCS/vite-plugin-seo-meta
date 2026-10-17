/** Basic meta tags for a page */

import type { HeadTag, ResolvedPage, ResolvedSite } from "../../types";
import { normalizeThemeColors } from "../../config/resolve";
import { linkKey, metaKey } from "../../html/key";

/** Builds a `<meta name content>` tag */
function metaTag(name: string, content: string): HeadTag {
  return { tag: "meta", attrs: { name, content }, key: metaKey(name) };
}

/** Builds the meta tags for a page */
export function basicTags(page: ResolvedPage, site: ResolvedSite): HeadTag[] {
  const tags: HeadTag[] = [
    // onlyIfMissing to prevent messing up user stuff
    { tag: "meta", attrs: { charset: "utf-8" }, key: "meta:charset", onlyIfMissing: true },
    {
      tag: "meta",
      attrs: { name: "viewport", content: "width=device-width, initial-scale=1" },
      key: "meta:viewport",
      onlyIfMissing: true,
    },
  ];
  if (page.title) tags.push({ tag: "title", attrs: {}, text: page.title, key: "title" });
  if (site.name) tags.push(metaTag("application-name", site.name));
  if (page.description) tags.push(metaTag("description", page.description));
  if (page.keywords.length > 0) tags.push(metaTag("keywords", page.keywords.join(", ")));
  if (page.author) tags.push(metaTag("author", page.author));
  if (page.robots) tags.push(metaTag("robots", page.robots));
  for (const [userAgent, content] of Object.entries(page.robotsByUserAgent)) {
    tags.push(metaTag(userAgent, content));
  }
  for (const { color, media } of normalizeThemeColors(site.favicon.themeColor)) {
    const attrs: Record<string, string> = { name: "theme-color", content: color };
    if (media) attrs.media = media;
    tags.push({ tag: "meta", attrs, key: metaKey("theme-color", media) });
  }
  for (const [name, content] of Object.entries(page.meta)) tags.push(metaTag(name, content));
  // escape hatch cause we don't want to have to support every possible meta tag
  for (const link of page.links) {
    tags.push({ tag: "link", attrs: { ...link }, key: linkKey(link.rel, link.hreflang, link.sizes) });
  }
  return tags;
}

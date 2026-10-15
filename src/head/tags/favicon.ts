/** Favicon and related icon links */

import type { HeadTag, ResolvedSite } from "../../types";
import { linkKey } from "../../html/dedupe";

/** Icon links for the site (paths are already absolute) */
export function faviconTags(site: ResolvedSite): HeadTag[] {
  const favicon = site.favicon;
  const tags: HeadTag[] = [];
  if (favicon.icon) {
    tags.push({ tag: "link", attrs: { rel: "icon", href: favicon.icon }, key: linkKey("icon") });
  }
  if (favicon.appleTouchIcon) {
    tags.push({
      tag: "link",
      attrs: { rel: "apple-touch-icon", href: favicon.appleTouchIcon },
      key: linkKey("apple-touch-icon"),
    });
  }
  if (favicon.manifest) {
    tags.push({
      tag: "link",
      attrs: { rel: "manifest", href: favicon.manifest },
      key: linkKey("manifest"),
    });
  }
  if (favicon.maskIcon) {
    // Safari needs a color for pinned-tab mask icons, themeColor is the closest thing we have lol
    const attrs: Record<string, string> = { rel: "mask-icon", href: favicon.maskIcon };
    if (favicon.themeColor) attrs.color = favicon.themeColor;
    tags.push({ tag: "link", attrs, key: linkKey("mask-icon") });
  }
  return tags;
}

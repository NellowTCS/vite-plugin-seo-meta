/** Favicon and related icon links
 *
 * Refs:
 * - https://github.com/audreyfeldroy/favicon-cheat-sheet (i could hug this person, thank you so much for existing)
 * - https://web.archive.org/web/20231217021358/https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/icon-and-image-design
 */

import type { HeadTag, ResolvedSite } from "../../types";
import { normalizeThemeColors } from "../../config/resolve";
import { linkKey, metaKey } from "../../html/key";

/** Emits one `<link rel=...>` tag */
function linkTag(rel: string, href: string, sizes?: string, extra: Record<string, string> = {}): HeadTag {
  return {
    tag: "link",
    attrs: { rel, href, ...extra },
    key: linkKey(rel, undefined, sizes),
  };
}

/** Emits one `<meta name=...>` tag */
function metaTag(name: string, content: string): HeadTag {
  return { tag: "meta", attrs: { name, content }, key: metaKey(name) };
}

/**
 * Builds the favicon and platform icon links for a site.
 * - All paths are already absolute (resolved at config time). 
 *   (i hate paths... absolute shifts the pain to someone else and makes my life easier)
 * - `mask-icon` carries a `color` attribute
 *   (Safari pinned tabs cause EACH BROWSER HAS SO MANY ONLY ITSELF FEATURES AND AGHHHHHHH)
 * - Apple mobile-web-app and Microsoft tile tags are emitted here too.
 */
export function faviconTags(site: ResolvedSite): HeadTag[] {
  const favicon = site.favicon;
  const tags: HeadTag[] = [];

  if (favicon.icon) tags.push(linkTag("icon", favicon.icon));
  if (favicon.appleTouchIcon) tags.push(linkTag("apple-touch-icon", favicon.appleTouchIcon));
  if (favicon.appleTouchIconPrecomposed) {
    tags.push(linkTag("apple-touch-icon-precomposed", favicon.appleTouchIconPrecomposed));
  }
  if (favicon.manifest) tags.push(linkTag("manifest", favicon.manifest));

  if (favicon.maskIcon) {
    // Safari needs a color for pinned-tab mask icons; themeColor is the closest thing we have 
    // TODO: maybe we should allow a separate mask-icon color in the config? (i don't want to, but maybe we should)
    const [maskColor] = normalizeThemeColors(favicon.themeColor);
    tags.push(linkTag("mask-icon", favicon.maskIcon, undefined, { color: maskColor?.color ?? "#000000" }));
  }

  // Apple mobile web app meta tags
  if (favicon.mobileWebApp) {
    const mwa = favicon.mobileWebApp;
    if (mwa.title) tags.push(metaTag("apple-mobile-web-app-title", mwa.title));
    if (mwa.capable) tags.push(metaTag("apple-mobile-web-app-capable", "yes"));
    if (mwa.statusBarStyle) tags.push(metaTag("apple-mobile-web-app-status-bar-style", mwa.statusBarStyle));
  }

  // Microsoft IE/Edge tile tags
  // side note: isn't it interesting how Apple and Microsoft have their own versions while Google
  // and Mozilla just use the standard favicon? (i guess they don't have a desktop OS to worry about but stillll
  // it's kinda annoying, they should deprecate it and just use the normal favicon like everyone else)
  // he says, about Microsoft IE... which is a dead browser. sigh never change, me, never change.
  if (favicon.msapplication) {
    const ms = favicon.msapplication;
    if (ms.tileColor) tags.push(metaTag("msapplication-TileColor", ms.tileColor));
    if (ms.tileImage) tags.push(metaTag("msapplication-TileImage", ms.tileImage));
    if (ms.config) tags.push(linkTag("msapplication-config", ms.config));
  }

  return tags;
}

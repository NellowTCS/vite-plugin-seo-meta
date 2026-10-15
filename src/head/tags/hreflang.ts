/** hreflang alternate links */

import type { HeadTag, ResolvedPage } from "../../types";
import { linkKey } from "../../html/key";

/** One `<link rel="alternate" hreflang>` per locale (already absolute) */
export function hreflangTags(page: ResolvedPage): HeadTag[] {
  return page.alternates.map((alternate) => ({
    tag: "link",
    attrs: { rel: "alternate", hreflang: alternate.hreflang, href: alternate.href },
    key: linkKey("alternate", alternate.hreflang),
  }));
}

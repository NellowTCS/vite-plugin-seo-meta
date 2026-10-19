/** Canonical link injection */

import type { HeadTag, ResolvedPage } from "../../types";

/** The `<link rel="canonical">` for a page, or nothing when it has none */
export function canonicalTags(page: ResolvedPage): HeadTag[] {
  if (!page.canonical) return [];
  return [
    {
      tag: "link",
      attrs: { rel: "canonical", href: page.canonical },
      key: "link:canonical",
    },
  ];
}

/** head-element dedupe keys */

/**
 * Dedupe key for a `<link>`
 */
export function linkKey(rel: string, hreflang?: string, sizes?: string): string {
  return `link:${rel.toLowerCase()}${hreflang ? `:${hreflang}` : ""}${sizes ? `:${sizes}` : ""}`;
}

/**
 * Dedupe key for a managed head element, or undefined for elements we leave alone.
 *
 * @param tagName Element tag name (case-insensitive).
 * @param get Reads an attribute value, or undefined when it is absent.
 */
export function headElementKey(
  tagName: string,
  get: (name: string) => string | undefined,
): string | undefined {
  const tag = tagName.toLowerCase();
  if (tag === "title") return "title";
  if (tag === "meta") {
    const name = get("name") ?? get("property") ?? get("http-equiv") ?? get("itemprop");
    if (name) return `meta:${name.toLowerCase()}`;
    if (get("charset") !== undefined) return "meta:charset";
    return undefined;
  }
  if (tag === "link") {
    const rel = get("rel");
    if (!rel) return undefined;
    return linkKey(rel, get("hreflang"), get("sizes"));
  }
  if (tag === "script" && get("type") === "application/ld+json") return "script:jsonld";
  return undefined;
}

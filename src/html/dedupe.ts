/** Dedupe keys */

import { defaultTreeAdapter } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";

export type P5Node = DefaultTreeAdapterMap["node"];
export type P5Element = DefaultTreeAdapterMap["element"];
export type P5Parent = DefaultTreeAdapterMap["parentNode"];

/** True when the node is an element (has a tag name) */
export function isElement(node: P5Node): node is P5Element {
  return defaultTreeAdapter.isElementNode(node);
}

/** Reads an attribute value, or undefined when it is not there */
export function getAttr(element: P5Element, name: string): string | undefined {
  for (const attr of element.attrs) {
    if (attr.name === name) return attr.value;
  }
  return undefined;
}

/** True when the element carries the given attribute at all */
export function hasAttr(element: P5Element, name: string): boolean {
  return element.attrs.some((attr) => attr.name === name);
}

/**
 * Dedupe key for a managed head element, or undefined for elements left alone
 */
export function elementKey(node: P5Node): string | undefined {
  if (!isElement(node)) return undefined;
  const tag = node.tagName;
  if (tag === "title") return "title";
  if (tag === "meta") {
    const name =
      getAttr(node, "name") ??
      getAttr(node, "property") ??
      getAttr(node, "http-equiv") ??
      getAttr(node, "itemprop");
    if (name) return `meta:${name.toLowerCase()}`;
    if (hasAttr(node, "charset")) return "meta:charset";
    return undefined;
  }
  if (tag === "link") {
    const rel = getAttr(node, "rel");
    if (!rel) return undefined;
    const hreflang = getAttr(node, "hreflang");
    const sizes = getAttr(node, "sizes");
    return `link:${rel.toLowerCase()}${hreflang ? `:${hreflang}` : ""}${sizes ? `:${sizes}` : ""}`;
  }
  if (tag === "script" && getAttr(node, "type") === "application/ld+json") return "script:jsonld";
  return undefined;
}

/** Drops head children whose dedupe key is in `keys` */
export function stripManagedNodes(head: P5Element, keys: Set<string>): void {
  head.childNodes = head.childNodes.filter((child) => {
    const key = elementKey(child);
    return !(key && keys.has(key));
  });
}

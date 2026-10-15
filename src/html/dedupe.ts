/** Dedupe keys */

import { defaultTreeAdapter } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";
import { headElementKey } from "./key";

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

/**
 * Dedupe key for a managed head element, or undefined for elements left alone
 */
export function elementKey(node: P5Node): string | undefined {
  if (!isElement(node)) return undefined;
  return headElementKey(node.tagName, (name) => getAttr(node, name));
}

/** Drops head children whose dedupe key is in `keys` */
export function stripManagedNodes(head: P5Element, keys: Set<string>): void {
  head.childNodes = head.childNodes.filter((child) => {
    const key = elementKey(child);
    return !(key && keys.has(key));
  });
}

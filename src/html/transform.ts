/** Injects rendered head tags into an HTML document via parse5 */

import { defaultTreeAdapter, parse, parseFragment, serialize } from "parse5";
import type { HeadTag } from "../types";
import { elementKey, isElement, stripManagedNodes } from "./dedupe";
import type { P5Element, P5Parent } from "./dedupe";

/** Builds a `<tag>` element with attributes, optionally holding text */
function createElement(tagName: string, attrs: Record<string, string>, text?: string): P5Element {
  const fragment = parseFragment(`<${tagName}></${tagName}>`);
  const element = fragment.childNodes.find(
    (node): node is P5Element => isElement(node) && node.tagName === tagName,
  );
  if (!element) throw new Error(`failed to build <${tagName}> element`);
  element.attrs = Object.entries(attrs).map(([name, value]) => ({ name, value }));
  if (text !== undefined) {
    // appendChild (not a raw childNodes push) so parentNode is set and <script> stays raw text
    defaultTreeAdapter.appendChild(element, defaultTreeAdapter.createTextNode(text));
  }
  return element;
}

/** Depth-first search for the first descendant element with `tagName` */
function findElement(root: P5Parent, tagName: string): P5Element | undefined {
  const queue: P5Parent[] = [root];
  while (queue.length > 0) {
    const parent = queue.pop();
    if (!parent) break;
    for (const child of parent.childNodes) {
      if (!isElement(child)) continue;
      if (child.tagName === tagName) return child;
      queue.push(child);
    }
  }
  return undefined;
}

/**
 * Injects rendered head tags into an HTML document
 * - managed tags (title / meta / link / ld+json) are replaced, not appended
 * - tags flagged `onlyIfMissing` are skipped when an equal element already exists
 *
 * @returns the serialized document, or the input untouched when there is no <head>
 */
export function injectHeadTags(html: string, tags: HeadTag[]): string {
  const document = parse(html);
  const head = findElement(document, "head");
  if (!head || head.childNodes.length === 0) return html;

  const existing = new Set<string>();
  for (const child of head.childNodes) {
    const key = elementKey(child);
    if (key) existing.add(key);
  }

  const removeKeys = new Set<string>();
  const toAdd: HeadTag[] = [];
  for (const tag of tags) {
    if (tag.onlyIfMissing && existing.has(tag.key)) continue;
    removeKeys.add(tag.key);
    toAdd.push(tag);
  }

  stripManagedNodes(head, removeKeys);
  for (const tag of toAdd) {
    defaultTreeAdapter.appendChild(head, createElement(tag.tag, tag.attrs, tag.text));
  }

  return serialize(document);
}

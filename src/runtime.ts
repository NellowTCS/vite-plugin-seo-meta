/**
 * Opt-in client helper for SPAs.
 *
 * Import from the `vite-plugin-seo-meta/runtime` subpath and call `applySeo` on route
 * changes. Build-time injection still covers the initial document; this only keeps the
 * `<head>` in sync after client-side navigation.
 */
import { site as injectedSite } from "virtual:vite-plugin-seo-meta/config";
import { resolveSite } from "./config/resolve";
import { resolvePage } from "./head/merge";
import { renderHeadTags } from "./head/render";
import { headElementKey } from "./html/key";
import type {
  HeadTag,
  PageMeta,
  ResolvedOptions,
  ResolvedSite,
  SiteConfig,
} from "./types";
import { normalizeRoute } from "./url";

function domKey(element: Element): string | undefined {
  return headElementKey(
    element.tagName,
    (name) => element.getAttribute(name) ?? undefined,
  );
}

function findByKey(head: HTMLElement, key: string): Element | undefined {
  for (const child of Array.from(head.children)) {
    if (domKey(child) === key) return child;
  }
  return undefined;
}

function toElement(tag: HeadTag): Element {
  const element = document.createElement(tag.tag);
  for (const [name, value] of Object.entries(tag.attrs))
    element.setAttribute(name, value);
  if (tag.text !== undefined) element.textContent = tag.text;
  return element;
}

/** Replaces the managed head elements with `tags`, leaving everything else alone */
function applyHeadTags(tags: HeadTag[]): void {
  const head = document.head;
  if (!head) return;

  const managed = new Set(tags.map((tag) => tag.key));
  for (const child of Array.from(head.children)) {
    const key = domKey(child);
    if (key && !managed.has(key)) child.remove();
  }

  for (const tag of tags) {
    const existing = findByKey(head, tag.key);
    if (tag.onlyIfMissing && existing) continue;
    existing?.remove();
    head.append(toElement(tag));
  }
}

/** Picks the site config */
function resolveRuntimeSite(site?: SiteConfig): ResolvedSite {
  return site ? resolveSite(site) : injectedSite;
}

/**
 * Updates the document `<head>` for the current route.
 *
 * @param page Per-page metadata for the route being entered.
 * @param site Site defaults to merge under `page`. Defaults to the injected config.
 */
export function applySeo(page: PageMeta, site?: SiteConfig): void {
  if (typeof document === "undefined") return;

  const route = normalizeRoute(window.location.pathname);
  const resolvedSite = resolveRuntimeSite(site);
  const options: ResolvedOptions = {
    site: resolvedSite,
    pageMeta: { [route]: page },
    robotsEnabled: false,
    robots: {},
    sitemapEnabled: false,
    sitemap: {},
    validate: false,
  };

  applyHeadTags(renderHeadTags(resolvePage(route, options), resolvedSite));
}

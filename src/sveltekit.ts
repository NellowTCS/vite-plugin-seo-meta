/** SvelteKit adapter for vite-plugin-seo-meta
 *
 * Ref: https://svelte.dev/docs/kit/hooks#Handle
 */

import { resolvePage } from "./head/merge";
import { renderHeadTags } from "./head/render";
import { injectHeadTags } from "./html/transform";
import type { PageMeta, ResolvedSite } from "./types";
import { normalizeRoute } from "./url";

/** The bits of SvelteKit's RequestEvent we actually read rather than the entire thing */
export interface SeoRequestEvent {
  url: URL;
  route?: { id?: string | null } | null;
}

/** What SvelteKit hands to transformPageChunk */
export interface SeoPageChunk {
  html: string;
  done: boolean;
}

/**
 * Some SvelteKit versions want this sync, others are cool with a promise
 * wish it didn't depend but oh well.
 */
export type MaybePromise<T> = T | Promise<T>;

/** Forwarded to SvelteKit's resolve (ignores extra stuff) */
export interface SeoResolveOptions {
  transformPageChunk?: (
    input: SeoPageChunk,
  ) => MaybePromise<string | undefined>;
  [option: string]: unknown;
}

/** The bit of the handle input we care about */
export interface SeoHandleInput {
  event: SeoRequestEvent;
  // method syntax keeps this bivariant (aka. 2 variants), so SvelteKit's (better) types
  // still fit without pulling in @sveltejs/kit as a dependency (no thanks ew)
  resolve(event: unknown, options?: SeoResolveOptions): Promise<Response>;
}

/** Drop-in for SvelteKit's `Handle` */
export type SeoHandle = (input: SeoHandleInput) => Promise<Response>;

/** Options for seoHandle() */
export interface SeoHandleOptions {
  /** `site` from the virtual config module */
  site: ResolvedSite;
  /** `pages` from the same virtual gal */
  pages?: Record<string, PageMeta>;
  /**
   * Where SvelteKit mounts the app (its `paths.base`)
   * Defaults to the pathname of `site.url`, since that's usually where a
   * subpath deployment hides the base. Override if the two disagree tho
   */
  base?: string;
}

/** Makes a base path look like "/foo", or "" when there's nothing to strip */
function normalizeBase(base: string): string {
  if (!base) return "";
  const withSlash = base.startsWith("/") ? base : `/${base}`;
  return withSlash.replace(/\/+$/, "");
}

/** Guesses the base from site.url when the caller didn't bother (rude :P) */
function baseFromSite(site: ResolvedSite): string {
  try {
    return normalizeBase(new URL(site.url).pathname);
  } catch {
    return "";
  }
}

/** Strips the base so page keys stay base-relative, as nature intended lollll */
function stripBase(pathname: string, base: string): string {
  if (!base) return pathname;
  if (pathname === base) return "/";
  if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length);
  return pathname;
}

/** Finds a page key from the pathname, then tries the route id for dynamic routes etc. */
function routeForEvent(
  event: SeoRequestEvent,
  base: string,
  pages: Record<string, PageMeta>,
): string {
  const fromPath = normalizeRoute(stripBase(event.url.pathname, base));
  if (fromPath in pages) return fromPath;
  const routeId = event.route?.id;
  if (routeId) {
    const fromId = normalizeRoute(stripBase(routeId, base));
    if (fromId in pages) return fromId;
  }
  return fromPath;
}

/**
 * Makes the handle hook you slap into `src/hooks.server.ts`.
 *
 * @param options Resolved config, base path and whatever else you want to override
 */
export function seoHandle(options: SeoHandleOptions): SeoHandle {
  if (!options?.site) {
    throw new Error(
      "seoHandle() requires site: import { site, pages } from 'virtual:vite-plugin-seo-meta/config' and pass them in",
    );
  }
  const { site, pages = {} } = options;
  const base =
    options.base !== undefined
      ? normalizeBase(options.base)
      : baseFromSite(site);

  return async ({ event, resolve }) => {
    const route = routeForEvent(event, base, pages);
    let html = "";

    return resolve(event, {
      transformPageChunk({ html: chunk, done }) {
        html += chunk;
        if (!done) return ""; // SvelteKit concatenates these?! weird...
        if (!/<head[\s>]/i.test(html)) return html; // no head, nothing to inject into lol
        const page = resolvePage(route, { site, pageMeta: pages });
        return injectHeadTags(html, renderHeadTags(page, site));
      },
    });
  };
}

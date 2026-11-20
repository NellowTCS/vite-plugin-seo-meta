/**
 * Virtual module the plugin serves to the app
 *
 * `src/runtime.ts` seemingly imports the resolved site from here, so
 * the client helper does not need a global or a hand-passed config.
 * The plugin resolves the id and returns {@link renderConfigModule}'s output!!!
 * Neat.
 */
import type { ResolvedOptions } from "./types";

/** Public specifier the app (and the runtime helper) imports. */
export const VIRTUAL_CONFIG_ID = "virtual:vite-plugin-seo-meta/config";

/** Internal resolved id. The leading NUL keeps other plugins from touching it. */
export const RESOLVED_CONFIG_ID = `\0${VIRTUAL_CONFIG_ID}`;

/**
 * Same trick the JSON-LD renderer uses hehe
 */
function serialize(value: unknown): string {
  return JSON.stringify(value)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Builds the source of the virtual config module.
 *
 * @param config Resolved site and page metadata to expose to the app.
 */
export function renderConfigModule({
  site,
  pageMeta,
}: Pick<ResolvedOptions, "site" | "pageMeta">): string {
  return `export const site = ${serialize(site)};\nexport const pages = ${serialize(pageMeta)};\nexport default site;\n`;
}

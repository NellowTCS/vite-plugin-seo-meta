/** Coexistence: back off (yes, BACK OFF) from plugins that already generate the same files */

/**
 * Name fragments of plugins that write their own `sitemap.xml`
 * - `sitemap` alone covers most: vite-plugin-sitemap, vite-sitemap,
 *   vite-sitemap-gen, vite-sitemap-plugin, generate-sitemap, tanstack-router-sitemap,
 *   vite-plugin-sitemap-ts, vite-plugin-tanstack-sitemap, vite-plugin-sitemap-from-routes
 * - the rest name themselves something else entirely (welcome to the jungle)
 */
const SITEMAP_PROVIDERS = ["sitemap", "vite-plugin-seo-files", "vite-plugin-pwa"] as const;

/**
 * Name fragments of plugins that write their own `robots.txt`
 * - `robots` covers: vite-plugin-robots, vite-robots-txt, vite-plugin-robots-txt, vite-plugin-robots-ts
 * - `vite-plugin-sitemap` drops a robots.txt too when its RobotsTxt option is on
 */
// TODO: because vite-plugin-sitemap a sitemap provider, we should probs verify it writes 
// a robots.txt before removing it
const ROBOTS_PROVIDERS = ["robots", "vite-plugin-sitemap", "vite-plugin-seo-files"] as const;

/** Vite plugin objects only need a `name` for these checks */
interface NamedPlugin {
  name: string;
}

/**
 * Finds the first plugin that also emits a sitemap
 *
 * @returns the plugin name, or undefined when we are the only sitemapper
 */
export function findSitemapProvider(plugins: readonly NamedPlugin[]): string | undefined {
  return plugins
    .map((plugin) => plugin.name)
    .find((name) => SITEMAP_PROVIDERS.some((provider) => name.includes(provider)));
}

/**
 * Finds the first plugin that also emits a robots.txt
 *
 * @returns the plugin name, or undefined when we are the only one dropkicking robots
 */
export function findRobotsProvider(plugins: readonly NamedPlugin[]): string | undefined {
  return plugins
    .map((plugin) => plugin.name)
    .find((name) => ROBOTS_PROVIDERS.some((provider) => name.includes(provider)));
}

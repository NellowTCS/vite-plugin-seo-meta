import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { loadSeoConfig } from "./config/load";
import { mergeOptions, resolveOptions } from "./config/resolve";
import { findRobotsProvider, findSitemapProvider } from "./files/coexistence";
import { buildRobots, mergeRobots, noindexDisallow } from "./files/robots";
import { buildSitemap } from "./files/sitemap";
import { resolvePage } from "./head/merge";
import { renderHeadTags } from "./head/render";
import { injectHeadTags } from "./html/transform";
import { createLogger } from "./log";
import type { Logger } from "./log";
import { deriveRoutes } from "./routes/derive";
import type { ResolvedOptions, SeoPluginOptions } from "./types";
import { normalizeRoute, routeFromHtmlFile } from "./url";
import { runValidation } from "./validate";
import { RESOLVED_CONFIG_ID, VIRTUAL_CONFIG_ID, renderConfigModule } from "./virtual";

const PLUGIN_NAME = "vite-plugin-seo-meta";

async function readIfExists(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

/** True when the user asked for a generator, rather than the `auto` default */
function isExplicitlyEnabled(value: unknown): boolean {
  return value === true || (typeof value === "object" && value !== null);
}

/** The main plugin entry point */
export function seo(inline: SeoPluginOptions = {}): Plugin {
  let config: ResolvedConfig;
  let options: ResolvedOptions;
  let log: Logger;

  /** Writes the generated files */
  async function writeFiles(): Promise<void> {
    if (!options.sitemapEnabled && !options.robotsEnabled) return;
    const outDir = resolve(config.root, config.build.outDir);
    const routes = await deriveRoutes(outDir, Object.keys(options.pageMeta));
    const pages = routes.map((route) => resolvePage(route, options));

    if (options.sitemapEnabled) {
      const filename = options.sitemap.filename ?? "sitemap.xml";
      const xml = await buildSitemap(pages, options.sitemap);
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, filename), xml);
    }

      if (options.robotsEnabled) {
        const generated = buildRobots(
          options.site,
          options.robots,
          noindexDisallow(pages, options.robots.disallowNoindex),
        );
        const target = join(outDir, "robots.txt");
        const existing = options.robots.merge === false ? undefined : await readIfExists(target);
        await mkdir(outDir, { recursive: true });
        await writeFile(target, existing ? mergeRobots(existing, generated) : generated);
      }

  }

  return {
    name: PLUGIN_NAME,

    async configResolved(resolved) {
      config = resolved;
      log = createLogger(resolved.logger as any);

      const fileConfig = await loadSeoConfig(
        resolved.root,
        resolved.command,
        resolved.mode,
        inline.configFile,
      );
      options = resolveOptions(fileConfig, inline);
      const merged = mergeOptions(fileConfig, inline);

      const sitemapProvider = findSitemapProvider(resolved.plugins);
      if (sitemapProvider && !isExplicitlyEnabled(merged.sitemap)) {
        log.warn(`deferring sitemap.xml to ${sitemapProvider} (pass sitemap: true to override)`);
        options.sitemapEnabled = false;
      }
      const robotsProvider = findRobotsProvider(resolved.plugins);
      if (robotsProvider && !isExplicitlyEnabled(merged.robots)) {
        log.warn(`deferring robots.txt to ${robotsProvider} (pass robots: true to override)`);
        options.robotsEnabled = false;
      }

      runValidation(options, log);
    },

    resolveId(id) {
      if (id === VIRTUAL_CONFIG_ID) return RESOLVED_CONFIG_ID;
      return undefined;
    },

    load(id) {
      if (id === RESOLVED_CONFIG_ID) return renderConfigModule(options.site);
      return undefined;
    },

    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const route =
          config.command === "build" && ctx.filename
            ? routeFromHtmlFile(ctx.filename, config.root)
            : normalizeRoute(ctx.path);
        const page = resolvePage(route, options);
        return injectHeadTags(html, renderHeadTags(page, options.site));
      },
    },

    async closeBundle() {
      if (config.command !== "build") return;
      await writeFiles();
    },
  };
}

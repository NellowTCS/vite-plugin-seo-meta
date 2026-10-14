import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadConfigFromFile } from "vite";
import type { ConfigEnv } from "vite";
import type { SeoOptions } from "../types.js";

/** Config filenames probed, in priority order, when no explicit path is given. */
export const SEO_CONFIG_FILES = [
  "seo.config.ts",
  "seo.config.mts",
  "seo.config.js",
  "seo.config.mjs",
  "seo.config.cts",
  "seo.config.cjs",
] as const;

/**
 * Loads a `seo.config.ts` style file with Vite's own config loader (smart right?)
 *
 * @param root Project root for resolving the config file.
 * @param command Vite command, forwarded to the loader and to a config factory.
 * @param mode Vite mode, forwarded to the loader and to a config factory.
 * @param explicit Path relative to `root`, or `false` to skip loading.
 * 
 * @returns The parsed config, or `undefined` if the file is not found.
 */
export async function loadSeoConfig(
  root: string,
  command: ConfigEnv["command"],
  mode: string,
  explicit?: string | false,
): Promise<SeoOptions | undefined> {
  if (explicit === false) return undefined;
  const configPath = explicit ? resolve(root, explicit) : findConfigFile(root);
  if (!configPath) return undefined;
  const loaded = await loadConfigFromFile({ command, mode }, configPath, root);
  if (!loaded) return undefined;
  return loaded.config as SeoOptions;
}

/** Returns the first existing config file under `root`... if there is one. */
function findConfigFile(root: string): string | undefined {
  for (const name of SEO_CONFIG_FILES) {
    const candidate = resolve(root, name);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

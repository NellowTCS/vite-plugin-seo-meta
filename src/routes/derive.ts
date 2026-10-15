import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { normalizeRoute, routeFromHtmlFile } from "../url";

/** Recursively lists every `.html` file under `dir`, or an empty list when it is missing */
export async function collectHtmlFiles(dir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(dir, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.toLowerCase().endsWith(".html"))
    .map((entry) => join(dir, entry));
}

/** Maps HTML entry files to normalized routes relative to `root` */
export function routesFromHtmlFiles(files: string[], root: string): string[] {
  return files.map((file) => routeFromHtmlFile(file, root));
}

/** Orders `/` first, then alphabetically */
function compareRoutes(a: string, b: string): number {
  if (a === b) return 0;
  if (a === "/") return -1;
  if (b === "/") return 1;
  return a.localeCompare(b);
}

/** Merges route lists, normalizing and deduping */
export function mergeRoutes(...sources: string[][]): string[] {
  const routes = new Set<string>();
  for (const source of sources) {
    for (const route of source) routes.add(normalizeRoute(route));
  }
  return [...routes].sort(compareRoutes);
}

/**
 * Le full route list from built HTML plus declared page keys
 *
 * @param outDir Build output directory holding the emitted HTML.
 * @param declared Routes declared in `pages`, including ones with no HTML of their own.
 */
export async function deriveRoutes(outDir: string, declared: string[] = []): Promise<string[]> {
  const files = await collectHtmlFiles(outDir);
  return mergeRoutes(routesFromHtmlFiles(files, outDir), declared);
}

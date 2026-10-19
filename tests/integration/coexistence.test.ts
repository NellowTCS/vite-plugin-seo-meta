import { existsSync } from "node:fs";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Logger, Plugin, PluginOption } from "vite";
import { build } from "vite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { seo } from "../../src/index";
import type { SeoPluginOptions } from "../../src/types";

const FIXTURE = fileURLToPath(new URL("../fixtures/mpa", import.meta.url));

/** Vite logger that records warnings so we can assert on the plugin's advice */
function captureLogger(): { logger: Logger; warnings: string[] } {
  const warnings: string[] = [];
  const logger: Logger = {
    info: () => {},
    warn: (message: string) => {
      warnings.push(message);
    },
    warnOnce: (message: string) => {
      warnings.push(message);
    },
    error: (message: string) => {
      warnings.push(message);
    },
    clearScreen: () => {},
    hasWarned: false,
    hasErrorLogged: false,
  } as any;
  return { logger, warnings };
}

async function buildWith(
  workspace: string,
  plugins: PluginOption[],
): Promise<{ warnings: string[] }> {
  const { logger, warnings } = captureLogger();
  await build({
    root: workspace,
    configFile: false,
    logLevel: "info",
    customLogger: logger,
    plugins,
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: { input: join(workspace, "index.html") },
    },
  });
  return { warnings };
}

const otherGenerator: Plugin = { name: "vite-plugin-sitemap" };

const options: SeoPluginOptions = {
  configFile: false,
  site: { url: "https://example.com", name: "Acme", title: "Acme" },
};

describe("coexistence with another generator", () => {
  let workspace: string;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), "seo-coexist-"));
    await cp(FIXTURE, workspace, { recursive: true });
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it("defers sitemap.xml and robots.txt to the other plugin", async () => {
    const { warnings } = await buildWith(workspace, [
      otherGenerator,
      seo(options),
    ]);

    expect(existsSync(join(workspace, "dist", "sitemap.xml"))).toBe(false);
    expect(existsSync(join(workspace, "dist", "robots.txt"))).toBe(false);
    expect(
      warnings.some((message) => message.includes("deferring sitemap.xml")),
    ).toBe(true);
    expect(
      warnings.some((message) => message.includes("deferring robots.txt")),
    ).toBe(true);
  });

  it("writes the files when explicitly enabled", async () => {
    await buildWith(workspace, [
      otherGenerator,
      seo({ ...options, sitemap: true, robots: true }),
    ]);

    expect(existsSync(join(workspace, "dist", "sitemap.xml"))).toBe(true);
    expect(existsSync(join(workspace, "dist", "robots.txt"))).toBe(true);
  });
});

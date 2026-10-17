import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seo } from "../../src/index";
import { countOccurrences } from "../helpers/html";

const FIXTURE = fileURLToPath(new URL("../fixtures/mpa", import.meta.url));

describe("repeated builds", () => {
  let workspace: string;
  let dist: string;

  beforeAll(async () => {
    workspace = await mkdtemp(join(tmpdir(), "seo-idempotent-"));
    await cp(FIXTURE, workspace, { recursive: true });
    dist = join(workspace, "dist");
  }, 30000);

  afterAll(async () => {
    if (workspace) await rm(workspace, { recursive: true, force: true });
  });

  async function runBuild(emptyOutDir: boolean): Promise<string> {
    await build({
      root: workspace,
      configFile: false,
      logLevel: "silent",
      plugins: [
        seo({
          configFile: false,
          site: {
            url: "https://example.com",
            name: "Acme",
            title: "Acme",
            titleTemplate: "%s | Acme",
          },
          pages: {
            "/": {
              title: "Home",
              lang: "en-US",
              alternates: [
                { hreflang: "fr-FR", href: "/fr" },
                { hreflang: "de", href: "/de" },
              ],
            },
          },
        }),
      ],
      build: {
        outDir: "dist",
        emptyOutDir,
        rollupOptions: { input: join(workspace, "index.html") },
      },
    });
    return readFile(join(dist, "index.html"), "utf8");
  }

  it("does not duplicate tags across builds", async () => {
    const first = await runBuild(true);
    const second = await runBuild(false);

    for (const html of [first, second]) {
      expect(countOccurrences(html, "<title")).toBe(1);
      expect(countOccurrences(html, 'rel="canonical"')).toBe(1);
      expect(countOccurrences(html, 'property="og:title"')).toBe(1);
      expect(countOccurrences(html, 'rel="alternate"')).toBe(3);
      expect(countOccurrences(html, 'property="og:locale:alternate"')).toBe(2);
    }

    expect(second).toBe(first);
  }, 30000);
});

import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seo } from "../../src/index";
import { countOccurrences } from "../helpers/html";

const FIXTURE = fileURLToPath(new URL("../fixtures/mpa", import.meta.url));
const ENTRIES = ["index.html", "about.html", "blog/post.html"];

describe("mpa build", () => {
  let workspace: string;
  let dist: string;

  const read = (file: string): Promise<string> => readFile(join(dist, file), "utf8");

  beforeAll(async () => {
    workspace = await mkdtemp(join(tmpdir(), "seo-mpa-"));
    await cp(FIXTURE, workspace, { recursive: true });
    dist = join(workspace, "dist");

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
            description: "The Acme multi-page fixture.",
          },
          pages: {
            "/": { title: "Home", priority: 1 },
            "/about": { title: "About" },
            "/blog/post": { title: "Hello" },
            "/private": { noindex: true },
          },
        }),
      ],
      build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: { input: ENTRIES.map((entry) => join(workspace, entry)) },
      },
    });
  }, 30000);

  afterAll(async () => {
    if (workspace) await rm(workspace, { recursive: true, force: true });
  });

  it("injects per-page metadata for every entry", async () => {
    const home = await read("index.html");
    const about = await read("about.html");
    const post = await read("blog/post.html");

    expect(home).toContain("<title>Home | Acme</title>");
    expect(about).toContain("<title>About | Acme</title>");
    expect(post).toContain("<title>Hello | Acme</title>");
  });

  it("replaces the stale title instead of appending", async () => {
    const home = await read("index.html");
    expect(home).not.toContain("stale title");
    expect(countOccurrences(home, "<title")).toBe(1);
  });

  it("adds canonical, open graph and description tags", async () => {
    const home = await read("index.html");

    expect(home).toContain('rel="canonical"');
    expect(home).toContain('href="https://example.com/"');
    expect(home).toContain('property="og:title"');
    expect(home).toContain('content="Home | Acme"');
    expect(home).toContain('property="og:url"');
    expect(home).toContain('name="description"');
  });

  it("writes a sitemap listing every indexable route", async () => {
    const sitemap = await read("sitemap.xml");

    expect(sitemap).toContain("<loc>https://example.com/</loc>");
    expect(sitemap).toContain("<loc>https://example.com/about</loc>");
    expect(sitemap).toContain("<loc>https://example.com/blog/post</loc>");
    expect(sitemap).not.toContain("/private");
  });

  it("writes robots that advertise the sitemap and skip noindex pages", async () => {
    const robots = await read("robots.txt");

    expect(robots).toContain("User-agent: *");
    expect(robots).not.toContain("Disallow: /private");
    expect(robots).toContain("Sitemap: https://example.com/sitemap.xml");
  });

  it("disallows noindex paths when explicitly requested", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "seo-mpa-robots-"));
    const distDir = join(workspace, "dist");
    try {
      await cp(FIXTURE, workspace, { recursive: true });
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
            robots: { disallowNoindex: true },
            pages: {
              "/": { title: "Home" },
              "/private": { noindex: true },
            },
          }),
        ],
        build: {
          outDir: "dist",
          emptyOutDir: true,
          rollupOptions: { input: ENTRIES.map((entry) => join(workspace, entry)) },
        },
      });
      const robots = await readFile(join(distDir, "robots.txt"), "utf8");
      expect(robots).toContain("Disallow: /private");
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
});

import { describe, expect, it } from "vitest";
import { resolveOptions } from "../../../src/config/resolve";
import {
  seoHandle,
  type SeoHandleInput,
  type SeoPageChunk,
  type SeoRequestEvent,
} from "../../../src/sveltekit";
import type { PageMeta, ResolvedOptions } from "../../../src/types";
import { countOccurrences } from "../../helpers/html";

type Config = Pick<ResolvedOptions, "site" | "pageMeta">;

const PAGE_HTML =
  "<!doctype html><html><head><title>old</title></head><body>hi</body></html>";

function makeConfig(
  pages: Record<string, PageMeta> = {},
  url = "https://example.com",
): Config {
  const resolved = resolveOptions({ site: { url }, pages }, {});
  return { site: resolved.site, pageMeta: resolved.pageMeta };
}

async function renderWith(
  config: Config,
  event: SeoRequestEvent,
  options: { base?: string; chunks?: string[] } = {},
): Promise<string> {
  const handle = seoHandle({
    site: config.site,
    pages: config.pageMeta,
    base: options.base,
  });
  const chunks = options.chunks ?? [PAGE_HTML];
  let output = "";

  const input: SeoHandleInput = {
    event,
    resolve(_event, resolveOptions) {
      for (const [index, chunk] of chunks.entries()) {
        const transformed = resolveOptions?.transformPageChunk?.({
          html: chunk,
          done: index === chunks.length - 1,
        });
        output += typeof transformed === "string" ? transformed : chunk;
      }
      return Promise.resolve(new Response(output));
    },
  };

  const response = await handle(input);
  expect(response.status).toBe(200);
  return output;
}

describe("seoHandle", () => {
  it("injects head tags into the rendered page", async () => {
    const output = await renderWith(makeConfig({ "/": { title: "Home" } }), {
      url: new URL("https://example.com/"),
    });

    expect(output).toContain("<title>Home</title>");
    expect(output).toContain(
      '<link rel="canonical" href="https://example.com/">',
    );
    expect(output).not.toContain("<title>old</title>");
  });

  it("uses the metadata for the matching route", async () => {
    const config = makeConfig({
      "/": { title: "Home" },
      "/about": { title: "About" },
    });
    const output = await renderWith(config, {
      url: new URL("https://example.com/about"),
    });

    expect(output).toContain("<title>About</title>");
  });

  it("strips the deployment base before matching page keys", async () => {
    const config = makeConfig(
      { "/about": { title: "About" } },
      "https://example.com/base",
    );
    const output = await renderWith(config, {
      url: new URL("https://example.com/base/about"),
    });

    expect(output).toContain("<title>About</title>");
    expect(output).toContain(
      '<link rel="canonical" href="https://example.com/base/about">',
    );
  });

  it("accepts an explicit base that overrides site.url", async () => {
    const config = makeConfig({ "/about": { title: "About" } });
    const output = await renderWith(
      config,
      { url: new URL("https://example.com/app/about") },
      { base: "/app" },
    );

    expect(output).toContain("<title>About</title>");
  });

  it("falls back to the route id for dynamic routes", async () => {
    const config = makeConfig(
      { "/blog/[slug]": { title: "Blog post" } },
      "https://example.com/base",
    );
    const output = await renderWith(
      config,
      {
        url: new URL("https://example.com/base/blog/hello"),
        route: { id: "/blog/[slug]" },
      },
      { base: "/base" },
    );

    expect(output).toContain("<title>Blog post</title>");
  });

  it("buffers chunks and injects only once", async () => {
    const chunks = [
      "<!doctype html><html><head>",
      "<title>old</title>",
      "</head><body></body></html>",
    ];
    const output = await renderWith(
      makeConfig({ "/": { title: "Home" } }),
      { url: new URL("https://example.com/") },
      { chunks },
    );

    expect(countOccurrences(output, "<title")).toBe(1);
    expect(output).toContain("<title>Home</title>");
  });

  it("leaves non-HTML output untouched", async () => {
    const output = await renderWith(
      makeConfig(),
      { url: new URL("https://example.com/api") },
      { chunks: ['{"ok":true}'] },
    );

    expect(output).toBe('{"ok":true}');
  });

  it("is assignable to a SvelteKit-shaped Handle", () => {
    interface RichRequestEvent extends SeoRequestEvent {
      request: Request;
      params: Record<string, string>;
    }
    type PreloadType = "data" | "code";
    type SvelteResolve = (
      event: RichRequestEvent,
      opts?: {
        transformPageChunk?: (input: SeoPageChunk) => string | undefined;
        preload?: (input: { path: string; type: PreloadType }) => boolean;
      },
    ) => Promise<Response>;
    type SvelteHandle = (input: {
      event: RichRequestEvent;
      resolve: SvelteResolve;
    }) => Promise<Response>;

    const config = makeConfig();
    const hook: SvelteHandle = seoHandle({
      site: config.site,
      pages: config.pageMeta,
    });
    expect(hook).toBeTypeOf("function");
  });
});

---
type: concept
title: SvelteKit
description: "Inject SEO head tags in SvelteKit with a server handle hook."
source: "https://nellowtcs.me/vite-plugin-seo-meta/guide/sveltekit/"
path: /guide/sveltekit/
updated: 2026-11-20
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-11-20T10:00:51.798Z"
---
---
title: "SvelteKit"
description: "Inject SEO head tags in SvelteKit with a server handle hook."
---

SvelteKit makes its own HTML, so Vite's `transformIndexHtml` never fires and the main plugin just sits there doing nothing. It even warns you about the unsupported hook, which is rude but fair. Use the `vite-plugin-seo-meta/sveltekit` subpackage for this purpose, which injects through SvelteKit's own `transformPageChunk`. Basically the same tags, but with a different entry.

## Setup

Keep `seo()` in your Vite config. It still does config resolution, validation, robots.txt and sitemap.xml. The handle hook only takes over head injection.

```ts
// vite.config.ts
import { sveltekit } from "@sveltejs/kit/vite";
import { seo } from "vite-plugin-seo-meta";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [seo(), sveltekit()],
});
```

Then add the hook. Import `site` and `pages` from the plugin's virtual config module and pass them to `seoHandle()`:

```ts
// src/hooks.server.ts
import { site, pages } from "virtual:vite-plugin-seo-meta/config";
import { seoHandle } from "vite-plugin-seo-meta/sveltekit";

export const handle = seoHandle({ site, pages });
```

That's it!!!!!! Dev SSR and prerendered builds both go through this hook so it's an all-in-one solution :D. Already got a handle hook of your own (niceee I like you if so)? Compose them with SvelteKit's `sequence`:

```ts
import { sequence } from "@sveltejs/kit/hooks";

export const handle = sequence(seoHandle({ site, pages }), myOtherHandle);
```

## Base paths

The hook strips the deployment base from `event.url.pathname` before matching a page key, so `/docs/about` still finds `pages["/about"]`. The base defaults to the pathname of `site.url`, since that's usually where a subpath deployment hides it. If SvelteKit's `paths.base` disagrees, say so:

```ts
export const handle = seoHandle({ site, pages, base: "/docs" });
```

## Dynamic routes

Page keys match the concrete pathname first. Nothing matched? The hook then tries SvelteKit's `event.route.id`, so one entry can cover a whole dynamic route (blog posts and the like yk):

```ts
// seo.config.ts
export default defineSeoConfig({
  site: { url: "https://example.com" },
  pages: {
    "/blog/[slug]": { title: "Blog post" },
  },
});
```

## Robots.txt and sitemap.xml

These still come from the plugin's `closeBundle` hook, with URLs built from `site.url`, so they already know about the base. Routes come from built HTML plus the keys in `pages`, so SSR-only routes need an explicit `pages` entry if you want them in the sitemap, which I thought was fair:

```ts
pages: {
  "/blog/[slug]": { title: "Blog post" },
  "/dashboard": { title: "Dashboard" },
},
```

## Notes

- The hook buffers the page until SvelteKit marks the last chunk done, then injects once. That trades streaming for correct, non-duplicated tags. Worth it in my opinion, but if you disagree, open an issue and we can discuss it! :D
- Non-HTML responses are left alone

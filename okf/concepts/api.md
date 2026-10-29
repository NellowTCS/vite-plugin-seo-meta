---
type: api
title: API
description: "Public exports: seo(), defineSeoConfig() and the runtime helper."
source: "https://nellowtcs.me/vite-plugin-seo-meta/api/"
path: /api/
updated: 2026-10-29
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-10-29T05:32:34.151Z"
---
---
title: "API"
description: "Public exports: seo(), defineSeoConfig() and the runtime helper."
---

## `seo(options?)`

The Vite plugin. Returns a Vite `Plugin` (gasp, i know, how shocking).

```ts
import { seo } from "vite-plugin-seo-meta";

export default defineConfig({
  plugins: [seo({ site: { url: "https://example.com", name: "My Site" } })],
});
```

### Options

| Option       | Type                                         | Default           | Notes                                                  |
| ------------ | -------------------------------------------- | ----------------- | ------------------------------------------------------ |
| `site`       | `SiteConfig`                                 | -                 | Site defaults                                          |
| `pages`      | `Record<string, PageMeta>`                   | `{}`              | Per-page overrides                                     |
| `robots`     | `"auto"` \| `boolean` \| `RobotsFileOptions` | `"auto"`          | `false` disables generation                            |
| `sitemap`    | `"auto"` \| `boolean` \| `SitemapOptions`    | `"auto"`          | `false` disables generation                            |
| `validate`   | `"warn"` \| `"error"` \| `false`             | `"warn"`          | Validation policy                                      |
| `configFile` | `string` \| `false`                          | `"seo.config.ts"` | Path to config file, or `false` to skip auto-detection |

## `defineSeoConfig(config)`

A typed identity function that returns its argument unchanged. This only exists so that the config can be easily typechecked.

```ts
import { defineSeoConfig } from "vite-plugin-seo-meta";

export default defineSeoConfig({
  site: { url: "https://example.com", name: "My Site" },
  pages: { "/about": { title: "About" } },
});
```

The plugin auto-detects `seo.config.ts` in the project root and loads it. Set `configFile: false` to disable this.

## `applySeo(page, site?)`

Runtime helper for SPAs. Updates managed head elements after a route change.

```ts
import { applySeo } from "vite-plugin-seo-meta/runtime";

applySeo({ title: "New Page", description: "..." });
```

See [SPA Runtime](./spa-runtime.md). (No, no, not a spa, a Single-Page Application, though we _all_ would love that... probably.)

## Exported types

The plugin exports types for every config shape:

- `SeoPluginOptions` - options accepted by `seo()`
- `SeoOptions` - the full beeg config (site, pages, robots, sitemap, validate)
- `SiteConfig` - site defaults
- `PageMeta` - per-page overrides
- `OpenGraphInfo` - Open Graph values
- `TwitterInfo` - Twitter Card values
- `FaviconConfig` - favicon and platform icons
- `RobotsFileOptions` - robots.txt options
- `RobotsGroup` - an RFC 9309 agent group
- `SitemapOptions` - sitemap options
- `ImageRef` / `ImageInput` - image references, including `thumbnail` for video sitemaps
- `JsonLdConfig` - JSON-LD configuration
- `HreflangAlternate` - a hreflang entry
- `ThemeColorEntry` - a theme color meta tag
- `TwitterCardType` - `summary` \| `summary_large_image` \| `player` \| `app`
- `TwitterHandle` - a Twitter `@handle`
- `TwitterAppPlatform` - `iphone` \| `ipad` \| `googleplay`
- `TwitterPlayer` - player card iframe config
- `TwitterApps` - app card per-platform config
- `ArticleJsonLd` / `OrganizationJsonLd` / `WebSiteJsonLd` / `ProductJsonLd` / `JsonLdPerson` - JSON-LD shapes
- `OpenGraphArticle` / `OpenGraphBook` / `OpenGraphMusic` / `OpenGraphVideo` / `OpenGraphPayment` - Open Graph verticals
- `SitemapChangefreq` - changefreq enum
- `RobotsDirectives` - structured robots meta directives

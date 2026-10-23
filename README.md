# vite-plugin-seo-meta

All-in-one Vite plugin that generates SEO metadata for your app: `<title>`, meta tags, canonical, Open Graph, Twitter Cards, JSON-LD (Organization/WebSite/Article/Product/BreadcrumbList/ImageObject), hreflang alternates, `robots.txt` and `sitemap.xml`. Zero-config defaults, per-page overrides. Works for SPA/MPA/SSG/prerendered builds.

[![npm version](https://img.shields.io/npm/v/vite-plugin-seo-meta.svg)](https://www.npmjs.com/package/vite-plugin-seo-meta)
[![license](https://img.shields.io/npm/l/vite-plugin-seo-meta.svg)](LICENSE)

## Features

- Zero-config: sensible defaults from `site` config
- Per-page overrides via `pages` map
- Canonical, Open Graph (full ogp.me spec incl. structured image/video/audio, type-specific verticals and `payment.link`)
- Twitter Cards (summary/summary_large_image/player/app, image dims/alt, label/data pairs, `:site:id`/`:creator:id`)
- JSON-LD: Organization, WebSite, Article, Product, BreadcrumbList, ImageObject (+ `extra` escape hatch)
- hreflang alternates per page (with self-referencing alternate)
- `robots.txt` generation per RFC 9309 (groups, `Allow`/`Disallow` with `*`/`$` wildcards, `Crawl-delay`, `Clean-param`, `Host`, `Sitemap`), merged with existing `public/robots.txt`
- `sitemap.xml` generation with image/video/news namespaces and `xhtml:link` alternates; single-host enforcement and a URL cap
- Rich favicon and platform icons: `apple-touch-icon`, `apple-touch-icon-precomposed`, `mask-icon`, `apple-mobile-web-app-*`, `msapplication-*`
- Coexistence detection: warns and defers to `vite-plugin-sitemap`/`vite-plugin-pwa` etc when present (override with `sitemap: true`/`robots: true`)
- Pre-build validation: enums, required fields, absolute URLs, length budgets (title 60, description 50-160, Twitter 70/200); `warn` by default, `error` throws
- SPA runtime helper: `applySeo()` for client-side navigation (`import from "vite-plugin-seo-meta/runtime"`)
- Type-safe with `defineSeoConfig()` and full TypeScript types

## Installation

```bash
npm i -D vite-plugin-seo-meta
```

Peer dependency: `vite >= 5.0.0`.

## Quick start

### Inline in vite.config.ts

```ts
import { defineConfig } from "vite";
import { seo } from "vite-plugin-seo-meta";

export default defineConfig({
  plugins: [
    seo({
      site: {
        url: "https://example.com",
        name: "My Site",
        title: "My Site",
        titleTemplate: "%s | My Site",
        description: "My awesome site",
      },
    }),
  ],
});
```

### External seo.config.ts (auto-loaded)

Create `seo.config.ts`:

```ts
import { defineSeoConfig } from "vite-plugin-seo-meta";

export default defineSeoConfig({
  site: {
    url: "https://example.com",
    name: "My Site",
    title: "My Site",
    titleTemplate: "%s | My Site",
    description: "My awesome site",
  },
});
```

Then in `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import { seo } from "vite-plugin-seo-meta";

export default defineConfig({
  plugins: [seo()],
});
```

## Usage

### Per-page metadata

```ts
seo({
  site: { url: "https://example.com", name: "My Site" },
  pages: {
    "/": { title: "Home" },
    "/about": { title: "About", description: "About us" },
    "/private": { title: "Secret", noindex: true },
  },
});
```

Pages with `noindex: true` are excluded from `sitemap.xml`. By default they do **not** add `Disallow` to `robots.txt` (so crawlers can still see the `noindex` directive). If you want to block crawling explicitly, set `robots: { disallowNoindex: true }`.

### SPA runtime (client-side navigation)

For SPAs, build-time injection covers the initial HTML. After route changes, call `applySeo()`:

```ts
import { applySeo } from "vite-plugin-seo-meta/runtime";

function onRouteChange() {
  applySeo({ title: "New Page", description: "..." });
}
```

`applySeo(page, site?)` merges with the injected site config if `site` is omitted. It only updates managed head elements.

### JSON-LD

```ts
seo({
  site: {
    url: "https://example.com",
    jsonLd: { organization: true, website: true },
  },
  pages: {
    "/blog/post": {
      jsonLd: {
        article: { headline: "Post", type: "BlogPosting" },
        product: { name: "Widget", price: 10, priceCurrency: "USD" },
        extra: [{ "@type": "BreadcrumbList", itemListElement: [] }],
      },
    },
  },
});
```

### hreflang alternates

```ts
pages: {
  "/": {
    alternates: [
      { hreflang: "en", href: "https://example.com/" },
      { hreflang: "es", href: "https://example.com/es/" },
      { hreflang: "x-default", href: "https://example.com/" },
    ],
  },
}
```

### robots.txt

Options: `userAgent`, `disallow`, `allow`, `groups` (RFC 9309 groups, each with their own `userAgent`/`disallow`/`allow`/`crawlDelay`/`cleanParam`), `rules`, `host`, `crawlDelay`, `cleanParam`, `sitemap` (string|false), `merge` (default `true`), `disallowNoindex` (default `false`).

```ts
robots: {
  userAgent: "*",
  disallow: ["/api", "*.gif$"],
  allow: ["/public"],
  crawlDelay: 5,
  cleanParam: ["sessionid"],
  host: "example.com",
  disallowNoindex: true,
}
```

With `merge: true`, existing `public/robots.txt` is preserved and generated rules are appended (duplicates dropped).

### sitemap.xml

Options: `filename`, `exclude`, `defaultChangefreq`, `defaultPriority`, `siteUrl`, `maxUrls` (default 50000).

```ts
sitemap: { exclude: ["/admin"], maxUrls: 100_000 }
```

Image, video, and news namespaces are emitted automatically when a page has the matching `openGraph` data; `xhtml:link` alternates are emitted for pages with hreflang companions.

### Validation

`validate: "warn"` (default) logs issues; `"error"` throws and fails the build; `false` disables it. Checks include enums (`changefreq`, `twitter.card`), required fields, absolute URLs (canonical, `og:url`, `twitter:image`, `twitter:player`), length budgets (title 60, description 50-160, Twitter 70/200), duplicate titles/canonicals, and conflicting `noindex`/`sitemap` settings.

### Coexistence

If `vite-plugin-sitemap` or `vite-plugin-pwa` (or others in detection list) are present, this plugin warns and defers generating `sitemap.xml`/`robots.txt` unless explicitly enabled: `sitemap: true`, `robots: true`.

## API

See full TypeScript types in `src/types.ts`. Key exports:

- `seo(options?: SeoPluginOptions): Plugin`
- `defineSeoConfig(config: SeoOptions): SeoOptions`
- Runtime: `applySeo(page: PageMeta, site?: SiteConfig)`

## Demo

A config generator demo lives in [`Demo/`](Demo/). It demonstrates the plugin and emits paste-ready configs. Build with `cd Demo && npm i && npx vite build`.

## License

MIT

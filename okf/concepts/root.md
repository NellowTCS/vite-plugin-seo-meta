---
type: concept
title: vite-plugin-seo-meta
description: "All-in-one Vite plugin that generates meta tags, canonical, Open Graph, Twitter Cards, JSON-LD, hreflang, robots.txt and sitemap.xml for your app."
source: "https://nellowtcs.me/vite-plugin-seo-meta/"
path: /
updated: 2026-10-28
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-10-28T19:03:25.813Z"
---
---
title: "vite-plugin-seo-meta"
description: "All-in-one Vite plugin that generates meta tags, canonical, Open Graph, Twitter Cards, JSON-LD, hreflang, robots.txt and sitemap.xml for your app."
---

<!-- prettier-ignore-start -->

::: hero layout:split glow:true

<!-- markdownlint-disable-next-line MD025 -->
# vite-plugin-seo-meta

Serverless SEO for Vite. One plugin generates `<title>`, meta tags, canonical URLs, Open Graph, Twitter Cards, JSON-LD, hreflang, `robots.txt` and `sitemap.xml`. Zero-config defaults, per-page overrides. Works for SPA, MPA, SSG and prerendered builds.

::: tag "Vite"
::: tag "SEO"
::: tag "TypeScript"

::: button "Quick Start" ./getting-started/quickstart.md icon:play
<!-- markdownlint-disable-next-line MD034 -->
::: button "Live Demo" external:https://nellowtcs.me/vite-plugin-seo-meta/demo/ icon:monitor
<!-- markdownlint-disable-next-line MD034 -->
::: button "GitHub" external:https://github.com/NellowTCS/vite-plugin-seo-meta icon:github

== side

```ts
// vite.config.ts
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

::: /hero

<!-- prettier-ignore-end -->

## Why this plugin

Writing SEO by hand means repeating the same tags for every page, keeping them in sync when the site changes, and forgetting a field on the one page you forget at 3 AM, or deleting mysterious ones that keep your site up top on Google. So... this plugin generates them from a single config and per-page overrides, so the tags are always consistent.

It also handles the files that are très important:

- `robots.txt` follows [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309) and happens to support agent groups, `Allow`/`Disallow` wildcards and `Crawl-delay`
- `sitemap.xml` supports image, video and news namespaces with single-host enforcement and a URL capacity (extensible)
- Twitter Cards have the typical summary, player and app cards with `:site:id` and `:creator:id` variants
- Favicon and platform icons cover `apple-touch-icon`, `mask-icon`, mobile web app and `msapplication` tags

## What it does not do

This plugin does not generate social images or app icons (very **big** _Yet_). That is a future thing I plan to add hehe.

## Get started

- [Installation](./getting-started/installation.md)
- [Quick Start](./getting-started/quickstart.md)
- [Configuration](./getting-started/configuration.md)

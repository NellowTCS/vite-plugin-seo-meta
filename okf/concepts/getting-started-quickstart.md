---
type: concept
title: "Quick Start"
description: "Add SEO to a Vite app in two minutes."
source: "https://nellowtcs.me/vite-plugin-seo-meta/getting-started/quickstart/"
path: /getting-started/quickstart/
updated: 2026-10-29
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-10-29T01:50:22.412Z"
---
---
title: "Quick Start"
description: "Add SEO to a Vite app in two minutes."
---

Add the plugin to `vite.config.ts` and give it a `site` block.
Nicely enough, that's the minimum effort you have to do, as everything else gets sensible defaults.
Please _do_ fill out the rest though haha, it's worth it.

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

## Per-page overrides

Put a `seo.config.ts` next to `vite.config.ts` and the plugin loads it automatically, no questions asked.

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
  pages: {
    "/about": {
      title: "About Us",
      description: "Who we are and what we build.",
    },
    "/blog/hello-world": {
      title: "Hello, world",
      description: "My first post on this site.",
      noindex: true,
    },
  },
});
```

## How the puzzle assembles

- `site` holds the defaults every page inherits
- `pages` overrides specific routes. A page can set any field the site has, plus `noindex`, `canonical`, `alternates` and `robots`
- The plugin merges site defaults with the matching page, then outputs tags at build time

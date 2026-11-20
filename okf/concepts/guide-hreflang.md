---
type: concept
title: hreflang
description: "Tell search engines which language and region variant of a page to show."
source: "https://nellowtcs.me/vite-plugin-seo-meta/guide/hreflang/"
path: /guide/hreflang/
updated: 2026-11-20
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-11-20T09:37:15.440Z"
---
---
title: "hreflang"
description: "Tell search engines which language and region variant of a page to show."
---

hreflang alternates are emitted as `<link rel="alternate">` tags. They live in `pages[].alternates`.

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

![alt text](./assets/images/hreflang.png)

## What each field means

- `hreflang`: the language or region code. Use [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) for languages, or `en-US`, `es-MX` for language-region pairs. Region codes come from [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) which are the two-letter country codes
- `href`: the **absolute** URL of that variant
- `x-default`: a catch-all for searchers who do not match any listed language or region. Point it at your default page

## Rules

- Every `href` must be an absolute URL
- The page should list itself in its own alternates. If the page is the English variant, include `{ hreflang: "en", href: "https://example.com/" }`. When the page (or site) has a `lang`, the plugin adds this for you
- If page X lists page Y, page Y must list page X. The validator flags non-reciprocal pairs, because Google ignores annotations that do not point to each other
- Language codes must be assigned ISO 639-1 values (two letters) and region codes must be assigned ISO 3166-1 alpha-2 values (two letters). The validator flags three-letter languages like `zho`, unassigned codes like `zz` or `en-XX`, and numeric regions like `es-419`
- The plugin emits `xhtml:link` alternates in `sitemap.xml` for pages that have hreflang companions
- hreflang URLs must all resolve to the same host. The sitemap enforces this.

## Big "Don't Do This"

Listing a variant that does not exist. If you say `es` points to `https://example.com/es/` and that page is a 404, search engines will show the error to Spanish users. So, obviously, don't mess up your deployments.

## When to use it

- You have the same content in multiple languages
- You have the same content for different regions (`.com`, `.com.au`, `.ca`)
- You want to tell search engines which variant to show which user

If you do not have multiple languages, leave `alternates` out. The plugin does not add anything on its own (yet? maybe.)

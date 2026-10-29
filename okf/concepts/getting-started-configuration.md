---
type: concept
title: Configuration
description: "Every option the plugin accepts, with defaults."
source: "https://nellowtcs.me/vite-plugin-seo-meta/getting-started/configuration/"
path: /getting-started/configuration/
updated: 2026-10-29
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-10-29T05:32:34.152Z"
---
---
title: "Configuration"
description: "Every option the plugin accepts, with defaults."
---

Everything lives under a `site` chunk, but per-page overrides go in `pages`.
The plugin fills in defaults for anything you leave out.

## site

| Field           | Type   | Default      | Notes                                                               |
| --------------- | ------ | ------------ | ------------------------------------------------------------------- |
| `url`           | string | required     | Site URL, must be absolute. Used as the canonical base and `og:url` |
| `name`          | string | required     | Site name                                                           |
| `title`         | string | `name`       | Used when a page does not set its own                               |
| `titleTemplate` | string | `%s \| name` | `%s` is replaced with the page title                                |
| `description`   | string | required     | Page description fallback                                           |
| `locale`        | string | `en_US`      | `og:locale`                                                         |
| `author`        | string | -            | `author` meta tag                                                   |
| `image`         | string | -            | Default `og:image`                                                  |
| `twitter`       | object | -            | See [Twitter Cards](../guide/twitter.md)                            |
| `favicon`       | object | -            | See [Favicon & platform icons](../guide/meta-tags.md)               |
| `jsonLd`        | object | -            | See [JSON-LD](../guide/json-ld.md)                                  |

## pages

A map of route to page configurations, of which routes are matched against the built HTML filename.

```ts
pages: {
  "/": { title: "Home" },
  "/about": { title: "About", description: "About us" },
  "/blog/post-slug": { title: "Post", noindex: true },
}
```

### Per-page fields

| Field         | Type             | Notes                                        |
| ------------- | ---------------- | -------------------------------------------- |
| `title`       | string           | Overrides `site.title`                       |
| `description` | string           | Overrides `site.description`                 |
| `canonical`   | string           | Absolute URL. Defaults to `site.url + route` |
| `noindex`     | boolean          | Adds `noindex`. Excludes from sitemap        |
| `robots`      | string\|string[] | Merged into the robots meta tag              |
| `alternates`  | array            | See [hreflang](../guide/hreflang.md)         |
| `openGraph`   | object           | See [Open Graph](../guide/open-graph.md)     |
| `jsonLd`      | object           | See [JSON-LD](../guide/json-ld.md)           |
| `image`       | string           | Page-specific `og:image`                     |
| `twitter`     | object           | Page-specific Twitter overrides              |

## robots

`robots` can be `false` (skip generation), an array of rules, or a config object.

```ts
robots: {
  userAgent: "*",
  disallow: ["/api", "*.gif$"],
  allow: ["/public"],
  crawlDelay: 5,
  cleanParam: ["sessionid"],
  host: "example.com",
  sitemap: "https://example.com/sitemap.xml",
  disallowNoindex: true,
  groups: [
    { userAgent: "GoogleBot", disallow: ["/private"] },
  ],
}
```

- `merge` (default `true`): preserve existing `public/robots.txt`, append generated rules, drop duplicates
- `disallowNoindex` (default `false`): also emit `Disallow` for pages with `noindex: true`
- `groups`: following the [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309) agent groups, each with their own `userAgent`, `disallow`, `allow`, `crawlDelay`, `cleanParam`

## sitemap

```ts
sitemap: {
  exclude: ["/admin"],
  maxUrls: 100_000,
  defaultChangefreq: "weekly",
  defaultPriority: 0.8,
  siteUrl: "https://example.com",
}
```

- `maxUrls` (default `50000`): URL cap. Sitemaps split into multiple files past this
- Image, video and news namespaces are emitted automatically when a page has matching `openGraph` data
- `xhtml:link` alternates are emitted for pages with hreflang companions

## validation

| Value     | Behavior               |
| --------- | ---------------------- |
| `"warn"`  | Log issues (default)   |
| `"error"` | Throw, fails the build |
| `false`   | Disable                |

The plugin checks include enums (`changefreq`, `twitter.card`), required fields, absolute URLs, length budgets (title 60, description 50-160, Twitter 70/200), duplicate titles and canonicals, and conflicting `noindex`/`sitemap` settings, all typical stuff.

## Coexistence

If `vite-plugin-sitemap`, `vite-plugin-pwa` or other detected plugins are present, this plugin warns and bails on generating `sitemap.xml` and `robots.txt` unless you explicitly enable them: `sitemap: true`, `robots: true`.

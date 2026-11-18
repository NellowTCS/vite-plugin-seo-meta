---
type: concept
title: Validation
description: "Catch misconfigured SEO before it ships."
source: "https://nellowtcs.me/vite-plugin-seo-meta/guide/validation/"
path: /guide/validation/
updated: 2026-11-18
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-11-18T20:21:09.487Z"
---
---
title: "Validation"
description: "Catch misconfigured SEO before it ships."
---

The plugin validates config at build time. By default it logs issues and continues. Set `validate: "error"` to fail the build. I'd recommend doing this in CI, so you catch problems before they reach production!!!

```ts
seo({ validate: "error" });
```

## Modes

| Value     | Behavior               |
| --------- | ---------------------- |
| `"warn"`  | Log issues (default)   |
| `"error"` | Throw, fails the build |
| `false`   | Disable                |

## What it checks

### Enums

- `changefreq` must be one of `always`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`, `never`
- `twitter.card` must be one of `summary`, `summary_large_image`, `player`, `app`

### Required fields

- `site.url` must be set
- `site.name` and `site.description` are required when their page-level values are missing

### Absolute URLs

Canonicals, `og:url`, `twitter:image` and `twitter:player` URLs **must be absolute**. Relative URLs are resolved against `site.url` before validation, so this check runs on the resolved value.

### Length budgets

| Field                 | Limit             |
| --------------------- | ----------------- |
| `title`               | 60 characters     |
| `description`         | 50-160 characters |
| `twitter:title`       | 70 characters     |
| `twitter:description` | 200 characters    |
| `twitter:image:alt`   | 420 characters    |

### Duplicates

- Two pages with the same `title`
- Two pages with the same `canonical`

### Conflicts

- A page with `noindex: true` that is also in `sitemap.xml` (noindex pages are excluded from the sitemap by default, but this catches explicit overrides, juuuust in case)
- A page with `sitemap: false` that still has hreflang alternates

### hreflang

- Language subtags must be assigned ISO 639-1 codes. Three-letter codes like `zho` and unassigned codes like `zz` are flagged because Google ignores the unsupported part of the annotation.
- Region subtags must be assigned ISO 3166-1 alpha-2 codes. Numeric regions like `es-419` and unassigned codes like `en-XX` are flagged; use a real region such as `es-MX`.
- A page with alternates must include a self-referencing alternate. The plugin adds one from `lang`; when no `lang` is configured, or another alternate already uses that tag, add it manually.
- When one configured page links to another, the target must link back. Non-reciprocal pairs are flagged because Google ignores hreflang annotations that do not point to each other.

### robots.txt

- `robots.userAgent` values must be RFC 9309 product tokens: `*`, or letters, `_`, and `-`. Values with spaces, punctuation, or digits are flagged because they cannot match a crawler.
- `robots.crawlDelay` must be a non-negative number of seconds.

## How to fix

The validator reports the field, the route, and the problem. Fix the field and rebuild. It does not guess what you meant... because well... it shouldn't; the SEO checks here are strict. If you want to disable a check, set `validate: false` or remove the field entirely.

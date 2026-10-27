---
type: concept
title: Validation
description: "Catch misconfigured SEO before it ships."
source: "https://nellowtcs.me/vite-plugin-seo-meta/guide/validation/"
path: /guide/validation/
updated: 2026-10-27
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-10-27T06:48:08.076Z"
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

## How to fix

The validator reports the field, the route, and the problem. Fix the field and rebuild. It does not guess what you meant... because well... it shouldn't; the SEO checks here are strict. If you want to disable a check, set `validate: false` or remove the field entirely.

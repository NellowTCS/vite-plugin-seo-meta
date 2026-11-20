---
type: concept
title: sitemap.xml
description: "Generate sitemap.xml with image, video and news namespaces, plus URL caps."
source: "https://nellowtcs.me/vite-plugin-seo-meta/guide/sitemap/"
path: /guide/sitemap/
updated: 2026-11-20
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-11-20T09:37:15.442Z"
---
---
title: "sitemap.xml"
description: "Generate sitemap.xml with image, video and news namespaces, plus URL caps."
---

A sitemap is an XML file that lists all the pages on your site. It's extremely useful for search engines, as it's a easily parsible list of all your pages. It can also include images, videos and news articles.

The protocol is documented at [sitemaps.org](https://www.sitemaps.org/protocol.html). I tried to follow this as closely as possible, but if you notice any discrepancies, please open an issue or PR!!!

![alt text](./assets/images/Tracer_mvmzfk8e.png)

`sitemap.xml` is generated at build time from the `pages` map. It lists every route that is not `noindex` and not in `exclude`.

## Basic options

```ts
sitemap: {
  exclude: ["/admin", "/login"],
  maxUrls: 100_000,
  defaultChangefreq: "weekly",
  defaultPriority: 0.8,
  siteUrl: "https://example.com",
  maxBytes: 50 * 1024 * 1024,
  maxNews: 1_000,
  newsMaxAgeDays: 2,
}
```

- `exclude`: routes to leave out
- `maxUrls`: URLs per sitemap file. Default `50000`. Anything past that gets dropped
- `defaultChangefreq`: fallback for pages without one
- `defaultPriority`: fallback for pages without one. I clamp it to `0.0`-`1.0`, cause the protocol is picky
- `siteUrl`: origin used to enforce a single-host sitemap
- `maxBytes`: uncompressed size cap in bytes. Default 50 MiB. Go over and the build throws, cause a sitemap Google rejects is not much use
- `maxNews`: maximum `<news:news>` entries per file. Default `1000`
- `newsMaxAgeDays`: how old a news article can be. Default `2`; `0` turns the check off
- `now`: reference time for the freshness check. Defaults to build time; handy only if you want deterministic builds

## changefreq

Per-page or global and valid values: `always`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`, `never`.

```ts
pages: {
  "/blog/hello-world": { changefreq: "weekly", priority: 0.9 },
  "/": { changefreq: "daily", priority: 1.0 },
}
```

## Priority

The protocol says priorities live between `0.0` and `1.0`, so I clamp whatever you pass into that range and drop non-finite values. Pre-build validation also yells about out-of-range page priorities.

## maxUrls and file size

Past `maxUrls` URLs, extra pages are simply skipped. No automatic `sitemap-1.xml` splitting yet (sorry). The default of 50000 is the [sitemaps.org](https://www.sitemaps.org/protocol.html) recommendation. Most sites should never hit it. Raise it if you have a large site, but keep an eye on the file size: it has to stay under 50 MiB uncompressed. Go over and `buildSitemap()` throws!

## Image namespace

When a page has `openGraph.image` (or structured `images`), the sitemap entry gets `<image:image>`:

```xml
<url>
  <loc>https://example.com/blog/hello-world</loc>
  <lastmod>2024-06-20</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.9</priority>
  <image:image>
    <image:loc>https://example.com/post.png</image:loc>
  </image:image>
</url>
```

Only `<image:loc>` these days. Google dropped `image:caption`, `image:title`, `image:geo_location`, and `image:license` back in 2022. Up to 1,000 images per URL, which is more than enough for even the most trigger-happy image poster lollllll.

## Video namespace

When a page has `openGraph.videos`, the sitemap entry gets `<video:video>`:

```xml
<url>
  <loc>https://example.com/watch/trailer</loc>
  <video:video>
    <video:thumbnail_loc>https://example.com/thumb.png</video:thumbnail_loc>
    <video:title>Trailer</video:title>
    <video:description>Watch the trailer.</video:description>
    <video:content_loc>https://example.com/trailer.mp4</video:content_loc>
  </video:video>
</url>
```

A `thumbnail` is required for video entries! Pages without one are **automatically** skipped rather than emitting invalid XML.

`title` and `description` on the media entry win, then `alt`, then the page title. Both get chopped at Google's limits (100 and 2048 characters). Got a YouTube/Vimeo embed instead of an actual media file? Pass `playerLoc` and it'll emit `player_loc` instead of `content_loc`:

```ts
pages: {
  "/watch/trailer": {
    openGraph: {
      videos: [
        {
          src: "https://www.youtube.com/watch?v=abc",
          thumbnail: "https://img.youtube.com/vi/abc/hqdefault.jpg",
          playerLoc: "https://www.youtube.com/embed/abc",
          title: "Launch recap",
          description: "Highlights from the launch stream.",
        },
      ],
    },
  },
}
```

## News namespace

When a page sets `openGraph.article.publishedTime` and `openGraph.siteName`, the sitemap entry gets a `<news:news>` block. Google News wants a publication name, language, title, and publication date, so entries missing those get dropped. Articles older than two days get dropped too (Google's rule, not mine); tune it with `newsMaxAgeDays` if you must.

```xml
<url>
  <loc>https://example.com/blog/breaking</loc>
  <news:news>
    <news:publication>
      <news:name>My Site</news:name>
      <news:language>en</news:language>
    </news:publication>
    <news:publication_date>2024-06-20</news:publication_date>
    <news:title>Breaking</news:title>
  </news:news>
</url>
```

Only 1,000 news entries make it into a file.
However, the rest of the URLs still show up, just without the news block.

## xhtml:link alternates

Pages with hreflang alternates get `<xhtml:link>` entries in their sitemap URL, including the page's own alternate when one is missing. Google wants every variant to list itself, which sounds obvious but people keep forgetting (guilty).

```xml
<url>
  <loc>https://example.com/</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://example.com/"/>
  <xhtml:link rel="alternate" hreflang="es" href="https://example.com/es/"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/"/>
</url>
```

## Single-host enforcement

All sitemap URLs must share the same host as `site.url`. If a page canonical points elsewhere, the entry is skipped. This keeps the sitemap valid. Calling `buildSitemap()` directly without `siteUrl`? I fall back to the first absolute URL's origin, so cross-origin stragglers still get dropped. Open an issue/PR if you want to allow cross-host sitemaps.

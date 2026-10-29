---
type: concept
title: "Meta Tags"
description: "How the plugin emits title, description, canonical and robots meta tags."
source: "https://nellowtcs.me/vite-plugin-seo-meta/guide/meta-tags/"
path: /guide/meta-tags/
updated: 2026-10-29
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-10-29T01:50:22.413Z"
---
---
title: "Meta Tags"
description: "How the plugin emits title, description, canonical and robots meta tags."
---

The plugin emits standard meta tags (`<meta>` tags) for every page. You set the defaults in `site` and override per page in `pages`.

## title

The `<title>` comes from the page `title`, falling back to `site.title`. The `titleTemplate` wraps it.

You can pass a string or a function to `titleTemplate`. The string should contain `%s` where the page title should go. The function receives the page title and returns a string, for example:

```ts
site: {
  title: "My Site",
  titleTemplate: "%s | My Site",
},
pages: { "/about": { title: "About Us" } },
```

Renders as `<title>About Us | My Site</title>`.

Keep titles under 60 characters. The validator enforces this, and it's generally a good idea to follow it: titles that are too long may be truncated in search results... and that's bad.

## description

The `<meta name="description">` comes from the page `description`, falling back to `site.description`.

```ts
site: { description: "My awesome site" },
pages: { "/about": { description: "Who we are and what we build." } },
```

Keep descriptions between 50 and 160 characters. Also enforced.

## canonical

`<link rel="canonical">` points to the page URL. It defaults to `site.url + route`. Set it explicitly when the same content lives at multiple URLs.

```ts
pages: {
  "/product": { canonical: "https://example.com/products/widget" },
}
```

Canonicals must be absolute URLs. The validator checks this. Google's guidance on canonicals is [available here](https://developers.google.com/search/docs/crawling-indexing/canonicalization) and it's worth reading if you're ever unsure whether to set one!

## robots meta

**Per-page** `robots` adds a `<meta name="robots">` value. It does not touch `robots.txt`, which is generated separately.

The valid directives are documented in Google's [robots meta tag reference](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag). The plugin accepts all of them!

```ts
pages: { "/private": { robots: "noindex, nofollow" } }
```

`noindex: true` is shorthand for `robots: "noindex"`. It also (obviously)excludes the page from `sitemap.xml`.

## noindex and crawling

A page with `noindex: true` tells crawlers not to index it, but by default it does not add a `Disallow` rule to `robots.txt`. Crawlers can still reach the page to see the `noindex` directive. This is done because some crawlers (like Googlebot) still index pages... even if they're marked `noindex`, cause Google just do be like that sometimes.

To block crawling outright, set `disallowNoindex: true` on the `robots` config:

```ts
robots: {
  disallowNoindex: true;
}
```

## Favicon and platform icons (subject to change)

The `favicon` block emits link tags and meta tags for browsers and platforms:

```ts
site: {
  favicon: {
    icon: "/favicon.ico",
    appleTouchIcon: "/apple-touch-icon.png",
    appleTouchIconPrecomposed: "/apple-touch-icon-precomposed.png",
    manifest: "/manifest.json",
    maskIcon: "/mask-icon.svg",
    maskIconColor: "#000000",
    mobileWebApp: {
      title: "My App",
      capable: true,
      statusBarStyle: "black-translucent",
    },
    msapplication: {
      tileColor: "#ffffff",
      tileImage: "/tile.png",
      config: "/browserconfig.xml",
    },
  },
}
```

- `maskIconColor` defaults to `#000000`
- `mobileWebApp` covers `apple-mobile-web-app-title`, `apple-mobile-web-app-capable` and `apple-mobile-web-app-status-bar-style`
- `msapplication` covers `msapplication-TileColor`, `msapplication-TileImage` and `msapplication-config`

I plan to eventually fold this into the main seo block and automatically fill in the various fields and manifest and browserconfig files from the existing data, and also generate all icons from a single source image. For now, you have to provide all of these manually.

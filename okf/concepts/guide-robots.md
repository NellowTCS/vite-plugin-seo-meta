---
type: concept
title: robots.txt
description: "Generate robots.txt following RFC 9309 with agent groups, wildcards and crawl delays."
source: "https://nellowtcs.me/vite-plugin-seo-meta/guide/robots/"
path: /guide/robots/
updated: 2026-10-29
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-10-29T05:32:34.156Z"
---
---
title: "robots.txt"
description: "Generate robots.txt following RFC 9309 with agent groups, wildcards and crawl delays."
---

[RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html) defines the robots.txt standard. Originally made by Martijn Koster in 1994 [(the original spec)](https://www.robotstxt.org/orig.html), because robots kept crawling sites and causing a ruckus. (Seems mighty familiar to today's AI bots, doesn't it?) The standard has been (barely) updated over the years, and this plugin implements the latest version.

![image of RFC 9309](./assets/images/Tracer_mvn05nlb.png)

It's generated at build time. It can be disabled, replaced, or merged with an existing file.

## Basic rules

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
}
```

- `userAgent`: who the rules apply to. Default `*`
- `disallow`: paths to block. Supports `*` (match anything) and `$` (end of string)
- `allow`: paths to explicitly permit, overriding `disallow`
- `crawlDelay`: delay in seconds
- `cleanParam`: URL parameters to ignore when crawling
- `host`: the `Host:` record
- `sitemap`: URL to advertise, or `false` to omit. Defaults to `site.url + /sitemap.xml`
- `disallowNoindex`: also block pages with `noindex: true`

## Wildcards

`*` matches any sequence of characters. `$` matches the end of the URL.

```ts
disallow: ["/api", "*.gif$", "/private/*"];
```

- `/api` blocks `/api`, `/api/foo`, `/api/foo/bar` (basically anything under it)
- `*.gif$` blocks `/img/cat.gif` but not `/img/cat.png` (which... is obviously not a GIF)
- `/private/*` blocks everything under `/private` (also `/private/foo`, `/private/foo/bar`, etc.) but not `/private` itself. Use `/private` to block that too.

`allow` takes priority when a path matches both. So `allow: ["/public"]` lets crawlers through even if `disallow: ["/"]`.

## Agent groups

Different crawlers get different rules:

```ts
robots: {
  groups: [
    {
      userAgent: "GoogleBot",
      disallow: ["/private"],
      crawlDelay: 2,
    },
    {
      userAgent: "BingBot",
      allow: ["/"],
    },
  ],
}
```

Each group has its own `userAgent`, `disallow`, `allow`, `crawlDelay` and `cleanParam`. The default group (top-level fields) applies to `*`.

## Merge with an existing file

By default the plugin preserves `robots.txt` in the output directory and appends generated rules. Duplicates are dropped.

To overwrite instead, set `merge: false`:

```ts
robots: {
  merge: false;
}
```

## noindex and crawling

A page with `noindex: true` tells crawlers not to index it. By default it does not add a `Disallow` rule, so crawlers can still reach the page to see the directive.

To block crawling outright:

```ts
robots: {
  disallowNoindex: true;
}
```

## Raw lines

Append literal lines after the generated rules:

```ts
robots: {
  rules: [
    "User-agent: *",
    "Disallow: /",
  ],
}
```

Use this when the plugin does not cover something. The lines are emitted verbatim.

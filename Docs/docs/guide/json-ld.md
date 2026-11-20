---
title: "JSON-LD"
description: "Structured data for search engines: Organization, WebSite, Article and Product."
---

JSON-LD, also known as JSON Linked Data, is a way to provide structured data to search engines. It is a standard format for describing the content of a web page for better indexing and results.This plugin emits JSON-LD as `<script type="application/ld+json">` blocks. Enable the types you need in `site.jsonLd` and add per-page data in `pages[].jsonLd`.

![example JSON-LD](./assets/images/json-ld.png)

The format is pretty well standardized at [json-ld.org](https://json-ld.org/) and the vocabulary for what you can describe lives at [schema.org](https://schema.org/). The plugin models the common types from schema.org; anything not covered goes through `extra`! If you feel that any type is missing or should be added to the plugin, please open an issue or PR, I'd love to add it!

## Organization

```ts
site: {
  jsonLd: { organization: true },
}
```

This emits an `Organization` block with the site name and URL. Add a logo:

```ts
site: {
  name: "My Site",
  jsonLd: {
    organization: {
      name: "My Site",
      logo: "https://example.com/logo.png",
    },
  },
}
```

Heads up! This is site-wide config, so it goes on every page. Google recommends putting Organization markup on just the home page, but having it everywhere is still valid, just a bit redundant. If you really only want it once, use `extra` on that page instead (sigh if you're really that picky, alright, but I get it lol).

## WebSite

```ts
site: {
  jsonLd: { website: true },
}
```

Emits a `WebSite` block. Set `searchUrl` to add a search action:

```ts
site: {
  jsonLd: {
    website: {
      searchUrl: "https://example.com/search?q={search_term_string}",
    },
  },
}
```

That emits a `SearchAction` with an `EntryPoint` and `query-input`. The `{search_term_string}` bit is required; the validator flags a `searchUrl` without it, cause nothing could fill the query in otherwise.

Google removed the sitelinks search box feature on November 29, 2024. The markup is still valid schema.org and harmless, so I emit it, but it won't do a Google feature anymore sadly cause Google keeps killing things.

## Article

```ts
pages: {
  "/blog/hello-world": {
    jsonLd: {
      article: {
        headline: "Hello, world",
        type: "BlogPosting",
        author: { name: "Alice" },
        publisher: "Example Inc",
        datePublished: "2024-01-15",
        dateModified: "2024-06-20",
        description: "My first post on this site.",
        image: "https://example.com/post.png",
      },
    },
  },
}
```

Note: `author` can be a string or an object with `name`, `url` and `sameAs`. Set `"@type": "Organization"` on that object for a company author (it defaults to `Person`). `publisher` takes the same shapes but defaults to `Organization`; Google doesn't require it, so skip it if you don't have one.

`type` defaults to `Article`; set `BlogPosting`, `NewsArticle` or the others as needed. Dates are normalized to ISO 8601, so both `Date` objects and loose strings like `"Jan 1 2024"` come out (they queer? eyes emoji) as proper timestamps. Anything that doesn't parse gets dropped rather than emitted as garbage, and validation warns you about it. Google dropped the old hard 110-character headline limit, but the validator still nudges you past that point, cause long headlines get truncated on some devices.

## Product

```ts
pages: {
  "/products/widget": {
    jsonLd: {
      product: {
        name: "Widget",
        image: "https://example.com/widget.png",
        description: "A widget for doing things.",
        sku: "WIDGET-001",
        brand: "My Brand",
        price: 19.99,
        priceCurrency: "USD",
        availability: "InStock",
        ratingValue: 4.8,
        ratingCount: 127,
        reviewCount: 42,
      },
    },
  },
}
```

Everything is flat here; nothing to build. `price` can be a number or a string, and `0` is preserved. `availability` takes a short name like `InStock` or a full `https://schema.org/InStock` URL. Even `/InStock` works, as I (subjectively smartly) strip the leading slash.

Ratings need `ratingValue` plus at least one of `ratingCount` or `reviewCount` to be eligible for rich results. The validator warns if you leave both counts off.

## Extra

If the plugin does not cover a type you need, pass raw JSON-LD through `extra`:

```ts
jsonLd: {
  extra: [
    {
      "@type": "HowTo",
      name: "How to do the thing",
      step: [{ "@type": "HowToStep", text: "Do the thing" }],
    },
  ],
}
```

`extra` is emitted verbatim. It is what you would call an "escape hatch" for types the plugin does not model. `BreadcrumbList` and `ImageObject` aren't built in, so use `extra` for those. Whenever anything is configured, the plugin will prepend a `WebPage` node with the page's title, description, canonical and image. If nothing at all is configured, no script tag is emitted, obviously.

If you feel that any type is missing or should be added to the plugin, please open an issue or PR.

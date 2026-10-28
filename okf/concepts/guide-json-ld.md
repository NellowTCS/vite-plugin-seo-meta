---
type: concept
title: JSON-LD
description: "Structured data for search engines: Organization, WebSite, Article, Product, BreadcrumbList and ImageObject."
source: "https://nellowtcs.me/vite-plugin-seo-meta/guide/json-ld/"
path: /guide/json-ld/
updated: 2026-10-28
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-10-28T23:23:16.383Z"
---
---
title: "JSON-LD"
description: "Structured data for search engines: Organization, WebSite, Article, Product, BreadcrumbList and ImageObject."
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
  jsonLd: { organization: { logo: "https://example.com/logo.png" } },
}
```

## WebSite

```ts
site: {
  jsonLd: { website: true },
}
```

Emits a `WebSite` block. Set `site.searchAction` to add a search box to the result:

```ts
site: {
  jsonLd: {
    website: {
      searchAction: {
        target: "https://example.com/search?q={query}",
        queryInput: "required name=query",
      },
    },
  },
}
```

## Article

```ts
pages: {
  "/blog/hello-world": {
    jsonLd: {
      article: {
        headline: "Hello, world",
        type: "BlogPosting",
        author: { name: "Alice" },
        datePublished: "2024-01-15",
        dateModified: "2024-06-20",
        description: "My first post on this site.",
        image: "https://example.com/post.png",
      },
    },
  },
}
```

Note: `author` can be a single object or an array. `type` defaults to `Article`; set `BlogPosting`, `NewsArticle` or others as needed.

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
        mpn: "MPN-001",
        offers: {
          price: 19.99,
          priceCurrency: "USD",
          availability: "InStock",
          url: "https://example.com/products/widget",
        },
        review: {
          reviewRating: { ratingValue: 5, bestRating: 5 },
          author: { name: "Bob" },
          reviewBody: "Best widget I have owned.",
        },
      },
    },
  },
}
```

## BreadcrumbList

```ts
pages: {
  "/products/widget": {
    jsonLd: {
      breadcrumb: [
        { name: "Home", item: "https://example.com/" },
        { name: "Products", item: "https://example.com/products" },
        { name: "Widget", item: "https://example.com/products/widget" },
      ],
    },
  },
}
```

## ImageObject

```ts
pages: {
  "/gallery/photo-1": {
    jsonLd: {
      image: {
        url: "https://example.com/photo-1.jpg",
        description: "A photo of a thing",
        license: "https://creativecommons.org/licenses/by/4.0/",
        author: { name: "Alice" },
      },
    },
  },
}
```

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

`extra` is emitted verbatim. It is what you would call an "escape hatch" for types the plugin does not model. If you feel that any type is missing or should be added to the plugin, please open an issue or PR.

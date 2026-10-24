---
type: concept
title: "Twitter Cards"
description: "How the plugin emits twitter:* tags for summary, player and app cards."
source: "https://nellowtcs.me/vite-plugin-seo-meta/guide/twitter/"
path: /guide/twitter/
updated: 2026-10-24
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-10-24T23:16:35.746Z"
---
---
title: "Twitter Cards"
description: "How the plugin emits twitter:* tags for summary, player and app cards."
---

Twitter Cards control how a link looks on Twitter (i'm not calling it X). They live in the `twitter` block, which inherits from `site.twitter`.

```ts
site: {
  twitter: {
    site: "@Twitter",
    creator: "@Twitter",
  },
}
```

![example ](./assets/images/image.png)

> Side note: X decided to delete all their documentation, so I had to find them in the [Wayback Machine](https://web.archive.org/web/20221010220601/https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards), which was tedium.

## Card types

| Value                 | Use case                       |
| --------------------- | ------------------------------ |
| `summary`             | Small card with thumbnail      |
| `summary_large_image` | Large image card               |
| `player`              | Embedded video or audio player |
| `app`                 | Promote an app                 |

## Basic fields

```ts
twitter: {
  card: "summary_large_image",
  site: "@mysite",
  creator: "@alice",
  title: "Hello, world",
  description: "My first post on this site.",
  image: "https://example.com/card.png",
  imageAlt: "A screenshot of the post",
  imageWidth: 1200,
  imageHeight: 630,
}
```

- `site` and `creator` are `@handles`
- `imageAlt` is required when `image` is set. Max 420 characters
- `imageWidth` and `imageHeight` are the card image dimensions in pixels

## Numeric IDs

Instead of `@handles`, use numeric IDs:

```ts
twitter: {
  siteId: "1234567890",
  creatorId: "0987654321",
}
```

`siteId` replaces `site`. `creatorId` replaces `creator`. Use whichever you have.

## Label and data pairs

Summary cards can carry two label/value pairs:

```ts
twitter: {
  card: "summary",
  label1: "Price",
  data1: "$199",
  label2: "Stock",
  data2: "In stock",
}
```

## Player Card

For embedded video or audio:

```ts
twitter: {
  card: "player",
  player: {
    url: "https://example.com/player.html",
    width: 1280,
    height: 720,
    stream: "https://example.com/stream.mp4",
  },
}
```

- `url` is the HTTPS iframe URL.
- `width` and `height` are the iframe dimensions in pixels.
- `stream` is optional. It points to a raw video or audio stream.

## App Card

Promote an app. One entry per platform:

```ts
twitter: {
  card: "app",
  apps: {
    iphone: { name: "My App", id: "1234567890", url: "myapp://open" },
    ipad: { name: "My App", id: "1234567890", url: "myapp://open" },
    googleplay: { name: "My App", id: "com.example.myapp", url: "myapp://open" },
  },
  country: "US",
}
```

- `name` is the app name (who knew)
- `id` is the app store ID
- `url` is a custom URL scheme. It must include `://`. You also have to register the scheme in your app. See [Apple](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app) and [Google](https://developer.android.com/training/app-links/deep-linking) for details.
- `country` is the two-letter ISO country code for the App Store that holds the app.

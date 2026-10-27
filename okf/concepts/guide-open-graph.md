---
type: concept
title: "Open Graph"
description: "og:* tags for Facebook, LinkedIn and every platform that reads them."
source: "https://nellowtcs.me/vite-plugin-seo-meta/guide/open-graph/"
path: /guide/open-graph/
updated: 2026-10-27
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-10-27T06:48:08.073Z"
---
---
title: "Open Graph"
description: "og:* tags for Facebook, LinkedIn and every platform that reads them."
---

Open Graph, also known as `og:*` tags, is a universal standard for describing _how_ a page looks when shared on social media. It's used by Facebook, LinkedIn, Discord, Slack (oh hi Hack Club), and **many** other platforms. Suffice to say, they're important.

The spec exists at [ogp.me](https://ogp.me/).

> Side note: In my opinion, that's how spec pages should be in my opinion, as it's pretty easy to parse, not 20 pages and written in legalese lol.

They are emitted from the `openGraph` block, which inherits from `site` defaults.

## Basic tags

```ts
pages: {
  "/": {
    openGraph: {
      title: "My Site",
      description: "My awesome site",
      type: "website",
      url: "https://example.com",
      image: "https://example.com/og.png",
      siteName: "My Site",
      locale: "en_US",
    },
  },
}
```

- `type` defaults to `website`. Set `article` for blog posts, `book`, `profile`, `music.*`, `video.*` or others... based on what your page is about.
- `url` defaults to the page canonical
- `image` defaults to `site.image`

## Article type

```ts
openGraph: {
  type: "article",
  article: {
    publishedTime: "2024-01-15",
    modifiedTime: "2024-06-20",
    author: "https://example.com/authors/alice",
    section: "Technology",
    tag: ["typescript", "vite"],
  },
}
```

`author` can be a single URL or an array. `tag` is the same.

## Book type

<!-- Yeah that's a real book! -->

```ts
openGraph: {
  type: "book",
  book: {
    author: "https://example.com/authors/popper",
    isbn: "978-3-16-148410-0",
    releaseDate: "2019-02-01",
    tag: ["fiction"],
  },
}
```

## Profile type

```ts
openGraph: {
  type: "profile",
  profile: {
    firstName: "Karl",
    lastName: "Popper",
    username: "karlpopper",
    gender: "male",
  },
}
```

## Music types

`music.album`, `music.playlist` and `music.radio_station` share the same fields:

```ts
openGraph: {
  type: "music.album",
  music: {
    duration: 213,
    musician: ["https://example.com/artists/queen"],
    song: [{ url: "https://example.com/songs/we-will-rock-you", disc: 1, track: 1 }],
    releaseDate: "1977-10-21",
  },
}
```

`song` and `album` are arrays of `{ url, disc?, track? }`. `disc` and `track` default to 1.

## Video types

`video.movie`, `video.episode` and `video.series`:

```ts
openGraph: {
  type: "video.movie",
  video: {
    actor: [{ url: "https://example.com/people/tom-hanks", role: "Forrest Gump" }],
    director: ["https://example.com/people/robert-zemeckis"],
    duration: 142 * 60 + 24,
    releaseDate: "1994-06-23",
    series: "https://example.com/series/futurama",
  },
}
```

## Structured images, audio and video

Instead of a single `image` URL, pass structured entries with extra properties:

```ts
openGraph: {
  images: [
    { url: "https://example.com/og-1200x630.png", width: 1200, height: 630, alt: "Share this page" },
  ],
  audios: [{ url: "https://example.com/podcast.mp3" }],
  videos: [{ url: "https://example.com/trailer.mp4" }],
}
```

Structured images override the flat `image` field when present.

## payment.link

```ts
openGraph: {
  type: "payment.link",
  payment: {
    description: "One month subscription",
    currency: "USD",
    amount: 9.99,
    status: "PENDING",
    id: "sub_123",
    successUrl: "https://example.com/thanks",
  },
}
```

## determiner

```ts
openGraph: {
  determiner: "auto";
}
```

Valid values: `"auto"`, `"none"`, `"noun"`. A determiner is the word that comes before the title (noun), like "a," "an," or "the." By default, it's set to auto, which means the system decides whether or not to include it.

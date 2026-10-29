---
type: reference
title: "Config Reference"
description: "Every field the plugin accepts."
source: "https://nellowtcs.me/vite-plugin-seo-meta/reference/config/"
path: /reference/config/
updated: 2026-10-29
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-10-29T05:32:34.159Z"
---
---
title: "Config Reference"
description: "Every field the plugin accepts."
---

## `SeoPluginOptions`

```ts
{
  site?: SiteConfig;
  pages?: Record<string, PageMeta>;
  robots?: "auto" | boolean | RobotsFileOptions;
  sitemap?: "auto" | boolean | SitemapOptions;
  validate?: "warn" | "error" | false;
  configFile?: string | false;
}
```

## `SiteConfig`

```ts
{
  url: string;
  name?: string;
  title?: string;
  titleTemplate?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  twitter?: string | TwitterInfo;
  locale?: string;
  lang?: string;
  author?: string;
  keywords?: string | string[];
  robotsByUserAgent?: Record<string, string | RobotsDirectives>;
  favicon?: FaviconConfig;
  openGraph?: OpenGraphInfo;
  jsonLd?: JsonLdConfig;
}
```

`twitter` accepts a bare `@handle` as shorthand for `twitter:site`.

## `PageMeta`

```ts
{
  title?: string;
  description?: string;
  canonical?: string;
  lang?: string;
  image?: string;
  imageAlt?: string;
  keywords?: string | string[];
  author?: string;
  noindex?: boolean;
  robots?: string | RobotsDirectives;
  robotsByUserAgent?: Record<string, string | RobotsDirectives>;
  openGraph?: OpenGraphInfo;
  twitter?: TwitterInfo;
  jsonLd?: JsonLdConfig;
  alternates?: HreflangAlternate[];
  sitemap?: boolean;
  priority?: number;
  changefreq?: SitemapChangefreq;
  lastmod?: string | Date;
  meta?: Record<string, string>;
  links?: Array<{ rel: string; href: string } & Record<string, string>>;
}
```

## `FaviconConfig`

```ts
{
  icon?: string;
  appleTouchIcon?: string;
  appleTouchIconPrecomposed?: string;
  manifest?: string;
  maskIcon?: string;
  maskIconColor?: string;
  themeColor?: string | ThemeColorEntry[];
  mobileWebApp?: MobileWebAppConfig;
  msapplication?: MsTileConfig;
}
```

## `MobileWebAppConfig`

```ts
{
  title?: string;
  capable?: boolean;
  statusBarStyle?: "default" | "black" | "black-translucent" | "transparent";
}
```

## `MsTileConfig`

```ts
{
  tileColor?: string;
  tileImage?: string;
  config?: string;
}
```

## `RobotsFileOptions`

```ts
{
  userAgent?: string | string[];
  disallow?: string[];
  allow?: string[];
  groups?: RobotsGroup[];
  rules?: string[];
  sitemap?: string | false;
  merge?: boolean;
  disallowNoindex?: boolean;
  host?: string;
  crawlDelay?: number;
  cleanParam?: string | string[];
}
```

## `RobotsGroup`

```ts
{
  userAgent: string | string[];
  disallow?: string[];
  allow?: string[];
  crawlDelay?: number;
  cleanParam?: string | string[];
}
```

## `SitemapOptions`

```ts
{
  filename?: string;
  exclude?: string[];
  defaultChangefreq?: SitemapChangefreq;
  defaultPriority?: number;
  siteUrl?: string;
  maxUrls?: number;
}
```

## `SitemapChangefreq`

`"always"` | `"hourly"` | `"daily"` | `"weekly"` | `"monthly"` | `"yearly"` | `"never"`

## `ImageRef` / `ImageInput`

```ts
// ImageRef
{
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  type?: string;
  secureUrl?: string;
  thumbnail?: string;
}

// ImageInput: string | ImageRef | { src?, url?, href?, alt?, width?, height?, type?, secureUrl?, secure_url?, thumbnail? }
```

`thumbnail` is the video sitemap thumbnail URL. Required for video entries.

## `TwitterInfo`

```ts
{
  card?: TwitterCardType;
  title?: string;
  description?: string;
  site?: TwitterHandle;
  siteId?: string;
  creator?: TwitterHandle;
  creatorId?: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  label1?: string;
  data1?: string;
  label2?: string;
  data2?: string;
  player?: TwitterPlayer;
  apps?: TwitterApps;
}
```

## `TwitterPlayer`

```ts
{
  url: string;
  width: number;
  height: number;
  stream?: string;
}
```

## `TwitterApps`

```ts
{
  iphone?: TwitterAppEntry;
  ipad?: TwitterAppEntry;
  googleplay?: TwitterAppEntry;
  country?: string;
}
```

## `TwitterAppEntry`

```ts
{
  name?: string;
  id?: string;
  url?: string;
}
```

## `TwitterCardType`

`"summary"` | `"summary_large_image"` | `"player"` | `"app"`

## `JsonLdConfig`

```ts
{
  organization?: boolean | OrganizationJsonLd;
  website?: boolean | WebSiteJsonLd;
  article?: boolean | ArticleJsonLd;
  product?: boolean | ProductJsonLd;
  extra?: Record<string, unknown>[];
}
```

## `HreflangAlternate`

```ts
{
  hreflang: string;
  href: string;
}
```

## `RobotsDirectives`

```ts
{
  noindex?: boolean;
  nofollow?: boolean;
  none?: boolean;
  all?: boolean;
  nosnippet?: boolean;
  noarchive?: boolean;
  noimageindex?: boolean;
  notranslate?: boolean;
  indexifembedded?: boolean;
  nositelinkssearchbox?: boolean;
  maxSnippet?: number;
  maxImagePreview?: "none" | "standard" | "large";
  maxVideoPreview?: number;
  unavailableAfter?: string | Date;
}
```

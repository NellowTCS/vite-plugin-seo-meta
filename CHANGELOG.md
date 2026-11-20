# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- hreflang validation for non-ISO 639-1 languages and unassigned ISO 3166-1 alpha-2 regions
- hreflang reciprocity check across configured pages
- Warning when a page has alternates but no self-referencing alternate
- Script-only Open Graph locale derivation (`zh-Hant` -> `zh_TW`)
- robots.txt validation for RFC 9309 user-agent tokens and non-negative crawl delays
- ISO 639-1 and ISO 3166-1 alpha-2 registries for hreflang validation
- Sitemap byte cap, news freshness window and news-entry cap
- Sitemap video `title`, `description`, and `player_loc` support
- Self-referencing `xhtml:link` added to sitemap entries when the page language is configured
- Single-host fallback derived from the first absolute URL when `buildSitemap()` has no `siteUrl`
- Organization authors and publishers for Article JSON-LD via `"@type": "Organization"`
- `ratingCount` for Product `aggregateRating`
- JSON-LD tests for unparseable dates, missing rating counts, long headlines and `searchUrl` templates
- HTTPS validation for Twitter card images and player URLs as they require it to render properly
- Validation for robots meta directives in `robots` and `robotsByUserAgent`
- Warning when `indexifembedded` is set without `noindex`, or when `none` and `all` are both emitted as this is bad practice :P
- Warning for a missing `og:image`, unparseable Open Graph article dates or out-of-range music/video durations
- Validation for borked `og:locale` and `og:locale:alternate` values
- `maskIconColor` for Safari pinned tabs, with a `themeColor` as the fallbck
- `page.links` icon sets with different `type`, `media` or `sizes` values now get separate dedupe keys to fix a few bugs
- SvelteKit support through `vite-plugin-seo-meta/sveltekit`: which uses a `seoHandle()` hook that injects head tags via `transformPageChunk`, as SvelteKit never calls `transformIndexHtml`

### Changed

- Builder moved from `tsup` to `tsdown` (latter is maintained and just better)
- Demo field generator uses TypeScript 7's API now
- Documented `Crawl-delay`, `Clean-param`, and `Host` as legacy extensions outside RFC 9309
- Empty `Disallow`/`Allow` patterns render without a trailing space
- Merging keeps the first `Crawl-delay` value per robots.txt group
- Numeric regions like `es-419` no longer produce an invalid `og:locale`; the configured fallback locale is used instead
- Sitemap priorities are clamped to `0.0`-`1.0` and non-finite values are dropped
- Sitemap emits at most 1,000 images per URL and fails builds over the 50 MiB protocol limit (which... is a fair limit I guess :P)
- Deprecated `image:caption` and undocumented `news:keywords` are no longer emitted
- News entries without a publication name, title, or valid date are dropped instead of emitting invalid XML
- Article JSON-LD dates are normalized to ISO 8601; and unparseable values are dropped instead of emitting
- Make JSON-LD docs accurate
- Explicit Open Graph locales are normalized to `language_TERRITORY` before emission
- Corrected the documented `og:determiner` values
- `msapplication-config` emits the `<meta name>` form IE11 reads; `"none"` disables it instead of being absolutized
- Dropped the undocumented `transparent` status bar style (i swear this was a thing somewhere, but i can't find it now, what the huh past me, where did you see that? :P)
- Favicon docs now cover multi-size/multi-format icons through `page.links`

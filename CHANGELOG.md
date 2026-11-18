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

### Changed

- Documented `Crawl-delay`, `Clean-param`, and `Host` as legacy extensions outside RFC 9309
- Empty `Disallow`/`Allow` patterns render without a trailing space
- Merging keeps the first `Crawl-delay` value per robots.txt group
- Numeric regions like `es-419` no longer produce an invalid `og:locale`; the configured fallback locale is used instead
- Sitemap priorities are clamped to `0.0`-`1.0` and non-finite values are dropped
- Sitemap emits at most 1,000 images per URL and fails builds over the 50 MiB protocol limit (which... is a fair limit I guess :P)
- Deprecated `image:caption` and undocumented `news:keywords` are no longer emitted
- News entries without a publication name, title, or valid date are dropped instead of emitting invalid XML

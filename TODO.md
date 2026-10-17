# TODO

- [ ] Demo that is like a config generator that you can paste into your `vite.config.ts`/`.js`
- [ ] Docs via DocMD as always
- [x] `ImageRef` / `ImageInput` types + single `resolveImage()`
- [x] Full meta spec (theme-color media, application-name, robots extras + per-UA)
- [ ] Canonical + alternate link spec (incl. `x-default`, BCP47, share to OG locale-alternate + sitemap xhtml:link???)
- [ ] Full Open Graph spec (ogp.me): structured image/video/audio + type-specific incl. payment.link
- [ ] Full Twitter Card spec (summary/summary_large_image/player/app, image dims/alt, label1/data1/label2/data2 opt-in)
- [ ] Rich favicon + platform icons (mask-icon, msapplication, apple-*, apple-mobile-web-app-*)
- [ ] JSON-LD builders expanded (ImageObject, BreadcrumbList + Google-rich-result recommended sets and typed via schema-dts)
- [ ] robots.txt full directive set (RFC 9309 groups, wildcards `$`, Sitemap/Host/Crawl-delay/Clean-param; no Disallow on noindex)
- [ ] sitemap.xml image/video/news namespaces + xhtml:link, limits, single-host
- [ ] Validation hardening (enums, required fields, absolute URLs, length budgets title/desc/twitter; warn by default, error mode)

## images

- [ ] W3C Web App Manifest (all members: display_override, orientation, dir/lang, id/scope, launch_handler, protocol/file/share_target, shortcuts, related_applications, prefer_related_applications, categories, screenshots)
- [ ] `@vite-pwa/assets-generator` adapter
- [ ] Icon generation (delegated)
- [ ] OG image via the generator's sharp pipeline (custom size)
- [ ] Emit generated assets with stable filenames
- [ ] Serve generated assets in `vite dev` via middleware
- [ ] Defer icons/manifest to `vite-plugin-pwa` when present
- [ ] Image pipeline + spec-coverage tests (likeeee idk, array-safe grouping, resolveImage seam maybe)
- [ ] Document image/icon configuration

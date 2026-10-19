# TODO

- [ ] Demo that is like a config generator that you can paste into your `vite.config.ts`/`.js`
- [ ] Docs via DocMD as always
- [x] robots.txt full directive set (RFC 9309 groups, wildcards `$`, Sitemap/Host/Crawl-delay/Clean-param; no Disallow on noindex)
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

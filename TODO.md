# TODO

- [ ] Demo that is like a config generator that you can paste into your `vite.config.ts`/`.js`
- [X] Tests via `vitest`
- [ ] Docs via DocMD as always
- [ ] `ImageRef` / `ImageInput` types + single `resolveImage()`
- [ ] Full meta spec (theme-color media, application-name, robots extras)
- [ ] Canonical + alternate link spec (incl. `x-default`)
- [ ] Full Open Graph spec (ogp.me): structured image/video/audio + type-specific
- [ ] Full Twitter Card spec
- [ ] Rich favicon + platform icons (mask-icon, msapplication, apple-*)
- [ ] JSON-LD builders expanded (ImageObject, BreadcrumbList)
- [ ] robots.txt full directive set
- [ ] sitemap.xml image/video/news namespaces
- [ ] Validation hardening (required fields, absolute URLs, length budgets)

## images

- [ ] Full W3C Web App Manifest builder
- [ ] `@vite-pwa/assets-generator` adapter
- [ ] Icon generation (delegated)
- [ ] OG image via the generator's sharp pipeline (custom size)
- [ ] Emit generated assets with stable filenames
- [ ] Serve generated assets in `vite dev` via middleware
- [ ] Defer icons/manifest to `vite-plugin-pwa` when present
- [ ] Image pipeline + spec-coverage tests
- [ ] Document image/icon configuration

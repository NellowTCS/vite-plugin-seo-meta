# TODO

- [X] scaffold plugin lol, single config auto fills most stuff for you but you can set custom properties manually if you want (types, config resolution, url + html injection, base meta done; the `seo()` plugin wiring is left)
- [X] some way to pair with `vite-plugin-pwa`?
- [X] OpenGraph tag generation
- [X] FB/Twitter/etc tag generation
  - [ ] Do full set later
- [X] Add JSON-LD support (Organization/WebSite/Article optional)
- [X] hreflang/alternate support
- [X] pre-apply validation
- [X] honor per-page `noindex`: exclude from sitemap + emit robots directive
- [X] merge with an existing `public/robots.txt` instead of writing over it
- [ ] Demo that is like a config generator that you can paste into your `vite.config.ts`/`.js`
- [ ] Tests via `vitest`
- [ ] Docs via DocMD as always
- [X] `robots.txt`, `sitemap.xml` generator possibly? maybe coexist with other plugins find if they're installed, etc

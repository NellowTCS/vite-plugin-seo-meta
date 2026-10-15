# TODO

- [ ] scaffold plugin lol, single config auto fills most stuff for you but you can set custom properties manually if you want (types, config resolution, url + html injection, base meta done; the `seo()` plugin wiring is left)
- [ ] some way to pair with `vite-plugin-pwa`?
- [ ] OpenGraph tag generation
- [ ] FB/Twitter/etc tag generation
- [X] Meta generation
  - [ ] Do full set later
- [ ] Add JSON-LD support (Organization/WebSite/Article optional)
- [ ] hreflang/alternate support
- [X] absolute URL support/builder/validation
- [ ] pre-apply validation
- [X] escaping and handling empty values safely (ugh CVEs and XSS are something i don't want)
- [ ] honor per-page `noindex`: exclude from sitemap + emit robots directive
- [ ] merge with an existing `public/robots.txt` instead of writing over it
- [ ] Demo that is like a config generator that you can paste into your `vite.config.ts`/`.js`
- [ ] Tests via `vitest`
- [ ] Docs via DocMD as always
- [X] all the typical stuff, SECURITY.md, CONTRIBUTING.md, publish config
- [ ] `robots.txt`, `sitemap.xml` generator possibly? maybe coexist with other plugins find if they're installed, etc

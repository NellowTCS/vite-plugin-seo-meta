---
type: concept
title: "SPA Runtime"
description: "Update SEO tags when the URL changes in a single-page app."
source: "https://nellowtcs.me/vite-plugin-seo-meta/guide/spa-runtime/"
path: /guide/spa-runtime/
updated: 2026-10-28
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-10-28T19:03:25.811Z"
---
---
title: "SPA Runtime"
description: "Update SEO tags when the URL changes in a single-page app."
---

SPA apps have a problem. If you navigate to a new route, the `<title>` and `<meta>` tags do not update. This is because the plugin only injects them at build time.So, the plugin injects tags at build time for the initial HTML. When the client navigates to a new route, the tags do not update on their own so you need to call `applySeo()`.

```ts
import { applySeo } from "vite-plugin-seo-meta/runtime";

function onRouteChange() {
  applySeo({ title: "New Page", description: "..." });
}
```

## How it works

`applySeo(page, site?)` merges the page data with the injected site config. Pass `site` explicitly when you need a different site than the one the plugin injected. Omit it and the plugin uses the config from the build.

It only updates head elements the plugin manages and your own tags are left alone once the page is loaded!

## What it updates

- `<title>`
- `<meta name="description">`
- `<meta name="robots">`
- `<link rel="canonical">`
- Open Graph tags
- Twitter Card tags
- JSON-LD scripts

## When to call it

Call it after every route change. In a router, that is the navigation callback:

```ts
// vue-router
router.afterEach((to) => {
  applySeo({ title: to.meta.title, description: to.meta.description });
});

// react-router
useEffect(() => {
  applySeo({ title: location.pathname, description: "..." });
}, [location]);
```

## What it does not do

`applySeo` updates tags. It does not push history, change the URL, or update the browser title bar. Your router handles that! Don't just rely on `applySeo` if you're making an SPA (if that wasn't obvious already)!

It also does not fetch data, as you should already have it available. Pass the metadata you already have!

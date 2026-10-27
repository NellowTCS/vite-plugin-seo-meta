---
type: concept
title: Installation
description: "Install vite-plugin-seo-meta and set up its peer dependency."
source: "https://nellowtcs.me/vite-plugin-seo-meta/getting-started/installation/"
path: /getting-started/installation/
updated: 2026-10-27
okf:
  generated_by: "@docmd/plugin-okf"
  generated_at: "2026-10-27T06:48:08.070Z"
---
---
title: "Installation"
description: "Install vite-plugin-seo-meta and set up its peer dependency."
---

Install the plugin (It (obviously) needs Vite as a peer dependency).

```bash
npm i -D vite-plugin-seo-meta vite
```

Vite 5 or newer is required.

The plugin is ESM only. If your project is CommonJS, switch to ESM (easier said than done, to be fair) or use the `.cjs` build.

## Build output

The plugin builds to `dist/index.js` (ESM) and `dist/index.cjs` (CommonJS). The runtime helper is a separate entry (as why would you want to compile a vite-plugin for web, and vice versa):

```ts
import { applySeo } from "vite-plugin-seo-meta/runtime";
```

Importing the runtime pulls in the client-side navigation handler. It is tree-shaken (aka, yeeted) out of the main build if you do not use it.

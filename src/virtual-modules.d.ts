declare module "virtual:vite-plugin-seo-meta/config" {
  import type { ResolvedSite } from "./types";

  export const site: ResolvedSite;
  const defaultExport: ResolvedSite;
  export default defaultExport;
}

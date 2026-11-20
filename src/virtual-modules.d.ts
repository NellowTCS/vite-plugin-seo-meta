declare module "virtual:vite-plugin-seo-meta/config" {
  import type { PageMeta, ResolvedSite } from "./types";

  export const site: ResolvedSite;
  export const pages: Record<string, PageMeta>;
  const defaultExport: ResolvedSite;
  export default defaultExport;
}

import { defineConfig } from "vite";
import { seo } from "vite-plugin-seo-meta";

export default defineConfig({
  base: "/vite-plugin-seo-meta/demo/",
  plugins: [seo()],
});

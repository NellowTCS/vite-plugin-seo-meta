import { defineConfig } from "vite";
import { seo } from "vite-plugin-seo-meta";

export default defineConfig({
  base: "./",
  plugins: [
    seo({
      configFile: false,
      site: {
        url: "https://nellowtcs.me/vite-plugin-seo-meta/",
        name: "vite-plugin-seo-meta demo",
        title: "vite-plugin-seo-meta",
        titleTemplate: "%s | vite-plugin-seo-meta",
        description: "Config generator for vite-plugin-seo-meta",
      },
    }),
  ],
});

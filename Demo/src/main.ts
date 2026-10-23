import "./style.css";
import { type SeoOptions } from "vite-plugin-seo-meta";

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

function val(id: string): string {
  const el = $(id) as
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  return el.value.trim();
}

function isChecked(id: string): boolean {
  const el = $(id) as HTMLInputElement;
  return el.checked;
}

function list(id: string): string[] {
  return val(id)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function num(id: string): number | undefined {
  const v = val(id);
  return v ? Number(v) : undefined;
}

function copyText(text: string, btn: HTMLElement) {
  navigator.clipboard.writeText(text).then(() => {
    const old = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => (btn.textContent = old), 1200);
  });
}

function buildConfig(): SeoOptions {
  const url = val("url") || "https://example.com";
  const name = val("name") || "My Site";

  const config: SeoOptions = {
    site: {
      url,
      name,
      title: val("title") || name,
      titleTemplate: val("titleTemplate") || "%s | My Site",
      description: val("description") || "My awesome site",
      locale: val("locale") || "en_US",
    },
  };

  const author = val("author");
  const image = val("image");
  if (author) config.site!.author = author;
  if (image) config.site!.image = image;

  // Twitter Card
  const twitter: NonNullable<SeoOptions["site"]>["twitter"] = {};
  const twHandle = val("twitter");
  if (twHandle) twitter.site = twHandle;
  if (val("twCard"))
    twitter.card = val("twCard") as
      "summary" | "summary_large_image" | "app" | "player";
  if (val("twTitle")) twitter.title = val("twTitle");
  if (val("twDesc")) twitter.description = val("twDesc");
  if (val("twImage")) twitter.image = val("twImage");
  if (val("twImageAlt")) twitter.imageAlt = val("twImageAlt");
  if (val("twCreator")) twitter.creator = val("twCreator");
  if (val("twLabel1")) twitter.label1 = val("twLabel1");
  if (val("twData1")) twitter.data1 = val("twData1");
  if (val("twLabel2")) twitter.label2 = val("twLabel2");
  if (val("twData2")) twitter.data2 = val("twData2");
  if (Object.keys(twitter).length > 0) config.site!.twitter = twitter;

  // Favicon icons
  const favicon: NonNullable<SeoOptions["site"]>["favicon"] = {};
  if (val("favicon")) favicon.icon = val("favicon");
  if (val("appleTouch")) favicon.appleTouchIcon = val("appleTouch");
  if (val("manifest")) favicon.manifest = val("manifest");
  if (val("maskIcon")) favicon.maskIcon = val("maskIcon");
  if (val("themeColor")) favicon.themeColor = val("themeColor");
  if (val("mwaTitle")) {
    favicon.mobileWebApp = { title: val("mwaTitle") };
    if (val("mwaStatusBar"))
      favicon.mobileWebApp!.statusBarStyle = val("mwaStatusBar") as
        "default" | "black" | "black-translucent" | "transparent";
    if (isChecked("mwaCapable")) favicon.mobileWebApp!.capable = true;
  }
  if (val("msTileColor") || val("msTileImage") || val("msConfig")) {
    favicon.msapplication = {};
    if (val("msTileColor"))
      favicon.msapplication!.tileColor = val("msTileColor");
    if (val("msTileImage"))
      favicon.msapplication!.tileImage = val("msTileImage");
    if (val("msConfig")) favicon.msapplication!.config = val("msConfig");
  }
  if (Object.keys(favicon).length > 0) config.site!.favicon = favicon;

  // JSON-LD
  if (isChecked("jsonLdOrg") || isChecked("jsonLdWeb")) {
    config.site!.jsonLd = {};
    if (isChecked("jsonLdOrg")) config.site!.jsonLd!.organization = true;
    if (isChecked("jsonLdWeb")) config.site!.jsonLd!.website = true;
  }

  // Pages
  const pages: NonNullable<SeoOptions["pages"]> = {};
  if (isChecked("addHome")) pages["/"] = { title: "Home" };
  if (isChecked("addAbout")) pages["/about"] = { title: "About" };
  if (isChecked("addPrivate"))
    pages["/private"] = { title: "Private", noindex: true };
  if (Object.keys(pages).length > 0) config.pages = pages;

  // robots.txt
  if (val("robots") === "false") {
    config.robots = false;
  } else {
    const robots: NonNullable<SeoOptions["robots"]> = {};
    if (val("robotsUA")) robots.userAgent = val("robotsUA");
    const disallow = list("robotsDisallow");
    if (disallow.length) robots.disallow = disallow;
    const allow = list("robotsAllow");
    if (allow.length) robots.allow = allow;
    if (num("crawlDelay")) robots.crawlDelay = num("crawlDelay")!;
    const cleanParam = list("cleanParam");
    if (cleanParam.length) robots.cleanParam = cleanParam;
    if (val("robotsHost")) robots.host = val("robotsHost");
    if (val("sitemapUrl")) robots.sitemap = val("sitemapUrl");
    if (val("robots") === "disallowNoindex") robots.disallowNoindex = true;
    if (Object.keys(robots).length > 0) config.robots = robots;
  }

  // sitemap.xml
  if (val("sitemap") === "false") {
    config.sitemap = false;
  } else {
    const sitemap: NonNullable<SeoOptions["sitemap"]> = {};
    if (num("maxUrls")) sitemap.maxUrls = num("maxUrls")!;
    const exclude = list("sitemapExclude");
    if (exclude.length) sitemap.exclude = exclude;
    if (Object.keys(sitemap).length > 0) config.sitemap = sitemap;
  }

  if (val("validate") === "error") config.validate = "error";
  else if (val("validate") === "false") config.validate = false;

  return config;
}

function generate() {
  const config = buildConfig();
  const json = JSON.stringify(config, null, 2);
  const indented = json
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");

  const inline = `import { defineConfig } from "vite";
import { seo } from "vite-plugin-seo-meta";

export default defineConfig({
  plugins: [
    seo({
      configFile: false,
${indented}
    }),
  ],
});
`;

  const seoConfig = `import { defineSeoConfig } from "vite-plugin-seo-meta";

export default defineSeoConfig(${json});
`;

  ($("inline") as HTMLPreElement).textContent = inline;
  ($("seo") as HTMLPreElement).textContent = seoConfig;
}

function init() {
  const form = $("form") as HTMLFormElement | null;
  form?.addEventListener("input", generate);
  form?.addEventListener("change", generate);
  $("generate")?.addEventListener("click", generate);
  $("copy-inline")?.addEventListener("click", (e) =>
    copyText(
      ($("inline") as HTMLPreElement).textContent || "",
      e.currentTarget as HTMLElement,
    ),
  );
  $("copy-seo")?.addEventListener("click", (e) =>
    copyText(
      ($("seo") as HTMLPreElement).textContent || "",
      e.currentTarget as HTMLElement,
    ),
  );
  generate();
}

init();

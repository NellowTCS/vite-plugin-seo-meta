import "./style.css";

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

function copyText(text: string, btn: HTMLElement) {
  navigator.clipboard.writeText(text).then(() => {
    const old = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => (btn.textContent = old), 1200);
  });
}

function generate() {
  const url = val("url") || "https://example.com";
  const name = val("name") || "My Site";
  const title = val("title") || "My Site";
  const titleTemplate = val("titleTemplate") || "%s | My Site";
  const description = val("description") || "My awesome site";
  const locale = val("locale") || "en_US";
  const author = val("author");
  const image = val("image");
  const twitter = val("twitter");

  const jsonLdOrg = isChecked("jsonLdOrg");
  const jsonLdWeb = isChecked("jsonLdWeb");

  const addHome = isChecked("addHome");
  const addAbout = isChecked("addAbout");
  const addPrivate = isChecked("addPrivate");

  const robots = val("robots");
  const sitemap = val("sitemap");
  const validate = val("validate");

  const siteLines: string[] = [];
  siteLines.push(`  site: {`);
  siteLines.push(`    url: "${url}",`);
  siteLines.push(`    name: "${name}",`);
  siteLines.push(`    title: "${title}",`);
  siteLines.push(`    titleTemplate: "${titleTemplate}",`);
  siteLines.push(`    description: "${description}",`);
  if (locale) siteLines.push(`    locale: "${locale}",`);
  if (author) siteLines.push(`    author: "${author}",`);
  if (image) siteLines.push(`    image: "${image}",`);
  if (twitter) siteLines.push(`    twitter: "${twitter}",`);
  if (jsonLdOrg || jsonLdWeb) {
    siteLines.push(`    jsonLd: {`);
    if (jsonLdOrg) siteLines.push(`      organization: true,`);
    if (jsonLdWeb) siteLines.push(`      website: true,`);
    siteLines.push(`    },`);
  }
  siteLines.push(`  },`);

  const pageLines: string[] = [];
  if (addHome) pageLines.push(`    "/": { title: "Home" },`);
  if (addAbout) pageLines.push(`    "/about": { title: "About" },`);
  if (addPrivate)
    pageLines.push(`    "/private": { title: "Private", noindex: true },`);

  const optLines: string[] = [];
  if (pageLines.length) {
    optLines.push(`  pages: {\n${pageLines.join("\n")}\n  },`);
  }
  if (robots === "disallowNoindex") {
    optLines.push(`  robots: { disallowNoindex: true },`);
  } else if (robots === "false") {
    optLines.push(`  robots: false,`);
  }
  if (sitemap === "false") {
    optLines.push(`  sitemap: false,`);
  }
  if (validate === "error") {
    optLines.push(`  validate: "error",`);
  } else if (validate === "false") {
    optLines.push(`  validate: false,`);
  }

  const inline = `import { defineConfig } from "vite";
import { seo } from "vite-plugin-seo-meta";

export default defineConfig({
  plugins: [
    seo({
      configFile: false,
${siteLines.join("\n")}
${optLines.join("\n")}
    }),
  ],
});
`;

  const seoConfig = `import { defineSeoConfig } from "vite-plugin-seo-meta";

export default defineSeoConfig({
${siteLines.map((l) => l.replace(/^  /, "")).join("\n")}
});
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

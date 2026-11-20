import { inline, seoOut } from "./dom";

type RecordUnknown = Record<string, unknown>;

export function copyText(text: string, btn: HTMLElement) {
  const old = btn.textContent;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = old), 1200);
    })
    .catch(() => {
      btn.textContent = "Copy failed...";
      setTimeout(() => (btn.textContent = old), 1200);
    });
}

export function renderOutputs(config: RecordUnknown) {
  const json = JSON.stringify(config, null, 2);
  const options = { configFile: false, ...config };
  const indented = JSON.stringify(options, null, 2)
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");

  inline.textContent = `import { defineConfig } from "vite";
import { seo } from "vite-plugin-seo-meta";

export default defineConfig({
  plugins: [
    seo({
${indented}
    }),
  ],
});
`;

  seoOut.textContent = `import { defineSeoConfig } from "vite-plugin-seo-meta";

export default defineSeoConfig(${json});
`;
}

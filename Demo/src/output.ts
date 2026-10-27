import { inline, seoOut } from "./dom";

type RecordUnknown = Record<string, unknown>;

export function copyText(text: string, btn: HTMLElement) {
  navigator.clipboard.writeText(text).then(() => {
    const old = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => (btn.textContent = old), 1200);
  });
}

export function renderOutputs(config: RecordUnknown) {
  const json = JSON.stringify(config, null, 2);
  const indented = json
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");

  inline.textContent = `import { defineConfig } from "vite";
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

  seoOut.textContent = `import { defineSeoConfig } from "vite-plugin-seo-meta";

export default defineSeoConfig(${json});
`;
}

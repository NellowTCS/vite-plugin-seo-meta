import { html, render } from "uhtml";
import { form } from "./fields.gen";
import type { Entry, GateSpec, SectionSpec } from "./fields.gen";

export type Template = ReturnType<typeof html>;
export type InputLike = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export const panel = document.getElementById("form") as HTMLElement;
export const inline = document.getElementById("inline") as HTMLPreElement;
export const seoOut = document.getElementById("seo") as HTMLPreElement;
export const pagesSpec = form.pages as SectionSpec;

export const isGate = (e: Entry): e is GateSpec => "gate" in e;
export const isSection = (e: Entry): e is SectionSpec => "kind" in e;
export const isWide = (e: Entry) => isGate(e) || isSection(e);

export const humanize = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());

export const control = (fid: string, root: ParentNode = panel) =>
  root.querySelector<InputLike>(`[data-fid="${CSS.escape(fid)}"]`);

/** Node identifier and stuff
 * (WEIRDDDDDDD BUT: uhtml types `html` as Node | HTMLElement | Hole and Hole is not a Node)
 * but every template here has exactly one root element. */
export function nodeOf(hole: Template): HTMLElement {
  const host = document.createElement("div");
  render(host, hole as unknown as Node);
  const root = host.firstElementChild as HTMLElement;

  for (const sel of root.querySelectorAll<HTMLSelectElement>("select[data-value]")) {
    sel.value = sel.dataset.value ?? "";
  }
  return root;
}

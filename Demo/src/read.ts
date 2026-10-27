import { control, isGate, isSection, pagesSpec, panel } from "./dom";
import { form } from "./fields.gen";
import type { FieldSpec, FormFields, GateSpec } from "./fields.gen";

function rawValue(fid: string, root: ParentNode = panel): string {
  const el = control(fid, root);
  if (!el) return "";
  if (el instanceof HTMLInputElement && el.type === "checkbox") return "";
  return el.value.trim();
}

function readField(spec: FieldSpec, root: ParentNode = panel): unknown {
  const v = rawValue(spec.id, root);
  if (spec.control === "checkbox")
    return (control(spec.id, root) as HTMLInputElement)?.checked || undefined;
  if (spec.control === "number") {
    if (!v) return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  }
  if (spec.control === "list")
    return v
      ? v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
  if (spec.control === "json") {
    if (!v) return undefined;
    try {
      return JSON.parse(v);
    } catch {
      return undefined;
    }
  }
  if (spec.control === "select" || spec.control === "select?")
    return v === "" ? undefined : v;
  return v || undefined;
}

function readGate(spec: GateSpec, root: ParentNode = panel): unknown {
  const choice = rawValue(spec.id, root);
  if (choice === "") return undefined;
  if (choice === "raw" && spec.raw)
    return rawValue(spec.raw.id, root) || undefined;
  if (choice === "object" && spec.nested) {
    const value = readSection(spec.nested.fields, root, `${spec.id}:object`);
    return Object.keys(value).length ? value : undefined;
  }
  if (choice === "true") return true;
  if (choice === "false") return false;
  return choice;
}

function readSection(
  fields: FormFields,
  root: ParentNode = panel,
  fid?: string,
): Record<string, unknown> {
  const scope = fid
    ? (root.querySelector(`[data-fid="section:${fid}"]`) ?? root)
    : root;
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(fields)) {
    const value = isSection(entry)
      ? Object.keys(readSection(entry.fields, scope, key)).length
        ? readSection(entry.fields, scope, key)
        : undefined
      : isGate(entry)
        ? readGate(entry, scope)
        : readField(entry, scope);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function readForm(): Record<string, unknown> {
  const out = readSection(form);
  delete out.pages;

  const pages: Record<string, unknown> = {};
  for (const el of panel.querySelectorAll<HTMLDetailsElement>(".page-entry")) {
    const route = el.dataset.route;
    if (!route) continue;
    const value = readSection(pagesSpec.fields, el);
    if (Object.keys(value).length) pages[route] = value;
  }
  if (Object.keys(pages).length) out.pages = pages;

  const site = out.site as Record<string, unknown> | undefined;
  if (site && !site.url) site.url = "https://example.com";
  return out;
}

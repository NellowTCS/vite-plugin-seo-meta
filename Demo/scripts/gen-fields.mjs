#!/usr/bin/env node

// I must say... this entire file is an exercise in overengineering. Fortunately, 
// past me has done similar wild stuff before so it's not that difficult. Just weird.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import prettier from "prettier";

const demoDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = join(demoDir, "..");
const typesPath = join(rootDir, "src/types.ts");
const outPath = join(demoDir, "src/fields.gen.ts");

const program = ts.createProgram([typesPath], {
  noResolve: true,
  target: ts.ScriptTarget.Latest,
});
const checker = program.getTypeChecker();
const sf = program.getSourceFiles().find((f) => f.fileName === typesPath);

const interfaces = new Map();
for (const st of sf.statements) {
  if (ts.isInterfaceDeclaration(st)) interfaces.set(st.name.text, st);
}

const OVERRIDES = {
  "site.url": {
    label: "Base URL",
    value: "https://example.com",
    hint: "Canonical origin for the site (required)",
  },
  "site.name": { value: "My Site" },
  "site.title": { value: "My Site" },
  "site.titleTemplate": { value: "%s | My Site" },
  "site.description": { control: "textarea", value: "My awesome site" },
  "site.locale": { value: "en_US" },
  "site.lang": { value: "en-US" },
  "site.keywords": { placeholder: "seo, vite, plugin" },
  "site.twitter": {
    label: "Twitter",
    value: "raw",
    raw: { placeholder: "@example" },
  },
  "site.jsonLd": { title: "JSON-LD" },
  "site.jsonLd.organization": { control: "select", value: "true" },
  "site.jsonLd.website": { control: "select", value: "true" },
  "pages.jsonLd": { title: "JSON-LD" },
  robots: { label: "robots.txt" },
  sitemap: { label: "sitemap.xml" },
  configFile: {
    hint: "Path to a config file, or false to skip auto-detection",
  },
};

const SITE_JSONLD_OMIT = ["article", "product"];

function jsDocText(node) {
  for (const d of ts.getJSDocCommentsAndTags(node)) {
    if (!ts.isJSDoc(d)) continue;
    if (typeof d.comment === "string") return d.comment;
    if (Array.isArray(d.comment))
      return d.comment
        .map((p) =>
          typeof p.text === "string"
            ? p.text
            : p.name
              ? "`" + p.name.getText() + "`"
              : "",
        )
        .join("");
  }
  return "";
}

function humanize(name) {
  const spaced = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function litValue(t) {
  return JSON.parse(checker.typeToString(t));
}

function declaredOptions(t) {
  const decl = t.aliasSymbol?.declarations?.find(ts.isTypeAliasDeclaration);
  if (!decl || !ts.isUnionTypeNode(decl.type)) return null;
  const ordered = decl.type.types
    .map((n) => {
      const lit = ts.isLiteralTypeNode(n) && n.literal;
      return lit && ts.isStringLiteralLike(lit) ? lit.text : undefined;
    })
    .filter((v) => v !== undefined);
  return ordered.length ? ordered : null;
}

function describe(t) {
  if (t.flags & ts.TypeFlags.Boolean)
    return { kind: "primitive", type: "boolean" };
  if (t.isUnion()) {
    const parts = t.types.map(describe);
    if (
      parts.length &&
      parts.every((p) => p.kind === "literal" && p.type === "string")
    )
      return {
        kind: "litu",
        options: declaredOptions(t) ?? parts.map((p) => p.value),
      };
    const bools = parts.filter(
      (p) => p.kind === "literal" && p.type === "boolean",
    );
    const hasTrue = bools.some((p) => p.value === "true");
    const hasFalse = bools.some((p) => p.value === "false");
    if (hasTrue && hasFalse) {
      const merged = parts.filter(
        (p) => !(p.kind === "literal" && p.type === "boolean"),
      );
      merged.push({ kind: "primitive", type: "boolean" });
      return { kind: "union", parts: merged };
    }
    return { kind: "union", parts };
  }
  if (t.flags & ts.TypeFlags.StringLiteral)
    return { kind: "literal", type: "string", value: litValue(t) };
  if (t.flags & ts.TypeFlags.NumberLiteral)
    return { kind: "literal", type: "number", value: checker.typeToString(t) };
  if (t.flags & ts.TypeFlags.BooleanLiteral)
    return { kind: "literal", type: "boolean", value: checker.typeToString(t) };
  if (t.flags & ts.TypeFlags.String)
    return { kind: "primitive", type: "string" };
  if (t.flags & ts.TypeFlags.Number)
    return { kind: "primitive", type: "number" };
  if (t.flags & ts.TypeFlags.Boolean)
    return { kind: "primitive", type: "boolean" };
  if (checker.isArrayType(t))
    return { kind: "array", of: describe(checker.getTypeArguments(t)[0]) };
  if (checker.typeToString(t) === "Date")
    return { kind: "primitive", type: "string" };
  const sym = t.symbol;
  if (sym && sym.flags & ts.SymbolFlags.Interface)
    return { kind: "object", name: sym.getName() };
  if (t.aliasSymbol) {
    if (t.aliasSymbol.getName() === "Record") {
      const args = t.aliasTypeArguments ?? [];
      if (args[1] && checker.typeToString(args[1]) === "PageMeta")
        return { kind: "pages", of: "PageMeta" };
      return { kind: "record" };
    }
    const decl = t.aliasSymbol.declarations?.find(ts.isTypeAliasDeclaration);
    if (decl) {
      const target = describe(checker.getTypeFromTypeNode(decl.type));
      if (target.kind === "litu" && ts.isUnionTypeNode(decl.type)) {
        const ordered = decl.type.types
          .map((n) => {
            const lit = ts.isLiteralTypeNode(n) && n.literal;
            return lit && ts.isStringLiteralLike(lit) ? lit.text : undefined;
          })
          .filter((v) => v !== undefined);
        if (ordered.length === target.options.length) target.options = ordered;
      }
      return target;
    }
  }
  return { kind: "opaque" };
}

function emitVal(v) {
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return `[${v.map(emitVal).join(", ")}]`;
  if (v && typeof v === "object") {
    if ("ref" in v && typeof v.ref === "string" && Object.keys(v).length === 1)
      return v.ref;
    const parts = Object.entries(v)
      .filter(([, val]) => val !== undefined)
      .map(([k, val]) => `${k}: ${emitVal(val)}`);
    return `{ ${parts.join(", ")} }`;
  }
  throw new Error(`Cannot serialize: ${String(v)}`);
}

const usedTypes = new Set();
const statements = [];
const instances = new Map();

function satisfiesExpr(typeName, omitted) {
  usedTypes.add(typeName);
  if (!omitted.length) return `Cover<${typeName}>`;
  const keys = omitted.map((k) => JSON.stringify(k)).join(" | ");
  return `Cover<Omit<${typeName}, ${keys}>>`;
}

function emitInstance(typeName, omitted, path) {
  const key = `${typeName}|${omitted.join(",")}`;
  const existing = instances.get(key);
  if (existing) return existing;
  const decl = interfaces.get(typeName);
  if (!decl)
    throw new Error(`Unknown interface referenced from the form: ${typeName}`);
  const constName =
    "f_" + typeName + (omitted.length ? "_no_" + omitted.join("_") : "");
  instances.set(key, constName);

  const props = [];
  for (const member of decl.members) {
    if (!ts.isPropertySignature(member) || !member.type) continue;
    const propName = member.name.getText();
    if (omitted.includes(propName)) continue;
    const propPath = path ? `${path}.${propName}` : propName;
    props.push(
      `${propName}: ${entryCode(member, propName, propPath, typeName, omitted)}`,
    );
  }
  statements.push(
    `const ${constName} = {\n${props.join(",\n")},\n} satisfies ${satisfiesExpr(typeName, omitted)};\n`,
  );
  return constName;
}

function entryCode(member, relId, propPath, parentType, parentOmitted) {
  const d = describe(checker.getTypeAtLocation(member));
  const o = OVERRIDES[propPath] ?? {};
  const label = o.label ?? humanize(relId);
  const hint =
    o.hint !== undefined
      ? o.hint
      : jsDocText(member).replace(/\s+/g, " ").trim();
  const extra = { hint: hint || undefined };
  if (o.placeholder) extra.placeholder = o.placeholder;
  if (o.value !== undefined) extra.value = o.value;

  const gateFor = (options, objDesc) => {
    const raw = options.includes("raw")
      ? {
          control: "text",
          id: `${relId}.raw`,
          label,
          placeholder: o.raw?.placeholder ?? "Text value",
          hint: extra.hint,
        }
      : undefined;
    const nested =
      objDesc && options.includes("object")
        ? {
            kind: "section",
            fields: { ref: emitInstance(objDesc.name, [], propPath) },
            title: label,
          }
        : undefined;
    return emitVal({
      gate: true,
      control: o.control ?? "select?",
      id: relId,
      label,
      options,
      hint: extra.hint,
      placeholder: extra.placeholder,
      value: extra.value,
      raw,
      nested,
    });
  };

  const fieldData = (control, options) =>
    emitVal({ control, id: relId, label, options, ...extra });

  if (d.kind === "union") {
    const objs = d.parts.filter((x) => x.kind === "object");
    const arrays = d.parts.filter((x) => x.kind === "array");
    const prims = d.parts.filter((x) => x.kind === "primitive");
    const lits = d.parts.filter(
      (x) => x.kind === "literal" && x.type === "string",
    );
    const hasBoolPrim = prims.some((x) => x.type === "boolean");
    const hasFalseLit = d.parts.some(
      (x) => x.kind === "literal" && x.value === "false",
    );
    const hasStringPrim = prims.some((x) => x.type === "string");

    if (lits.length && lits.length === d.parts.length)
      return fieldData(
        o.control ?? "select?",
        lits.map((x) => x.value),
      );

    if (objs.length) {
      const options = [
        ...lits.map((x) => x.value),
        ...(hasBoolPrim || hasFalseLit
          ? hasBoolPrim
            ? ["true", "false"]
            : ["false"]
          : []),
        ...(hasStringPrim ? ["raw"] : []),
        "object",
      ];
      return gateFor(options, objs[0]);
    }
    if (hasFalseLit && lits.length)
      return fieldData(o.control ?? "select?", [
        ...lits.map((x) => x.value),
        "false",
      ]);
    if (hasFalseLit && hasStringPrim) return gateFor(["raw", "false"]);
    if (arrays.length) {
      if (arrays.length === 1 && arrays[0].of.kind === "primitive")
        return fieldData(o.control ?? "list");
      return fieldData(o.control ?? "json");
    }
    if (prims.length) return fieldData(o.control ?? "text");
  }

  switch (d.kind) {
    case "primitive":
      return fieldData(
        o.control ??
          (d.type === "number"
            ? "number"
            : d.type === "boolean"
              ? "checkbox"
              : "text"),
      );
    case "litu":
      return fieldData(o.control ?? "select?", d.options);
    case "array":
      return fieldData(
        o.control ?? (d.of.kind === "primitive" ? "list" : "json"),
      );
    case "pages":
      return emitVal({
        kind: "section",
        control: "pages",
        title: label,
        route: {
          control: "text",
          id: "route",
          label: "Route",
          placeholder: "/about",
          value: "/",
        },
        fields: { ref: emitInstance("PageMeta", [], propPath) },
      });
    case "object": {
      const omitted =
        parentType === "JsonLdConfig" && parentOmitted === SITE_JSONLD_OMIT
          ? SITE_JSONLD_OMIT
          : [];
      if (parentType === "JsonLdConfig") return gateFor(["true", "object"], d);
      const sectionTitle =
        parentType === "SeoOptions" && relId === "site"
          ? "Site"
          : (OVERRIDES[propPath]?.title ?? humanize(relId));
      return emitVal({
        kind: "section",
        title: sectionTitle,
        fields: {
          ref: emitInstance(
            d.name,
            relId === "jsonLd" && parentType === "SiteConfig"
              ? SITE_JSONLD_OMIT
              : [],
            propPath,
          ),
        },
      });
    }
    default:
      return fieldData(o.control ?? "json");
  }
}

const seoOptions = interfaces.get("SeoOptions");
const rootProps = [];
for (const member of seoOptions.members) {
  if (!ts.isPropertySignature(member) || !member.type) continue;
  const propName = member.name.getText();
  rootProps.push(
    `${propName}: ${entryCode(member, propName, propName, "SeoOptions", [])}`,
  );
}

const header = `// GENERATED by Demo/scripts/gen-fields.mjs from src/types.ts: do not edit.
// Re-run with \`npm run generate\` after changing the plugin types.

import type { ${[...usedTypes, "SeoOptions"].sort().join(", ")} } from "vite-plugin-seo-meta";

export type Control =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "list"
  | "select"
  | "select?"
  | "json"
  | "pages";

export interface FieldSpec {
  readonly control: Control;
  readonly id: string;
  readonly label: string;
  readonly options?: readonly string[];
  readonly placeholder?: string;
  readonly value?: string | number | boolean;
  readonly hint?: string;
}

export interface GateSpec extends FieldSpec {
  readonly gate: true;
  readonly control: "select" | "select?";
  readonly options: readonly string[];
  readonly raw?: FieldSpec;
  readonly nested?: SectionSpec;
}

export interface SectionSpec {
  readonly kind: "section";
  readonly control?: "pages";
  readonly title?: string;
  readonly hint?: string;
  readonly route?: FieldSpec;
  readonly fields: FormFields;
}

export type Entry = FieldSpec | GateSpec | SectionSpec;

export type FormFields = { readonly [key: string]: Entry };

export type Cover<T> = {
  readonly [K in keyof T]-?: Entry;
};
`;

const code = `${header}
${statements.join("\n")}
export const form = {
${rootProps.join(",\n")},
} satisfies Cover<SeoOptions>;
`;

const formatted = await prettier.format(code, { parser: "typescript" });
writeFileSync(outPath, formatted);
console.log(`Wrote ${outPath} (${usedTypes.size} types covered)`);

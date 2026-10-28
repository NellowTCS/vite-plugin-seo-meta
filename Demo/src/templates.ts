import { html } from "uhtml";
import { humanize, isGate, isSection, isWide, nodeOf, pagesSpec } from "./dom";
import type { Template } from "./dom";
import type {
  Entry,
  FieldSpec,
  FormFields,
  GateSpec,
  SectionSpec,
} from "./fields.gen";

export function fieldTpl(spec: FieldSpec) {
  const hint = spec.hint ?? "";
  if (spec.control === "checkbox") {
    return html`<label class="check" title=${hint}>
      <input
        type="checkbox"
        data-fid=${spec.id}
        .checked=${spec.value === true}
      />${spec.label}
    </label>`;
  }
  if (spec.control === "select" || spec.control === "select?") {
    const options = spec.options ?? [];
    return html`<label title=${hint}
      ><span>${spec.label}</span>
      <select data-fid=${spec.id} data-value=${spec.value ?? ""}>
        ${spec.control === "select?" ? html`<option value="">(omit)</option>` : ""}
        ${options.map((o) => html`<option value=${o}>${o}</option>`)}
      </select>
    </label>`;
  }
  if (spec.control === "textarea" || spec.control === "json") {
    return html`<label title=${hint}
      ><span>${spec.label}</span>
      <textarea
        data-fid=${spec.id}
        rows=${spec.control === "json" ? 3 : undefined}
        placeholder=${spec.placeholder ?? ""}
      >
${spec.value ?? ""}</textarea>
    </label>`;
  }
  return html`<label title=${hint}
    ><span>${spec.label}</span>
    <input
      type=${spec.control === "number" ? "number" : "text"}
      data-fid=${spec.id}
      placeholder=${spec.placeholder ?? (spec.control === "list" ? "comma,separated" : undefined)}
      .value=${spec.value != null ? String(spec.value) : ""}
    />
  </label>`;
}

export function gateTpl(spec: GateSpec) {
  const select = html`<select
    data-fid=${spec.id}
    data-value=${spec.value ?? ""}
  >
    ${spec.control === "select?" ? html`<option value="">(omit)</option>` : ""}
    ${(spec.options ?? []).map((o) => html`<option value=${o}>${o}</option>`)}
  </select>`;
  return html`<div class="gate">
    <label title=${spec.hint ?? ""}><span>${spec.label}</span>${select}</label>
    <div class="gate-body">
      ${
        spec.raw
          ? html`<label class="gate-raw" title=${spec.raw.hint ?? ""}>
              <span>${spec.raw.label}</span>
              <input
                data-fid=${spec.raw.id}
                placeholder=${spec.raw.placeholder ?? ""}
              />
            </label>`
          : ""
      }
      ${spec.nested ? sectionTpl(spec.nested, `${spec.id}:object`, "gate-nested") : ""}
    </div>
  </div>`;
}

function groupTpl(
  title: string,
  fid: string | undefined,
  open: boolean,
  body: Node,
  cls = "",
): Template {
  return html`<details
    class=${`group ${cls}`.trim()}
    ?open=${open}
    data-fid=${fid ? `section:${fid}` : undefined}
    data-default-open=${open ? "true" : undefined}
  >
    <summary>
      <span class="title">${title}</span><span class="badge"></span>
    </summary>
    ${body}
  </details>`;
}

export function sectionTpl(
  spec: SectionSpec,
  fid: string,
  cls = "",
): HTMLElement {
  if (spec.control === "pages") return pagesTpl(spec);
  return nodeOf(
    groupTpl(
      spec.title ?? humanize(fid),
      fid,
      fid === "site",
      fieldsTpl(spec.fields),
      cls,
    ),
  );
}

export function fieldsTpl(fields: FormFields): Node {
  const body = nodeOf(html`<div class="group-body"></div>`);
  for (const [key, entry] of Object.entries(fields)) {
    const node = entryNode(entry, key);
    if (isWide(entry)) node.classList.add("wide");
    body.append(node);
  }
  return body;
}

export function entryNode(spec: Entry, key: string): HTMLElement {
  const hole = isSection(spec)
    ? sectionTpl(spec, key)
    : isGate(spec)
      ? gateTpl(spec)
      : fieldTpl(spec);
  return nodeOf(hole);
}

function pageEntryTpl(route: string, open: boolean) {
  return html`<details class="page-entry" ?open=${open} data-route=${route}>
    <summary class="page-head">
      <strong>${route}</strong><span class="badge"></span>
      <button type="button" class="ghost remove">Remove</button>
    </summary>
    <div class="page-fields">${fieldsTpl(pagesSpec.fields)}</div>
  </details>`;
}

export function addPageRoute(list: HTMLElement, route: string, open = true) {
  list.append(nodeOf(pageEntryTpl(route, open)));
}

function pagesTpl(spec: SectionSpec): HTMLElement {
  const list = nodeOf(html`<div data-page-list=""></div>`);
  const controls = nodeOf(
    html`<div class="route-controls">
      <label title=""
        ><span>Route</span><input data-fid="route" placeholder="/about"
      /></label>
      <button type="button">Add page</button>
    </div>`,
  );
  const body = nodeOf(html`<div class="group-body"></div>`);
  body.append(controls, list);
  return nodeOf(groupTpl(spec.title ?? "Pages", "pages", true, body, "pages"));
}

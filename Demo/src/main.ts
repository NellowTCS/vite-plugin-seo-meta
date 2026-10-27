import "./style.css";
import { html, render } from "uhtml";
import { inline, isWide, panel, seoOut } from "./dom";
import { form } from "./fields.gen";
import { renderOutputs, copyText } from "./output";
import { readForm } from "./read";
import { addPageRoute, entryNode } from "./templates";
import { applyFilter, refreshBadges, setAllOpen, syncGates } from "./ui";

function topLevelNodes(): Node[] {
  const nodes: Node[] = [];
  const loose: HTMLElement[] = [];
  for (const [key, entry] of Object.entries(form)) {
    if ("kind" in entry) {
      nodes.push(entryNode(entry, key));
      continue;
    }
    const el = entryNode(entry, key);
    if (isWide(entry)) el.classList.add("wide");
    loose.push(el);
  }
  if (loose.length) {
    const group = entryNode(
      { kind: "section", fields: {}, title: "Files & validation" },
      "files",
    ) as HTMLDetailsElement;
    const body = document.createElement("div");
    body.className = "group-body";
    body.append(...loose);
    group.replaceChildren(group.querySelector("summary")!, body);
    nodes.push(group);
  }
  return nodes;
}

render(
  panel,
  html`<div>
    <div class="filter-row">
      <input
        type="search"
        placeholder="Filter options"
        aria-label="Filter options"
        data-filter
      />
      <button type="button" class="ghost" data-expand>Expand all</button>
      <button type="button" class="ghost" data-collapse>Collapse all</button>
    </div>
    ${topLevelNodes()}
    <div class="actions">
      <button type="button" id="generate">Regenerate</button>
      <button type="button" class="ghost" data-copy="inline">
        Copy vite.config.ts
      </button>
      <button type="button" class="ghost" data-copy="seo">
        Copy seo.config.ts
      </button>
    </div>
  </div>` as unknown as Node,
);

const pagesHost = panel.querySelector<HTMLElement>("[data-page-list]");
if (pagesHost) addPageRoute(pagesHost, "/", false);
const routeBox = panel.querySelector<HTMLInputElement>(".route-controls input");
if (routeBox) routeBox.value = "";

panel.addEventListener("input", (e) => {
  if (
    e.target instanceof HTMLInputElement &&
    e.target.hasAttribute("data-filter")
  ) {
    e.stopPropagation();
    applyFilter(e.target.value);
    return;
  }
  regenerate();
});
panel.addEventListener("change", (e) => {
  if (
    e.target instanceof HTMLInputElement &&
    e.target.hasAttribute("data-filter")
  )
    return;
  regenerate();
});
panel.addEventListener("keydown", (e) => {
  if (
    e.key === "Enter" &&
    e.target instanceof HTMLInputElement &&
    e.target.matches(".route-controls input")
  ) {
    e.preventDefault();
    addPage();
  }
});
panel.addEventListener("click", (e) => {
  const btn = e.target instanceof Element ? e.target.closest("button") : null;
  if (!btn) return;
  if (btn.id === "generate") return regenerate();
  if (btn.hasAttribute("data-expand")) return setAllOpen(true);
  if (btn.hasAttribute("data-collapse")) return setAllOpen(false);
  if (btn.classList.contains("remove")) {
    e.preventDefault();
    e.stopPropagation();
    btn.closest(".page-entry")?.remove();
    return regenerate();
  }
  if (btn.hasAttribute("data-copy")) {
    return copyText(
      (btn.getAttribute("data-copy") === "inline" ? inline : seoOut)
        .textContent ?? "",
      btn,
    );
  }
  if (btn.textContent === "Add page") addPage();
});

function addPage() {
  const box = panel.querySelector<HTMLInputElement>(".route-controls input");
  const list = panel.querySelector<HTMLElement>("[data-page-list]");
  if (!box || !list) return;
  const route = box.value.trim();
  if (!route || panel.querySelector(`[data-route="${CSS.escape(route)}"]`))
    return;
  addPageRoute(list, route);
  box.value = "";
  regenerate();
}

/* regenerate */
function regenerate() {
  renderOutputs(readForm());
  refreshBadges();
  syncGates();
}

regenerate();

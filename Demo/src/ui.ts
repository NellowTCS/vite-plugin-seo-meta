import { panel } from "./dom";
import type { InputLike } from "./dom";

// needle in a haystack be like
const haystack = (el: HTMLElement) =>
  [
    el.textContent ?? "",
    ...Array.from(
      el.querySelectorAll<HTMLElement>("[data-fid]"),
      (n) => n.dataset.fid ?? "",
    ),
    ...Array.from(el.querySelectorAll<HTMLElement>("[title]"), (n) => n.title),
    ...Array.from(
      el.querySelectorAll<HTMLInputElement>("input"),
      (n) => n.placeholder,
    ),
  ]
    .join(" ")
    .toLowerCase();

function setCount(scope: ParentNode): number {
  let count = 0;
  for (const el of scope.querySelectorAll<InputLike>(
    "input[data-fid], select[data-fid], textarea[data-fid]",
  )) {
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      if (el.checked) count++;
    } else if (el.value.trim()) count++;
  }
  return count;
}

// has some... interesting semantics but it works.
export function refreshBadges() {
  for (const group of panel.querySelectorAll<HTMLDetailsElement>(
    "details.group",
  )) {
    const badge = group.querySelector<HTMLElement>(":scope > summary > .badge");
    if (!badge) continue;
    const count = group.classList.contains("pages")
      ? Array.from(group.querySelectorAll(".page-entry")).filter(
          (entry) => setCount(entry) > 0,
        ).length
      : setCount(group);
    badge.textContent = count ? `${count} set` : "";
  }
  for (const entry of panel.querySelectorAll<HTMLDetailsElement>(
    ".page-entry",
  )) {
    const badge = entry.querySelector<HTMLElement>(":scope > summary > .badge");
    if (!badge) continue;
    const count = setCount(entry);
    badge.textContent = count ? `${count} set` : "";
  }
}

export function applyFilter(query: string) {
  const q = query.trim().toLowerCase();
  const groups = Array.from(
    panel.querySelectorAll<HTMLDetailsElement>("details.group"),
  );
  const entries = Array.from(
    panel.querySelectorAll<HTMLDetailsElement>(".page-entry"),
  );
  if (!q) {
    for (const group of groups) {
      group.hidden = false;
      group.open = group.dataset.defaultOpen === "true";
    }
    for (const entry of entries) entry.hidden = false;
    return;
  }
  for (const group of groups) group.hidden = true;
  for (const group of groups) {
    if (!haystack(group).includes(q)) continue;
    group.hidden = false;
    group.open = true;
    let parent = group.parentElement?.closest<HTMLDetailsElement>(
      "details.group, details.page-entry",
    );
    while (parent) {
      parent.hidden = false;
      parent.open = true;
      parent = parent.parentElement?.closest<HTMLDetailsElement>(
        "details.group, details.page-entry",
      );
    }
  }
  for (const entry of entries) {
    const match = haystack(entry).includes(q);
    entry.hidden = !match;
    if (match) entry.open = true;
  }
}

export function setAllOpen(open: boolean) {
  for (const group of panel.querySelectorAll<HTMLDetailsElement>(
    "details.group, .page-entry",
  )) {
    if (!group.hidden) group.open = open;
  }
}

export function syncGates() {
  for (const gate of panel.querySelectorAll<HTMLElement>(".gate")) {
    const select = gate.querySelector<HTMLSelectElement>("select[data-fid]");
    if (!select) continue;
    const raw = gate.querySelector<HTMLElement>(":scope .gate-raw");
    const nested = gate.querySelector<HTMLElement>(":scope .gate-nested");
    if (raw) raw.style.display = select.value === "raw" ? "" : "none";
    if (nested) nested.style.display = select.value === "object" ? "" : "none";
  }
}

import type { ImageInput, ImageRef } from "../types";

function isString(input: ImageInput): input is string {
  return typeof input === "string";
}

function isObject(input: ImageInput): input is Record<string, unknown> {
  return typeof input === "object" && input !== null;
}

export function resolveImage(input: ImageInput | undefined): ImageRef | undefined {
  if (input === undefined || input === null) return undefined;
  if (isString(input)) {
    const src = input.trim();
    if (src.length === 0) return undefined;
    return { src };
  }
  if (isObject(input)) {
    const obj = input as Record<string, unknown>;
    const srcRaw =
      (obj.src as string | undefined) ??
      (obj.url as string | undefined) ??
      (obj.href as string | undefined) ??
      "";
    const src = srcRaw.trim();
    if (src.length === 0) return undefined;
    const ref: ImageRef = { src };
    const alt = obj.alt;
    if (typeof alt === "string" && alt.trim().length > 0) ref.alt = alt.trim();
    const width = obj.width;
    if (typeof width === "number" && Number.isFinite(width) && width >= 1) {
      ref.width = Math.trunc(width);
    } else if (typeof width === "string") {
      const w = Number.parseInt(width, 10);
      if (Number.isFinite(w) && w >= 1) ref.width = w;
    }
    const height = obj.height;
    if (typeof height === "number" && Number.isFinite(height) && height >= 1) {
      ref.height = Math.trunc(height);
    } else if (typeof height === "string") {
      const h = Number.parseInt(height, 10);
      if (Number.isFinite(h) && h >= 1) ref.height = h;
    }
    const type = obj.type;
    if (typeof type === "string" && type.trim().length > 0) ref.type = type.trim();
    const secureUrl =
      (obj.secureUrl as string | undefined) ??
      (obj.secure_url as string | undefined);
    if (typeof secureUrl === "string" && secureUrl.trim().length > 0) {
      ref.secureUrl = secureUrl.trim();
    }
    const thumbnail = obj.thumbnail;
    if (typeof thumbnail === "string" && thumbnail.trim().length > 0) {
      ref.thumbnail = thumbnail.trim();
    }
    return ref;
  }
  return undefined;
}

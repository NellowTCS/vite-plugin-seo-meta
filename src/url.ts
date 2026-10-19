/** URL helpers */

/** Returns true when `value` is an absolute `http(s)` URL */
export function isAbsoluteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates and normalizes the configured site URL, stripping any trailing
 * slash. Throws on a non-`http(s)` value.
 */
export function normalizeSiteUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`site.url is not a valid URL: "${value}"`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`site.url must use http or https, received "${value}"`);
  }
  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path}`;
}

/**
 * Resolves `value` against the site URL.
 * - Root-relative paths are joined onto the site root, not host
 * - Absolute URLs and protocol-relative URLs are handled as-is
 */
export function toAbsolute(value: string, siteUrl: string): string {
  if (isAbsoluteUrl(value)) return value;
  if (value.startsWith("//")) return new URL(siteUrl).protocol + value;
  const base = siteUrl.endsWith("/") ? siteUrl : siteUrl + "/";
  return new URL(value.replace(/^\/+/, ""), base).href;
}

/**
 * Normalizes a route or page key to a pathname
 */
export function normalizeRoute(route: string): string {
  let value = route.trim();
  const hashIndex = value.search(/[?#]/);
  if (hashIndex !== -1) value = value.slice(0, hashIndex);
  if (value === "") return "/";
  if (!value.startsWith("/")) value = "/" + value;
  value = value.replace(/\/index\.html?$/i, "/").replace(/\.html?$/i, "");
  value = value.replace(/\/{2,}/g, "/");
  if (value.length > 1) value = value.replace(/\/+$/, "");
  return value === "" ? "/" : value;
}

/** Rejiggers the route pathname from an HTML entry filename relative to the root. */
export function routeFromHtmlFile(filename: string, root: string): string {
  const normalizedRoot = root.replace(/\\/g, "/").replace(/\/+$/, "");
  let rel = filename.replace(/\\/g, "/");
  if (normalizedRoot && rel.startsWith(normalizedRoot)) {
    rel = rel.slice(normalizedRoot.length);
  }
  return normalizeRoute(rel);
}

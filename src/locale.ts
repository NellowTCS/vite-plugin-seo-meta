/** BCP 47 language tag and Open Graph locale helpers */

/** True for a 4-letter ISO 15924 script subtag, like `Hans` or `Hant` */
function isScriptSubtag(part: string): boolean {
  return /^[a-zA-Z]{4}$/.test(part);
}

/** True for a UN M.49 numeric region, like `419` */
function isNumericRegion(part: string): boolean {
  return /^\d{3}$/.test(part);
}

/** True for a 2-letter ISO 3166-1 alpha-2 region, like `US` */
function isAlphaRegion(part: string): boolean {
  return /^[a-zA-Z]{2}$/.test(part);
}

/**
 * Normalizes a BCP 47 language tag to "proper" casing
 * - Language subtag lowercased, script titlecased, region uppercased
 * - Variants lowercased; `_` is accepted as a region separator and becomes `-`
 * - The `x-default` fallback tag is preserved in lowercase
 *
 * Very helpful: https://developers.google.com/search/docs/specialty/international/localized-versions
 *
 * @returns the normalized tag, or `""` when there is nothing usable
 */
export function normalizeLanguageTag(value: string): string {
  const parts = value
    .trim()
    .replace(/_/g, "-")
    .split("-")
    .filter((part) => part.length > 0);
  const [language, ...rest] = parts;
  if (!language) return "";

  const tag = [language.toLowerCase()];
  for (const part of rest) {
    if (isScriptSubtag(part)) tag.push(part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
    else if (isNumericRegion(part)) tag.push(part);
    else if (isAlphaRegion(part)) tag.push(part.toUpperCase());
    else tag.push(part.toLowerCase());
  }

  const result = tag.join("-");
  return result.toLowerCase() === "x-default" ? "x-default" : result;
}

/**
 * Converts a language tag to an Open Graph locale (`language_TERRITORY`).
 * Refer to: https://ogp.me/#optional
 *
 * @returns the locale, or `undefined` for blank input and `x-default`
 */
export function languageTagToOgLocale(value: string | undefined): string | undefined {
  const tag = value ? normalizeLanguageTag(value) : "";
  if (tag === "" || tag === "x-default") return undefined;
  const [language, ...rest] = tag.split("-");
  if (!language) return undefined;
  const region = rest.find((part) => isAlphaRegion(part) || isNumericRegion(part));
  return region ? `${language}_${region}` : language;
}

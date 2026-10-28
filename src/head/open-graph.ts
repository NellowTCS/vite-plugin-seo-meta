import { absolutize } from "../config/resolve";
import { resolveImage } from "../images/resolveImage";
import { languageTagToOgLocale } from "../locale";
import { toAbsolute } from "../url";
import type {
  HreflangAlternate,
  ImageInput,
  ImageRef,
  OpenGraphArticle,
  OpenGraphBook,
  OpenGraphInfo,
  OpenGraphMusic,
  OpenGraphMusicRef,
  OpenGraphPayment,
  OpenGraphProfile,
  OpenGraphVideo,
  OpenGraphVideoActor,
  ResolvedOpenGraphArticle,
  ResolvedOpenGraphBook,
  ResolvedOpenGraphInfo,
  ResolvedOpenGraphMusic,
  ResolvedOpenGraphPayment,
  ResolvedOpenGraphVideo,
  ResolvedOptions,
} from "../types";

/* Normalizes a date into a ISO 8601 string, and drops blank or invalid values */
function toIsoDate(value: string | Date | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Trims a `string | string[]` into a non-empty list */
function stringList(
  value: string | string[] | undefined,
): string[] | undefined {
  const raw = value === undefined ? [] : Array.isArray(value) ? value : [value];
  const list = raw
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return list.length > 0 ? list : undefined;
}

/** Same as `stringList` but resolves every entry against the site URL */
function urlList(
  value: string | string[] | undefined,
  siteUrl: string,
): string[] | undefined {
  const list = stringList(value)?.map((entry) => toAbsolute(entry, siteUrl));
  return list && list.length > 0 ? list : undefined;
}

/** Resolves structured media entries, absolutizing the URL fields */
function resolveMedia(
  media: ImageInput[] | undefined,
  siteUrl: string,
): ImageRef[] | undefined {
  const refs: ImageRef[] = [];
  for (const entry of media ?? []) {
    const ref = resolveImage(entry);
    if (!ref) continue;
    ref.src = toAbsolute(ref.src, siteUrl);
    if (ref.secureUrl) ref.secureUrl = toAbsolute(ref.secureUrl, siteUrl);
    refs.push(ref);
  }
  return refs.length > 0 ? refs : undefined;
}

/** Resolves `music:album` / `music:song` refs, keeping only entries with a URL */
function resolveMusicRefs(
  refs: OpenGraphMusicRef[] | undefined,
  siteUrl: string,
): OpenGraphMusicRef[] | undefined {
  const out: OpenGraphMusicRef[] = [];
  for (const ref of refs ?? []) {
    const url = ref.url ? toAbsolute(ref.url, siteUrl) : "";
    if (url === "") continue;
    const item: OpenGraphMusicRef = { url };
    if (ref.disc !== undefined) item.disc = ref.disc;
    if (ref.track !== undefined) item.track = ref.track;
    out.push(item);
  }
  return out.length > 0 ? out : undefined;
}

/** Resolves `video:actor` refs, keeping only entries with a URL */
function resolveVideoActors(
  actors: OpenGraphVideoActor[] | undefined,
  siteUrl: string,
): OpenGraphVideoActor[] | undefined {
  const out: OpenGraphVideoActor[] = [];
  for (const actor of actors ?? []) {
    if (!actor.url) continue;
    const item: OpenGraphVideoActor = { url: toAbsolute(actor.url, siteUrl) };
    if (actor.role) item.role = actor.role;
    out.push(item);
  }
  return out.length > 0 ? out : undefined;
}

/** Resolves `article:*`, absolutizing author URLs and dates */
function resolveArticle(
  article: OpenGraphArticle | undefined,
  siteUrl: string,
): ResolvedOpenGraphArticle | undefined {
  if (!article) return undefined;
  const out: ResolvedOpenGraphArticle = {};
  const publishedTime = toIsoDate(article.publishedTime);
  if (publishedTime) out.publishedTime = publishedTime;
  const modifiedTime = toIsoDate(article.modifiedTime);
  if (modifiedTime) out.modifiedTime = modifiedTime;
  const expirationTime = toIsoDate(article.expirationTime);
  if (expirationTime) out.expirationTime = expirationTime;
  const author = urlList(article.author, siteUrl);
  if (author) out.author = author;
  if (article.section) out.section = article.section;
  const tag = stringList(article.tag);
  if (tag) out.tag = tag;
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Resolves `book:*`, absolutizing author URLs and dates */
function resolveBook(
  book: OpenGraphBook | undefined,
  siteUrl: string,
): ResolvedOpenGraphBook | undefined {
  if (!book) return undefined;
  const out: ResolvedOpenGraphBook = {};
  const author = urlList(book.author, siteUrl);
  if (author) out.author = author;
  if (book.isbn) out.isbn = book.isbn;
  const releaseDate = toIsoDate(book.releaseDate);
  if (releaseDate) out.releaseDate = releaseDate;
  const tag = stringList(book.tag);
  if (tag) out.tag = tag;
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Resolves `profile:*`, dropping blank fields */
function resolveProfile(
  profile: OpenGraphProfile | undefined,
): OpenGraphProfile | undefined {
  if (!profile) return undefined;
  const out: OpenGraphProfile = {};
  if (profile.firstName) out.firstName = profile.firstName;
  if (profile.lastName) out.lastName = profile.lastName;
  if (profile.username) out.username = profile.username;
  if (profile.gender) out.gender = profile.gender;
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Resolves `music:*`, absolutizing profile/album/song URLs and dates */
function resolveMusic(
  music: OpenGraphMusic | undefined,
  siteUrl: string,
): ResolvedOpenGraphMusic | undefined {
  if (!music) return undefined;
  const out: ResolvedOpenGraphMusic = {};
  if (music.duration !== undefined) out.duration = music.duration;
  const album = resolveMusicRefs(music.album, siteUrl);
  if (album) out.album = album;
  const musician = urlList(music.musician, siteUrl);
  if (musician) out.musician = musician;
  const song = resolveMusicRefs(music.song, siteUrl);
  if (song) out.song = song;
  const releaseDate = toIsoDate(music.releaseDate);
  if (releaseDate) out.releaseDate = releaseDate;
  const creator = urlList(music.creator, siteUrl);
  if (creator) out.creator = creator;
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Resolves `video:*`, absolutizing actor/director/writer/series URLs and dates */
function resolveVideo(
  video: OpenGraphVideo | undefined,
  siteUrl: string,
): ResolvedOpenGraphVideo | undefined {
  if (!video) return undefined;
  const out: ResolvedOpenGraphVideo = {};
  const actor = resolveVideoActors(video.actor, siteUrl);
  if (actor) out.actor = actor;
  const director = urlList(video.director, siteUrl);
  if (director) out.director = director;
  const writer = urlList(video.writer, siteUrl);
  if (writer) out.writer = writer;
  if (video.duration !== undefined) out.duration = video.duration;
  const releaseDate = toIsoDate(video.releaseDate);
  if (releaseDate) out.releaseDate = releaseDate;
  const tag = stringList(video.tag);
  if (tag) out.tag = tag;
  if (video.series) out.series = toAbsolute(video.series, siteUrl);
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Resolves `payment:*`, absolutizing (omg this word is so fun) success URL and date */
function resolvePayment(
  payment: OpenGraphPayment | undefined,
  siteUrl: string,
): ResolvedOpenGraphPayment | undefined {
  if (!payment) return undefined;
  const out: ResolvedOpenGraphPayment = {};
  if (payment.description) out.description = payment.description;
  if (payment.currency) out.currency = payment.currency;
  if (payment.amount !== undefined) out.amount = payment.amount;
  const expiresAt = toIsoDate(payment.expiresAt);
  if (expiresAt) out.expiresAt = expiresAt;
  if (payment.status) out.status = payment.status;
  if (payment.id) out.id = payment.id;
  if (payment.successUrl)
    out.successUrl = toAbsolute(payment.successUrl, siteUrl);
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Maps alternates to `og:locale` values, dropping the self locale and `x-default` obvi */
function deriveLocaleAlternates(
  alternates: HreflangAlternate[],
  selfLocale: string,
): string[] {
  const locales: string[] = [];
  for (const alternate of alternates) {
    const locale = languageTagToOgLocale(alternate.hreflang);
    if (!locale || locale === selfLocale || locales.includes(locale)) continue;
    locales.push(locale);
  }
  return locales;
}

/**
 * Builds the Open Graph information for a page (gasp, i thought it deleted the page /joke)
 *
 * Ref: https://ogp.me/
 */
export function resolveOpenGraph(
  page: ResolvedOptions["pageMeta"][string],
  site: ResolvedOptions["site"],
  fallback: {
    title: string;
    description?: string;
    canonical: string;
    image?: string;
    imageAlt?: string;
  },
  alternates: HreflangAlternate[],
  lang: string | undefined,
): ResolvedOpenGraphInfo {
  const openGraph = page.openGraph;
  const merged: OpenGraphInfo = { ...site.openGraph, ...openGraph };
  const locale =
    openGraph?.locale ??
    languageTagToOgLocale(lang) ??
    site.openGraph.locale;
  const localeAlternate = [
    ...new Set(
      openGraph?.localeAlternate ??
        site.openGraph.localeAlternate ??
        deriveLocaleAlternates(alternates, locale ?? ""),
    ),
  ];
  // fallback mixes page and site values
  const pick = <T>(
    pageOg: T | undefined,
    pageVal: unknown,
    siteOg: T | undefined,
    fb: T,
  ): T => pageOg ?? (pageVal !== undefined ? fb : siteOg ?? fb);

  return {
    ...merged,
    title: pick(openGraph?.title, page.title, site.openGraph?.title, fallback.title),
    description: pick(
      openGraph?.description,
      page.description,
      site.openGraph?.description,
      fallback.description,
    ),
    url: openGraph?.url ?? fallback.canonical,
    siteName: openGraph?.siteName ?? site.openGraph.siteName,
    locale,
    localeAlternate,
    image: absolutize(
      pick(openGraph?.image, page.image, site.openGraph?.image, fallback.image),
      site.url,
    ),
    imageAlt: pick(
      openGraph?.imageAlt,
      page.imageAlt,
      site.openGraph?.imageAlt,
      fallback.imageAlt,
    ),
    images: resolveMedia(openGraph?.images ?? site.openGraph.images, site.url),
    videos: resolveMedia(openGraph?.videos ?? site.openGraph.videos, site.url),
    audios: resolveMedia(openGraph?.audios ?? site.openGraph.audios, site.url),
    article: resolveArticle(merged.article, site.url),
    book: resolveBook(merged.book, site.url),
    profile: resolveProfile(merged.profile),
    music: resolveMusic(merged.music, site.url),
    video: resolveVideo(merged.video, site.url),
    payment: resolvePayment(merged.payment, site.url),
  };
}

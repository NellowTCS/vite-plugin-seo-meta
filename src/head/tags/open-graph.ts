/** Open Graph (`property="og:*"`) tags */

import { metaKey } from "../../html/key";
import { resolveImage } from "../../images/resolveImage";
import type {
  HeadTag,
  ImageInput,
  ImageRef,
  ResolvedOpenGraphInfo,
  ResolvedPage,
} from "../../types";

/** Builds a `<meta property content>` tag */
function ogTag(property: string, content: string): HeadTag {
  return { tag: "meta", attrs: { property, content }, key: metaKey(property) };
}

/** Resolves a media array, skipping entries without a URL */
function mediaRefs(media: ImageInput[] | undefined): ImageRef[] {
  const refs: ImageRef[] = [];
  for (const entry of media ?? []) {
    const ref = resolveImage(entry);
    if (ref) refs.push(ref);
  }
  return refs;
}

/**
 * Media groups
 */
function mediaTags(
  root: string,
  ref: ImageRef,
  opts: { dimensions: boolean; alt: boolean },
): HeadTag[] {
  const tags: HeadTag[] = [];
  tags.push(ogTag(root, ref.src));
  if (ref.secureUrl) tags.push(ogTag(`${root}:secure_url`, ref.secureUrl));
  if (ref.type) tags.push(ogTag(`${root}:type`, ref.type));
  if (opts.dimensions) {
    if (ref.width !== undefined) tags.push(ogTag(`${root}:width`, String(ref.width)));
    if (ref.height !== undefined) tags.push(ogTag(`${root}:height`, String(ref.height)));
  }
  if (opts.alt && ref.alt) tags.push(ogTag(`${root}:alt`, ref.alt));
  return tags;
}

/** Emits the type-specific (`article` / `book` / ...) properties */
function typedTags(og: ResolvedOpenGraphInfo): HeadTag[] {
  const tags: HeadTag[] = [];

  const article = og.article;
  if (article) {
    if (article.publishedTime) tags.push(ogTag("article:published_time", article.publishedTime));
    if (article.modifiedTime) tags.push(ogTag("article:modified_time", article.modifiedTime));
    if (article.expirationTime) tags.push(ogTag("article:expiration_time", article.expirationTime));
    for (const author of article.author ?? []) tags.push(ogTag("article:author", author));
    if (article.section) tags.push(ogTag("article:section", article.section));
    for (const tag of article.tag ?? []) tags.push(ogTag("article:tag", tag));
  }

  const book = og.book;
  if (book) {
    for (const author of book.author ?? []) tags.push(ogTag("book:author", author));
    if (book.isbn) tags.push(ogTag("book:isbn", book.isbn));
    if (book.releaseDate) tags.push(ogTag("book:release_date", book.releaseDate));
    for (const tag of book.tag ?? []) tags.push(ogTag("book:tag", tag));
  }

  const profile = og.profile;
  if (profile) {
    if (profile.firstName) tags.push(ogTag("profile:first_name", profile.firstName));
    if (profile.lastName) tags.push(ogTag("profile:last_name", profile.lastName));
    if (profile.username) tags.push(ogTag("profile:username", profile.username));
    if (profile.gender) tags.push(ogTag("profile:gender", profile.gender));
  }

  const music = og.music;
  if (music) {
    if (music.duration !== undefined) tags.push(ogTag("music:duration", String(music.duration)));
    for (const album of music.album ?? []) {
      tags.push(ogTag("music:album", album.url));
      if (album.disc !== undefined) tags.push(ogTag("music:album:disc", String(album.disc)));
      if (album.track !== undefined) tags.push(ogTag("music:album:track", String(album.track)));
    }
    for (const musician of music.musician ?? []) tags.push(ogTag("music:musician", musician));
    for (const song of music.song ?? []) {
      tags.push(ogTag("music:song", song.url));
      if (song.disc !== undefined) tags.push(ogTag("music:song:disc", String(song.disc)));
      if (song.track !== undefined) tags.push(ogTag("music:song:track", String(song.track)));
    }
    if (music.releaseDate) tags.push(ogTag("music:release_date", music.releaseDate));
    for (const creator of music.creator ?? []) tags.push(ogTag("music:creator", creator));
  }

  const video = og.video;
  if (video) {
    for (const actor of video.actor ?? []) {
      tags.push(ogTag("video:actor", actor.url));
      if (actor.role) tags.push(ogTag("video:actor:role", actor.role));
    }
    for (const director of video.director ?? []) tags.push(ogTag("video:director", director));
    for (const writer of video.writer ?? []) tags.push(ogTag("video:writer", writer));
    if (video.duration !== undefined) tags.push(ogTag("video:duration", String(video.duration)));
    if (video.releaseDate) tags.push(ogTag("video:release_date", video.releaseDate));
    for (const tag of video.tag ?? []) tags.push(ogTag("video:tag", tag));
    if (video.series) tags.push(ogTag("video:series", video.series));
  }

  const payment = og.payment;
  if (payment) {
    if (payment.description) tags.push(ogTag("payment:description", payment.description));
    if (payment.currency) tags.push(ogTag("payment:currency", payment.currency));
    if (payment.amount !== undefined) tags.push(ogTag("payment:amount", String(payment.amount)));
    if (payment.expiresAt) tags.push(ogTag("payment:expires_at", payment.expiresAt));
    if (payment.status) tags.push(ogTag("payment:status", payment.status));
    if (payment.id) tags.push(ogTag("payment:id", payment.id));
    if (payment.successUrl) tags.push(ogTag("payment:success_url", payment.successUrl));
  }

  return tags;
}

/** Builds the Open Graph meta tags for a page */
export function openGraphTags(page: ResolvedPage): HeadTag[] {
  const og = page.openGraph;
  const tags: HeadTag[] = [];
  if (og.type) tags.push(ogTag("og:type", og.type));
  if (og.title) tags.push(ogTag("og:title", og.title));
  if (og.description) tags.push(ogTag("og:description", og.description));
  if (og.url) tags.push(ogTag("og:url", og.url));
  if (og.siteName) tags.push(ogTag("og:site_name", og.siteName));
  if (og.determiner) tags.push(ogTag("og:determiner", og.determiner));
  if (og.locale) tags.push(ogTag("og:locale", og.locale));
  for (const locale of og.localeAlternate ?? []) tags.push(ogTag("og:locale:alternate", locale));

  const images = mediaRefs(og.images);
  if (images.length > 0) {
    for (const ref of images) tags.push(...mediaTags("og:image", ref, { dimensions: true, alt: true }));
  } else if (og.image) {
    tags.push(ogTag("og:image", og.image));
    if (og.imageAlt) tags.push(ogTag("og:image:alt", og.imageAlt));
    if (og.imageWidth !== undefined) tags.push(ogTag("og:image:width", String(og.imageWidth)));
    if (og.imageHeight !== undefined) tags.push(ogTag("og:image:height", String(og.imageHeight)));
  }

  for (const ref of mediaRefs(og.videos)) {
    tags.push(...mediaTags("og:video", ref, { dimensions: true, alt: true }));
  }
  for (const ref of mediaRefs(og.audios)) {
    tags.push(...mediaTags("og:audio", ref, { dimensions: false, alt: false }));
  }

  tags.push(...typedTags(og));
  return tags;
}

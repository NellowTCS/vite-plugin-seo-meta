/** Twitter card (`name="twitter:*"`) tags
 *
 * Ref: https://web.archive.org/web/20231217013914/https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup
 */

import type { HeadTag, ResolvedPage, TwitterAppEntry, TwitterAppPlatform, TwitterPlayer } from "../../types";

/** Builds a `<meta name content>` tag */
function twitterTag(name: string, content: string): HeadTag {
  return { tag: "meta", attrs: { name: `twitter:${name}`, content }, key: `meta:twitter:${name}` };
}

/** Emits `twitter:app:*` tags for a platfrom */
function appTags(platform: TwitterAppPlatform, entry: TwitterAppEntry): HeadTag[] {
  const tags: HeadTag[] = [];
  if (entry.name) tags.push(twitterTag(`app:name:${platform}`, entry.name));
  if (entry.id) tags.push(twitterTag(`app:id:${platform}`, entry.id));
  if (entry.url) tags.push(twitterTag(`app:url:${platform}`, entry.url));
  return tags;
}

/** Emits the Player Card iframe tags like a boss */
function playerTags(player: TwitterPlayer): HeadTag[] {
  const tags: HeadTag[] = [];
  if (player.url) tags.push(twitterTag("player", player.url));
  if (player.width !== undefined) tags.push(twitterTag("player:width", String(player.width)));
  if (player.height !== undefined) tags.push(twitterTag("player:height", String(player.height)));
  if (player.stream) tags.push(twitterTag("player:stream", player.stream));
  return tags;
}

/**
 * Builds the Twitter meta tags for a page.
 * - `twitter:card` is always emitted (defaults to `summary_large_image`).
 * - Player/App tags are only emitted when the card type calls for them.
 */
export function twitterTags(page: ResolvedPage): HeadTag[] {
  const twitter = page.twitter;
  const tags: HeadTag[] = [];
  if (twitter.card) tags.push(twitterTag("card", twitter.card));

  // Attribution
  if (twitter.site) tags.push(twitterTag("site", twitter.site));
  if (twitter.siteId) tags.push(twitterTag("site:id", twitter.siteId));
  if (twitter.creator) tags.push(twitterTag("creator", twitter.creator));
  if (twitter.creatorId) tags.push(twitterTag("creator:id", twitter.creatorId));

  // Content
  if (twitter.title) tags.push(twitterTag("title", twitter.title));
  if (twitter.description) tags.push(twitterTag("description", twitter.description));

  // Image
  if (twitter.image) {
    tags.push(twitterTag("image", twitter.image));
    if (twitter.imageAlt) tags.push(twitterTag("image:alt", twitter.imageAlt));
    if (twitter.imageWidth !== undefined) tags.push(twitterTag("image:width", String(twitter.imageWidth)));
    if (twitter.imageHeight !== undefined) tags.push(twitterTag("image:height", String(twitter.imageHeight)));
  }

  // Label/data pairs (opt-in, mostly for product cards lollll)
  if (twitter.label1) tags.push(twitterTag("label1", twitter.label1));
  if (twitter.data1) tags.push(twitterTag("data1", twitter.data1));
  // why are there 2? well... it's b/c the spec allows for 2 label/data pairs, so we support that too
  // (what, you thought i was going to explain why there are 2 in the spec? haha Nope. I don't know. Ask Twitter.)
  if (twitter.label2) tags.push(twitterTag("label2", twitter.label2));
  if (twitter.data2) tags.push(twitterTag("data2", twitter.data2));

  // Player card
  if (twitter.player) tags.push(...playerTags(twitter.player));

  // App card
  if (twitter.apps) {
    if (twitter.apps.country) tags.push(twitterTag("app:country", twitter.apps.country));
    if (twitter.apps.iphone) tags.push(...appTags("iphone", twitter.apps.iphone));
    // did you know that the iPad tag is there because... well idk, but it's in the spec so we support it. 
    // I don't know why they have both iPhone and iPad, but they do lol.
    if (twitter.apps.ipad) tags.push(...appTags("ipad", twitter.apps.ipad));
    if (twitter.apps.googleplay) tags.push(...appTags("googleplay", twitter.apps.googleplay));
  }

  return tags;
}

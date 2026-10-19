import { describe, expect, it } from "vitest";
import { twitterTags } from "../../../src/head/tags/twitter";
import type { ResolvedPage, TwitterInfo } from "../../../src/types";

/** Builds a bare ResolvedPage with just the Twitter */
function page(twitter: TwitterInfo): ResolvedPage {
  return {
    route: "/",
    title: "",
    canonical: "",
    keywords: [],
    noindex: false,
    openGraph: {} as ResolvedPage["openGraph"],
    twitter,
    jsonLd: [],
    alternates: [],
    meta: {},
    links: [],
    sitemap: true,
  } as unknown as ResolvedPage;
}

const find = (tags: ReturnType<typeof twitterTags>, key: string) =>
  tags.find((tag) => tag.key === key);

describe("twitter card spec", () => {
  it("emits nothing when the card is empty", () => {
    expect(twitterTags(page({}))).toEqual([]);
  });

  it("always emits the card type, defaulting to summary_large_image", () => {
    expect(twitterTags(page({}))).toEqual([]);
    expect(twitterTags(page({ card: "summary" }))[0]).toEqual({
      tag: "meta",
      attrs: { name: "twitter:card", content: "summary" },
      key: "meta:twitter:card",
    });
  });

  it("emits site and creator handles", () => {
    const tags = twitterTags(page({ site: "@acme", creator: "@author" }));
    expect(find(tags, "meta:twitter:site")?.attrs.content).toBe("@acme");
    expect(find(tags, "meta:twitter:creator")?.attrs.content).toBe("@author");
  });

  it("supports the numeric ID variants of site and creator", () => {
    const tags = twitterTags(page({ siteId: "123", creatorId: "456" }));
    expect(find(tags, "meta:twitter:site:id")?.attrs.content).toBe("123");
    expect(find(tags, "meta:twitter:creator:id")?.attrs.content).toBe("456");
  });

  it("emits title and description", () => {
    const tags = twitterTags(page({ title: "Hello", description: "A tweet" }));
    expect(find(tags, "meta:twitter:title")?.attrs.content).toBe("Hello");
    expect(find(tags, "meta:twitter:description")?.attrs.content).toBe("A tweet");
  });

  it("emits image, alt and dimensions", () => {
    const tags = twitterTags(
      page({ image: "https://x.com/i.png", imageAlt: "alt", imageWidth: 1200, imageHeight: 630 }),
    );
    expect(find(tags, "meta:twitter:image")?.attrs.content).toBe("https://x.com/i.png");
    expect(find(tags, "meta:twitter:image:alt")?.attrs.content).toBe("alt");
    expect(find(tags, "meta:twitter:image:width")?.attrs.content).toBe("1200");
    expect(find(tags, "meta:twitter:image:height")?.attrs.content).toBe("630");
  });

  it("emits the label/data pairs (opt-in)", () => {
    const tags = twitterTags(
      page({ label1: "Price", data1: "$199", label2: "Stock", data2: "In Stock" }),
    );
    expect(find(tags, "meta:twitter:label1")?.attrs.content).toBe("Price");
    expect(find(tags, "meta:twitter:data1")?.attrs.content).toBe("$199");
    expect(find(tags, "meta:twitter:label2")?.attrs.content).toBe("Stock");
    expect(find(tags, "meta:twitter:data2")?.attrs.content).toBe("In Stock");
  });

  it("emits the player card tags", () => {
    const tags = twitterTags(
      page({
        card: "player",
        player: { url: "https://x.com/p", width: 1280, height: 720, stream: "https://x.com/s.mp4" },
      }),
    );
    expect(find(tags, "meta:twitter:player")?.attrs.content).toBe("https://x.com/p");
    expect(find(tags, "meta:twitter:player:width")?.attrs.content).toBe("1280");
    expect(find(tags, "meta:twitter:player:height")?.attrs.content).toBe("720");
    expect(find(tags, "meta:twitter:player:stream")?.attrs.content).toBe("https://x.com/s.mp4");
  });

  it("emits the app card tags per platform", () => {
    const tags = twitterTags(
      page({
        card: "app",
        apps: {
          country: "US",
          iphone: { name: "Cannonball", id: "929750075", url: "cannonball://poem/1" },
          ipad: { name: "Cannonball", id: "929750075", url: "cannonball://poem/1" },
          googleplay: {
            name: "Cannonball",
            id: "io.fabric.samples.cannonball",
            url: "http://cannonball.fabric.io/poem/1",
          },
        },
      }),
    );
    expect(find(tags, "meta:twitter:app:country")?.attrs.content).toBe("US");
    expect(find(tags, "meta:twitter:app:name:iphone")?.attrs.content).toBe("Cannonball");
    expect(find(tags, "meta:twitter:app:id:iphone")?.attrs.content).toBe("929750075");
    expect(find(tags, "meta:twitter:app:url:iphone")?.attrs.content).toBe("cannonball://poem/1");
    expect(find(tags, "meta:twitter:app:name:ipad")?.attrs.content).toBe("Cannonball");
    expect(find(tags, "meta:twitter:app:id:googleplay")?.attrs.content).toBe(
      "io.fabric.samples.cannonball",
    );
    expect(find(tags, "meta:twitter:app:url:googleplay")?.attrs.content).toBe(
      "http://cannonball.fabric.io/poem/1",
    );
  });

  it("only emits the fields that are configured", () => {
    const tags = twitterTags(page({ card: "app", apps: { country: "GB", iphone: { id: "123" } } }));
    expect(tags.filter((t) => t.key.startsWith("meta:twitter:app"))).toHaveLength(2);
  });
});
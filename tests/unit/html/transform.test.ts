import { describe, expect, it } from "vitest";
import { injectHeadTags } from "../../../src/html/transform";
import type { HeadTag } from "../../../src/types";
import { countOccurrences } from "../../helpers/html";

const HTML =
  '<!doctype html><html><head><title>old</title><meta name="description" content="old"><link rel="preconnect" href="https://cdn.example.com"></head><body></body></html>';

const TAGS: HeadTag[] = [
  { tag: "title", attrs: {}, text: "Home", key: "title" },
  {
    tag: "meta",
    attrs: { name: "description", content: "fresh" },
    key: "meta:description",
  },
  {
    tag: "link",
    attrs: { rel: "canonical", href: "https://example.com/" },
    key: "link:canonical",
  },
];

describe("injectHeadTags", () => {
  it("replaces managed tags rather than appending", () => {
    const output = injectHeadTags(HTML, TAGS);

    expect(output).toContain("<title>Home</title>");
    expect(output).not.toContain("old");
    expect(countOccurrences(output, "<title")).toBe(1);
    expect(countOccurrences(output, 'name="description"')).toBe(1);
  });

  it("leaves unmanaged head elements alone", () => {
    const output = injectHeadTags(HTML, TAGS);

    expect(output).toContain('rel="preconnect"');
    expect(output).toContain('href="https://cdn.example.com"');
  });

  it("is idempotent", () => {
    const once = injectHeadTags(HTML, TAGS);
    const twice = injectHeadTags(once, TAGS);

    expect(twice).toBe(once);
  });

  it("indents injected tags to match a pretty-printed head", () => {
    const pretty =
      '<!doctype html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>old</title>\n</head>\n<body></body>\n</html>';
    const output = injectHeadTags(pretty, TAGS);

    expect(output).toContain("\n  <title>Home</title>");
    expect(output).toContain('\n  <meta name="description" content="fresh">');
    expect(output).toContain("\n</head>");
    expect(output).not.toContain("\n\n");
  });

  it("is idempotent on a pretty-printed head", () => {
    const pretty =
      '<!doctype html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>old</title>\n</head>\n<body></body>\n</html>';

    expect(injectHeadTags(injectHeadTags(pretty, TAGS), TAGS)).toBe(
      injectHeadTags(pretty, TAGS),
    );
  });

  it("skips onlyIfMissing tags that already exist", () => {
    const tags: HeadTag[] = [
      {
        tag: "meta",
        attrs: { name: "theme-color", content: "#fff" },
        key: "meta:theme-color",
        onlyIfMissing: true,
      },
    ];
    const html =
      '<html><head><meta name="theme-color" content="#000"></head><body></body></html>';

    const output = injectHeadTags(html, tags);

    expect(output).toContain('content="#000"');
    expect(output).not.toContain('content="#fff"');
  });

  it("replaces a property= og tag whose key carries the content", () => {
    const tags: HeadTag[] = [
      {
        tag: "meta",
        attrs: { property: "og:image", content: "/page.png" },
        key: "meta:og:image:/page.png",
      },
    ];
    const html =
      '<html><head><meta property="og:image" content="/default.png"></head><body></body></html>';

    const output = injectHeadTags(html, tags);

    expect(countOccurrences(output, "og:image")).toBe(1);
    expect(output).toContain('content="/page.png"');
  });

  it("skips an onlyIfMissing og tag whose key carries the content", () => {
    const tags: HeadTag[] = [
      {
        tag: "meta",
        attrs: { property: "og:title", content: "New" },
        key: "meta:og:title:New",
        onlyIfMissing: true,
      },
    ];
    const html =
      '<html><head><meta property="og:title" content="Existing"></head><body></body></html>';

    const output = injectHeadTags(html, tags);

    expect(countOccurrences(output, "og:title")).toBe(1);
    expect(output).toContain('content="Existing"');
  });

  it("keeps several og:image tags from one page render", () => {
    const tags: HeadTag[] = [
      {
        tag: "meta",
        attrs: { property: "og:image", content: "/one.png" },
        key: "meta:og:image:/one.png",
      },
      {
        tag: "meta",
        attrs: { property: "og:image", content: "/two.png" },
        key: "meta:og:image:/two.png",
      },
    ];
    const html = "<html><head></head><body></body></html>";

    const output = injectHeadTags(html, tags);

    expect(countOccurrences(output, "og:image")).toBe(2);
  });

  it("injects into an empty head", () => {
    const html = "<html><head></head><body></body></html>";

    const output = injectHeadTags(html, TAGS);

    expect(countOccurrences(output, "<title")).toBe(1);
  });

  it("adds onlyIfMissing tags that are absent", () => {
    const tags: HeadTag[] = [
      {
        tag: "meta",
        attrs: { name: "theme-color", content: "#fff" },
        key: "meta:theme-color",
        onlyIfMissing: true,
      },
    ];

    const output = injectHeadTags(HTML, tags);

    expect(output).toContain('name="theme-color"');
    expect(output).toContain('content="#fff"');
  });

  it("injects into a synthesized head when the template has none", () => {
    const html = "<html><body><p>no head here</p></body></html>";

    const output = injectHeadTags(html, TAGS);

    expect(countOccurrences(output, "<title")).toBe(1);
    expect(output).toContain("<p>no head here</p>");
  });
});

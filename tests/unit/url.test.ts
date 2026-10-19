import { describe, expect, it } from "vitest";
import {
  isAbsoluteUrl,
  normalizeRoute,
  normalizeSiteUrl,
  routeFromHtmlFile,
  toAbsolute,
} from "../../src/url";

describe("isAbsoluteUrl", () => {
  it("accepts http and https", () => {
    expect(isAbsoluteUrl("https://example.com")).toBe(true);
    expect(isAbsoluteUrl("http://example.com/a")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(isAbsoluteUrl("/a")).toBe(false);
    expect(isAbsoluteUrl("example.com")).toBe(false);
    expect(isAbsoluteUrl("mailto:a@b.com")).toBe(false);
  });
});

describe("normalizeSiteUrl", () => {
  it("strips trailing slashes but keeps the path", () => {
    expect(normalizeSiteUrl("https://example.com/")).toBe(
      "https://example.com",
    );
    expect(normalizeSiteUrl("https://example.com/base/")).toBe(
      "https://example.com/base",
    );
  });

  it("throws on invalid or non-http values", () => {
    expect(() => normalizeSiteUrl("nope")).toThrow();
    expect(() => normalizeSiteUrl("ftp://example.com")).toThrow();
  });
});

describe("toAbsolute", () => {
  it("passes absolute urls through", () => {
    expect(toAbsolute("https://other.com/x", "https://example.com")).toBe(
      "https://other.com/x",
    );
  });

  it("joins root-relative paths onto the site", () => {
    expect(toAbsolute("/og.png", "https://example.com")).toBe(
      "https://example.com/og.png",
    );
  });

  it("keeps the protocol on protocol-relative urls", () => {
    expect(toAbsolute("//cdn.example.com/x", "https://example.com")).toBe(
      "https://cdn.example.com/x",
    );
  });
});

describe("normalizeRoute", () => {
  it("normalizes files, slashes and suffixes", () => {
    expect(normalizeRoute("")).toBe("/");
    expect(normalizeRoute("about")).toBe("/about");
    expect(normalizeRoute("/about/")).toBe("/about");
    expect(normalizeRoute("/index.html")).toBe("/");
    expect(normalizeRoute("/about.html")).toBe("/about");
    expect(normalizeRoute("//a//b")).toBe("/a/b");
  });

  it("drops the query and hash", () => {
    expect(normalizeRoute("/a?b=c")).toBe("/a");
    expect(normalizeRoute("/a#frag")).toBe("/a");
  });
});

describe("routeFromHtmlFile", () => {
  it("maps entry files to routes relative to the root", () => {
    expect(routeFromHtmlFile("/site/about.html", "/site")).toBe("/about");
    expect(routeFromHtmlFile("/site/blog/post.html", "/site")).toBe(
      "/blog/post",
    );
    expect(routeFromHtmlFile("/site/index.html", "/site")).toBe("/");
  });
});

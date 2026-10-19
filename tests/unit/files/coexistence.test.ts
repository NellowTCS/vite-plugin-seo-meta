import { describe, expect, it } from "vitest";
import {
  findRobotsProvider,
  findSitemapProvider,
} from "../../../src/files/coexistence";

const plugin = (name: string) => ({ name });

describe("findSitemapProvider", () => {
  it("finds well-known sitemap plugins", () => {
    expect(findSitemapProvider([plugin("vite-plugin-sitemap")])).toBe(
      "vite-plugin-sitemap",
    );
    expect(findSitemapProvider([plugin("vite-plugin-pwa")])).toBe(
      "vite-plugin-pwa",
    );
    expect(findSitemapProvider([plugin("vite-plugin-seo-files")])).toBe(
      "vite-plugin-seo-files",
    );
  });

  it("finds any plugin whose name mentions a sitemap", () => {
    expect(
      findSitemapProvider([plugin("vite"), plugin("vite-sitemap-plugin")]),
    ).toBe("vite-sitemap-plugin");
  });

  it("returns undefined when nothing else generates a sitemap", () => {
    expect(
      findSitemapProvider([plugin("vite"), plugin("@vitejs/plugin-react")]),
    ).toBeUndefined();
  });

  it("does not match our own plugin", () => {
    expect(
      findSitemapProvider([plugin("vite-plugin-seo-meta")]),
    ).toBeUndefined();
  });
});

describe("findRobotsProvider", () => {
  it("finds well-known robots plugins", () => {
    expect(findRobotsProvider([plugin("vite-plugin-robots")])).toBe(
      "vite-plugin-robots",
    );
    expect(findRobotsProvider([plugin("vite-robots-txt")])).toBe(
      "vite-robots-txt",
    );
  });

  it("treats vite-plugin-sitemap as a robots provider", () => {
    expect(findRobotsProvider([plugin("vite-plugin-sitemap")])).toBe(
      "vite-plugin-sitemap",
    );
  });

  it("returns undefined when nothing else writes robots.txt", () => {
    expect(
      findRobotsProvider([plugin("vite"), plugin("@vitejs/plugin-react")]),
    ).toBeUndefined();
  });

  it("does not match our own plugin", () => {
    expect(
      findRobotsProvider([plugin("vite-plugin-seo-meta")]),
    ).toBeUndefined();
  });
});

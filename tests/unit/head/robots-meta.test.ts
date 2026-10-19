import { describe, expect, it } from "vitest";
import { renderRobotsMeta } from "../../../src/head/robots-meta";

describe("renderRobotsMeta", () => {
  it("passes strings through, trimmed", () => {
    expect(renderRobotsMeta("  noindex, nofollow  ")).toBe("noindex, nofollow");
    expect(renderRobotsMeta("")).toBeUndefined();
    expect(renderRobotsMeta(undefined)).toBeUndefined();
  });

  it("skips directives that are false or absent", () => {
    expect(
      renderRobotsMeta({ noindex: false, nofollow: undefined }),
    ).toBeUndefined();
    expect(renderRobotsMeta({})).toBeUndefined();
  });

  it("renders the index directives first in a stable order", () => {
    expect(
      renderRobotsMeta({
        nosnippet: true,
        nofollow: true,
        noindex: true,
        none: true,
        noimageindex: true,
      }),
    ).toBe("none, noindex, nofollow, nosnippet, noimageindex");
  });

  it("renders budgets and legacy directives", () => {
    expect(
      renderRobotsMeta({
        maxSnippet: -1,
        maxImagePreview: "standard",
        maxVideoPreview: 0,
        noarchive: true,
        nositelinkssearchbox: true,
        notranslate: true,
        indexifembedded: true,
      }),
    ).toBe(
      "notranslate, indexifembedded, noarchive, nositelinkssearchbox, " +
        "max-snippet:-1, max-image-preview:standard, max-video-preview:0",
    );
  });

  it("formats unavailable_after from a Date and skips blank strings", () => {
    expect(
      renderRobotsMeta({
        unavailableAfter: new Date("2026-01-02T03:04:05.000Z"),
      }),
    ).toBe("unavailable_after:2026-01-02T03:04:05.000Z");
    expect(renderRobotsMeta({ unavailableAfter: "2026-01-02" })).toBe(
      "unavailable_after:2026-01-02",
    );
    expect(renderRobotsMeta({ unavailableAfter: "  " })).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { resolveImage } from "../../../src/images/resolveImage";

describe("resolveImage", () => {
  it("keeps video-specific sitemap fields", () => {
    expect(
      resolveImage({
        src: " /clip.mp4 ",
        thumbnail: " /thumb.jpg ",
        title: " Clip ",
        description: " Description ",
        playerLoc: " /embed/1 ",
        player_loc: "/ignored",
      }),
    ).toEqual({
      src: "/clip.mp4",
      thumbnail: "/thumb.jpg",
      title: "Clip",
      description: "Description",
      playerLoc: "/embed/1",
    });
  });

  it("drops blank video fields", () => {
    expect(
      resolveImage({
        src: "/clip.mp4",
        title: "  ",
        description: "",
        playerLoc: " ",
      }),
    ).toEqual({ src: "/clip.mp4" });
  });
});

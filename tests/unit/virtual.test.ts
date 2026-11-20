import { describe, expect, it } from "vitest";
import { resolveOptions } from "../../src/config/resolve";
import { renderConfigModule } from "../../src/virtual";

describe("renderConfigModule", () => {
  const options = resolveOptions(
    {
      site: { url: "https://example.com" },
      pages: { "/about": { title: "About" } },
    },
    {},
  );

  const source = renderConfigModule(options);

  it("renders a valid TypeScript module", () => {
    expect(source).toContain("export const site =");
    expect(source).toContain("export const pages =");
    expect(source).toContain("export default site;");
  });

  it("exports the resolved site", () => {
    expect(source).toContain("export const site =");
    expect(source).toContain("export default site;");
  });

  it("exports page metadata for the SvelteKit hook", () => {
    expect(source).toContain("export const pages =");
    expect(source).toContain('"/about":{"title":"About"}');
  });
});

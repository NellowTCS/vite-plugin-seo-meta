import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    runtime: "src/runtime.ts",
  },
  format: ["esm", "cjs"],
  outExtensions({ format }) {
    const esm = format === "es";
    return {
      js: esm ? ".js" : ".cjs",
      dts: esm ? ".d.ts" : ".d.cts",
    };
  },
  target: "node20",
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  deps: {
    neverBundle: [/^virtual:/],
  },
});

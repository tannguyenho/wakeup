import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: "esm",
  target: "node22",
  clean: true,
  // @wakeup/core là mã nguồn TypeScript trong workspace nên phải gộp vào bundle.
  noExternal: ["@wakeup/core"],
});

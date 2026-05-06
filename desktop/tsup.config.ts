import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["electron/main.ts", "electron/preload.ts"],
  format: ["cjs"],
  target: "node22",
  platform: "node",
  sourcemap: true,
  clean: true,
  outDir: "dist-electron",
  external: ["electron", "node-pty"],
});

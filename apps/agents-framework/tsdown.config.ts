import { defineConfig } from "vite-plus/pack";

export default defineConfig({
  clean: true,
  dts: {
    tsgo: true,
  },
  entry: ["src/index.ts", "src/cli.ts"],
  exports: true,
  format: ["esm"],
  platform: "node",
});

import { defineConfig } from "vite-plus";

const isCheck = process.argv.includes("check");

export default defineConfig({
  fmt: {
    ignorePatterns: ["dist/**"],
  },
  ...(isCheck
    ? {}
    : {
        pack: {
          clean: true,
          dts: {
            tsgo: true,
          },
          entry: ["src/index.ts", "src/cli.ts"],
          exports: true,
          format: ["esm"],
          platform: "node",
        },
      }),
});

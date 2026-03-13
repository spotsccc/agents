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
          dts: {
            tsgo: true,
          },
          exports: true,
        },
      }),
});

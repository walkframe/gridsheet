import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(() => ({
  plugins: [dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: {
        index: "./src/index.ts",
        "math/index": "./src/math/index.ts",
        "statistics/index": "./src/statistics/index.ts",
        "text/index": "./src/text/index.ts",
        "lookup/index": "./src/lookup/index.ts",
        "time/index": "./src/time/index.ts",
      },
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: "dist",
    rollupOptions: {
      external: [/^@gridsheet\/core/, /^dayjs/],
      output: {
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: "esbuild",
  },
}));

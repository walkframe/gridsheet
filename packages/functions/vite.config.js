import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => ({
  plugins: [dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: {
        index: "./src/index.ts",
        "math/index": "./src/math/index.ts",
        "statistics/index": "./src/statistics/index.ts",
        "string/index": "./src/string/index.ts",
        "lookup/index": "./src/lookup/index.ts",
        "time/index": "./src/time/index.ts",
      },
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: "dist",
    rollupOptions: {
      external: ["@gridsheet/react-core"],
      output: {
        preserveModules: false,
      },
    },
    sourcemap: mode === "development",
    minify: mode === "development" ? false : "esbuild",
  },
}));

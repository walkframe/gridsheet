import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(() => ({
  plugins: [dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: {
        index: "./src/index.ts",
      },
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: "dist",
    rollupOptions: {
      // @gridsheet/* is a peer dep; fflate is a runtime dependency resolved by the consumer.
      external: [/^@gridsheet\//, "fflate"],
      output: {
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: "esbuild",
  },
}));

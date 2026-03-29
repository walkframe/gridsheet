import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(() => ({
  plugins: [dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: {
        index: "./src/index.ts",
      },
      name: "GridSheetCore",
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    rollupOptions: {
      external: [/^dayjs/],
      output: {
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: "esbuild",
  },
}));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig(() => ({
  plugins: [react(), dts({ insertTypesEntry: true, exclude: ['**/*.spec.ts', '**/*.spec.tsx'] })],
  build: {
    lib: {
      entry: {
        index: "./src/index.ts",
      },
      name: "GridSheetDev",
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    rollupOptions: {
      external: [/^react/, /^@?react-dom/, /^@gridsheet\/core/],
      output: {
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: "esbuild",
  },
}));

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
      // Keep react / react-dom (and their subpaths) external as peer deps, but do NOT
      // match react-syntax-highlighter with a loose /^react/ — it must be bundled in.
      // Left external, its ESM language files import highlight.js language modules without
      // a .js extension, which Node's strict ESM resolver rejects when a consumer SSRs the
      // Debugger (e.g. the docs site). Bundling it lets this build's resolver add the
      // extension and inline the @babel/runtime helpers.
      external: [/^react(\/|$)/, /^react-dom(\/|$)/, /^@gridsheet\/core/],
      output: {
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: "esbuild",
  },
}));

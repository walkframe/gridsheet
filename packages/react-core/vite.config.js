import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => ({
  plugins: [react(), dts({ insertTypesEntry: true, exclude: ['**/*.spec.ts', '**/*.spec.tsx'] })],
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "GridSheet",
      formats: ["es"],
      fileName: (_, name) => `${name}.js`,
    },
    outDir: 'dist',
    rollupOptions: {
      external: [/^react/, /^@?react-dom/, "@gridsheet/react-core"],
      output: {
        preserveModules: false,
        //preserveModulesRoot: process.cwd(),
      },
    },
    sourcemap: mode === "development",
    minify: mode === "development" ? false : "esbuild",
  },
}));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig(() => ({
  plugins: [react(), dts({ insertTypesEntry: true, exclude: ['**/*.spec.ts', '**/*.spec.tsx'], tsconfigPath: './tsconfig.build.json' })],
  build: {
    lib: {
      entry: {
        index: "./src/index.ts",
        spellbook: "./src/spellbook.ts",
      },
      name: "GridSheet",
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    rollupOptions: {
      external: [/^react/, /^@?react-dom/, /^@gridsheet\/core/, /^@gridsheet\/functions/, /^dayjs/],
      output: {
        preserveModules: false,
        //preserveModulesRoot: process.cwd(),
      },
    },
    sourcemap: true,
    minify: "esbuild",
  },
}));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => ({
  plugins: [react(), dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: "./index.ts",
      name: "GridSheet",
      formats: ["es"],
      fileName: (_, name) => `${name}.js`,
    },
    outDir: 'dist',
    rollupOptions: {
      external: (id) => {
        return (
          /^react/.test(id) ||
          /^@?react-dom/.test(id) ||
          id === 'dayjs' ||
          id.startsWith('dayjs/plugin/')
        );
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: process.cwd(),
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    sourcemap: mode === "development",
    minify: mode === "development" ? false : "esbuild",
  },
}));

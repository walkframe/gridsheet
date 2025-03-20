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
      fileName: (format) => {
        if (format === "es") {
          return "index.js";
        }
        return `index.${format}.js`;
      },
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
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

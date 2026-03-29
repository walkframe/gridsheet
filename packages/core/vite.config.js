import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { readdirSync, statSync } from "fs";
import { join, relative } from "path";

/** Recursively collect all .ts files under a directory. */
function collectEntries(dir, base = dir) {
  const entries = {};
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      Object.assign(entries, collectEntries(full, base));
    } else if (name.endsWith(".ts") && !name.endsWith(".spec.ts")) {
      const rel = relative(base, full).replace(/\.ts$/, "");
      entries[rel] = full;
    }
  }
  return entries;
}

const srcDir = new URL("./src", import.meta.url).pathname;

export default defineConfig(() => ({
  plugins: [dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: collectEntries(srcDir),
      name: "GridSheetCore",
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    rollupOptions: {
      external: [/^dayjs/],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
    sourcemap: true,
    minify: "esbuild",
  },
}));

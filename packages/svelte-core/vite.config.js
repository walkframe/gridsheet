import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import dts from 'vite-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true,
        compatibility: {
          componentApi: 4
        }
      }
    }),
    dts({
      tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
      include: ['index.ts', 'src'],
      outDir: 'dist',
      insertTypesEntry: true,
      copyDtsFiles: true
    })
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      name: 'GridSheetSvelteCore',
      formats: ['es'],
      fileName: () => 'index.js'
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['svelte', '@gridsheet/preact-core'],
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
}); 
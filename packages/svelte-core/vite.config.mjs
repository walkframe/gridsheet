import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import dts from 'vite-plugin-dts';
import path from 'path';
import preprocess from 'svelte-preprocess';

export default defineConfig({
  plugins: [
    svelte({
      preprocess: preprocess(),
      compilerOptions: {
        customElement: false
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
      external: ['svelte', '@gridsheet/preact-core', 'svelte/internal'],
      output: {
        globals: {
          svelte: 'Svelte',
          '@gridsheet/preact-core': 'GridSheetPreactCore'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
}); 
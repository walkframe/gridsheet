import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true,
        compatibility: {
          componentApi: 4
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@gridsheet/svelte-core': path.resolve(__dirname, '../src/index.ts')
    }
  }
}); 
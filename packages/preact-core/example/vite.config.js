import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@gridsheet/preact-core': path.resolve(__dirname, '../dist'),
    },
  },
}); 
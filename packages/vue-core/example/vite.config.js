import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@gridsheet/vue-core': path.resolve(__dirname, '../dist'),
    },
  },
}); 
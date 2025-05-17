import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
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
      name: 'GridSheetVueCore',
      formats: ['es'],
      fileName: () => 'index.js'
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['vue', '@gridsheet/preact-core'],
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});

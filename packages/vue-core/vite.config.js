import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
      include: ['src'],
      outDir: 'dist',
      insertTypesEntry: true,
      copyDtsFiles: true,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      name: 'GridSheetVueCore',
      formats: ['es'],
      fileName: (_, name) => `${name}.js`,
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      external: ['vue', /^@gridsheet\/preact-core/, /^@gridsheet\/core/, /^@gridsheet\/functions/, /^dayjs/],
      input: {
        index: path.resolve(__dirname, './src/index.ts'),
        spellbook: path.resolve(__dirname, './src/spellbook.ts'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});

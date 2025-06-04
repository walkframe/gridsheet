// packages/preact-core/vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, './index.ts'),
      name: 'GridsheetPreactCore',
      formats: ['es'],
      fileName: (_, name) => `${name}.js`,
    },
    outDir: 'dist',
    emptyOutDir: true,
    preserveModules: true,
    preserveModulesRoot: 'src',
    rollupOptions: {
      external: [/^preact/],
      input: path.resolve(__dirname, './index.ts'),
    }
  },
  optimizeDeps: {
    include: ['preact/jsx-runtime'],
  },
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
});

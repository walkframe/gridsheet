import path from 'path';
import { fileURLToPath } from 'url';
import tsconfigPaths from 'vite-tsconfig-paths';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('@storybook/react-vite').StorybookConfig} */
export default {
  stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  managerHead: (entry) => [
    ...entry,
    `<link rel="icon" type="image/x-icon" href="https://github.com/favicon.ico">`,
  ],
  managerEntries: [
    path.resolve(__dirname, './manager.js'),
  ],
  viteFinal: async (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(tsconfigPaths());
    config.resolve = config.resolve || {};
    config.resolve.conditions = ['development', 'import', 'require'];
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = ['react', 'react-dom'];
    config.optimizeDeps.exclude = ['@gridsheet/react-core', '@gridsheet/preact-core', '@gridsheet/react-right-menu'];
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@gridsheet/react-core': path.resolve(__dirname, '../../react-core/src/index.ts'),
      '@gridsheet/preact-core': path.resolve(__dirname, '../../preact-core/dist/index.js'),
      '@gridsheet/react-right-menu': path.resolve(__dirname, '../../react-right-menu/index.ts'),
    };
    return config;
  },
}; 
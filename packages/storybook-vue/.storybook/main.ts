import type { StorybookConfig } from '@storybook/vue3-vite';
import path from 'path';
import { mergeConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import vue from '@vitejs/plugin-vue';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx|vue)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  async viteFinal(config) {
    config = mergeConfig(config, {
      plugins: [tsconfigPaths(), vue()],
      resolve: {
        conditions: ['development', 'import', 'require'],
      },
      optimizeDeps: {
        include: ['vue'],
        exclude: [
          '@gridsheet/vue-core',
        ],
      },
    });
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@gridsheet/vue-core': path.resolve(__dirname, '../../vue-core'),
    };
    return config;
  },
};

export default config; 
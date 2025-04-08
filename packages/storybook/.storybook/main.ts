import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import { mergeConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    //"@storybook/addon-links",
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook',
    //"@storybook/experimental-addon-test"
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  async viteFinal(config) {
    config = mergeConfig(config, {
      plugins: [tsconfigPaths()],
      resolve: {
        conditions: ['development', 'import', 'require'],
        //dedupe: ['react', 'react-dom'],
      },
      optimizeDeps: {
        include: ['react', 'react-dom'],
        exclude: [
          '@gridsheet/react-core',
        ],
      },
    });
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@gridsheet/react-core': path.resolve(__dirname, '../../react-core/src/index.ts'),
      '@gridsheet/react-right-menu': path.resolve(__dirname, '../../react-right-menu/index.ts'),
    };
    return config;
  },
};
export default config;

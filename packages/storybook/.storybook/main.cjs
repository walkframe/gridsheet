const path = require('path');

/** @type {import('@storybook/react-vite').StorybookConfig} */
module.exports = {
  stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
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
    const tsconfigPaths = require('vite-tsconfig-paths').default;
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
    };
    return config;
  },
}; 
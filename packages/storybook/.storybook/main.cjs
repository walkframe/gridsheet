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
    options: {
      strictMode: true,
    },
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
    config.optimizeDeps.exclude = ['@gridsheet/core', '@gridsheet/react-core', '@gridsheet/preact-core', '@gridsheet/react-right-menu'];
    config.resolve.alias = [
      ...(Array.isArray(config.resolve.alias) ? config.resolve.alias : []),
      { find: '@gridsheet/react-core/spellbook', replacement: path.resolve(__dirname, '../../react-core/src/spellbook.ts') },
      { find: '@gridsheet/react-core/dev', replacement: path.resolve(__dirname, '../../react-core/src/dev.ts') },
      { find: '@gridsheet/react-core', replacement: path.resolve(__dirname, '../../react-core/src/index.ts') },
      { find: /^@gridsheet\/core\/(.*)$/, replacement: path.resolve(__dirname, '../../core/src/$1') },
      { find: '@gridsheet/core', replacement: path.resolve(__dirname, '../../core/src/index.ts') },
      { find: '@gridsheet/preact-core', replacement: path.resolve(__dirname, '../../preact-core/dist/index.js') },
      { find: '@gridsheet/functions', replacement: path.resolve(__dirname, '../../functions/dist/index.js') },
    ];
    return config;
  },
}; 
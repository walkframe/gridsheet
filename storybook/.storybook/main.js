const path = require("path");

module.exports = {
  stories: ["../examples/**/*.stories.tsx"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@gridsheet/react-core': path.resolve(__dirname, '../../src'),
    };
    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve('ts-loader'),
          
        }
      ]
    })

    config.resolve.extensions.push('.ts', '.tsx');
    return config;
  },
};

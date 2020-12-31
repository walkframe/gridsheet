module.exports = {
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  webpackFinal: async (config) => {
    config.module.rules = [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      },
      {
        test: /\.styl$/,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader",
        ]
      },
    ];
    config.resolve = {
      extensions: [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
}

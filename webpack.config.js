const path = require("path");

module.exports = {
  // mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, "dist"),
    // filename: 'foo.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      },
      {
        test: /\.styl$/,
        use: [
          "style-loader",
          "css-loader",
          "stylus-loader",
        ]
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
};

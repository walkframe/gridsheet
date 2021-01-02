const path = require("path");

module.exports = {
  // mode: 'production',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
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

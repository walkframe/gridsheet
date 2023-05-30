const path = require("path");
const TypescriptDeclarationPlugin = require("typescript-declaration-webpack-plugin");

module.exports = {
  mode: "development",
  resolve: {
    extensions: [".js", ".ts", ".tsx"],
  },
  externals: {
    react: "commonjs react",
    "react-dom": "commonjs react-dom",
  },
  entry: {
    home: "./src/index.tsx",
  },
  output: {
    //libraryTarget: "umd",
    globalObject: "this",
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [new TypescriptDeclarationPlugin({})],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: ["ts-loader?configFile=tsconfig.json"],
        exclude: [/node_modules/, /.examples/],
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,
        loader: "file-loader?name=./font/[name].[ext]",
        exclude: [/.examples/],
      },
    ],
  },
};

const path = require("path");
// const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const ReactServerWebpackPlugin = require("react-server-dom-webpack/plugin");

const isProduction = process.env.NODE_ENV === "production";

const config = {
  mode: isProduction ? "production" : "development",
  devtool: isProduction ? "source-map" : "cheap-module-source-map",
  entry: [path.resolve(__dirname, "../src/framework/bootstrap.jsx")],
  output: {
    path: path.resolve(__dirname, "../build"),
    filename: "main.js",
  },
  resolve: {
    extensions: [".js", ".jsx", ".json"],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-react", { runtime: "automatic" }]],
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    // new HtmlWebpackPlugin({
    //   inject: true,
    //   template: path.resolve(__dirname, "../public/index.html"),
    // }),
    new CleanWebpackPlugin({
      dry: true,
    }),
    new ReactServerWebpackPlugin({ isServer: false }),
  ],
};

module.exports = config;

const path = require("path");
const Dotenv = require("dotenv-webpack");

module.exports = {
  entry: "./background.js",
  output: {
    filename: "background.bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  mode: "production",
  plugins: [
    new Dotenv()
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
};

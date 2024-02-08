const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;
const packageJson = require("./package.json");

module.exports = {
  mode: "production",
  entry: {
    app: path.join(__dirname, "src", "index.js"),
  },
  output: {
    filename: "[name].[chunkhash].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: {
          presets: ["@babel/preset-react"],
        },
      },
    ],
  },
  resolve: {
    extensions: ["*", ".js", ".jsx"],
    modules: [path.resolve(__dirname, "src"), "node_modules"],
  },
  devServer: {
    port: 6005,
    hot: false,
    proxy: [
      {
        context: () => true,
        target: "https://unified-dev.digit.org",
        secure: true,
        changeOrigin: true,
        bypass: function (req, res, proxyOptions) {
          if (req.headers.accept.indexOf("html") !== -1) {
            console.log("Skipping proxy for browser request.");
            return "/index.html";
          }
          return null;
        },
        headers: {
          Connection: "keep-alive",
        },
      },
    ],
    https: false, // Enable HTTPS

    // port: "6005",
    // hot: false,
  },
  devtool: "source-map",

  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "public", "index.html"),
    }),
    new ModuleFederationPlugin({
      name: "app2",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/singleSpaEntry",
      },
      shared: [
        // packageJson.dependencies,
        // "react-dom",
        // "react-query",
        // "react",
        // "single-spa-react",
      ],
    }),
  ],
};

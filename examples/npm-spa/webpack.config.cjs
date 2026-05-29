const path = require("path")
const webpack = require(process.env.DFN_EXAMPLE_WEBPACK || "webpack")

const CopyPlugin = require(process.env.DFN_EXAMPLE_COPY_PLUGIN || "copy-webpack-plugin")
const babelLoader = process.env.DFN_EXAMPLE_BABEL_LOADER || "babel-loader"
const typescriptPreset = process.env.DFN_EXAMPLE_BABEL_PRESET_TYPESCRIPT || "@babel/preset-typescript"

module.exports = {
  mode: "production",
  target: "web",
  entry: path.resolve(__dirname, "src/main.ts"),
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  devServer: {
    static: path.resolve(__dirname, "dist"),
    hot: false,
    historyApiFallback: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".mjs", ".cjs", ".js"],
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
    mainFields: ["browser", "module", "main"],
    conditionNames: ["browser", "import", "module", "default"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: babelLoader,
          options: {
            presets: [typescriptPreset],
          },
        },
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: path.resolve(__dirname, "public"), to: path.resolve(__dirname, "dist") }],
    }),
    new webpack.DefinePlugin({
      "process.env.DFN_PLAYGROUND_ENV": JSON.stringify(process.env.DFN_PLAYGROUND_ENV || "local"),
      "process.env.DFN_PLAYGROUND_SERVICE_ID": JSON.stringify(process.env.DFN_PLAYGROUND_SERVICE_ID || "gou080"),
    }),
  ],
}

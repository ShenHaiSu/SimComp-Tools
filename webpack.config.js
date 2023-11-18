const path = require('path');
// const moment = require("moment");
const TerserPlugin = require('terser-webpack-plugin');

// const timeStamp = moment().format('MMDD-HHmmss');
const fileName = `build.user.js`;

module.exports = {
  mode: "production",
  entry: { main: './index.js' },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: fileName,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'commons',
    },
    minimizer: [
      new TerserPlugin({ terserOptions: { keep_classnames: true } }),
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader' },
      },
    ],
  },
};
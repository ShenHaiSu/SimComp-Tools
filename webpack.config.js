const path = require('path');
const fs = require("node:fs");
const webpack = require("webpack");
const moment = require("moment");
const TerserPlugin = require('terser-webpack-plugin');

// const timeStamp = moment().format('MMDD-HHmmss');
const fileName = `build.user.js`;
const distPath = path.join(__dirname, 'dist');
const nowVersion = [2];

// 生成版本号
const genVersion = () => {
  let cptCount = fs.readdirSync(path.join(__dirname, "components")).length;
  let oldFile = JSON.parse(fs.readFileSync(path.join(distPath, "version.json")));
  let offset = -20;
  let timeVersion = moment().format(`YYMMDDHHmmss`);
  // nowVersion[1] = cptCount + offset;
  if (cptCount == oldFile.cptCount) {
    nowVersion[1] = cptCount + offset;
  } else {
    nowVersion[1] = oldFile.version[1] + 1;
  }
  nowVersion[2] = Number(timeVersion);
  return nowVersion;
}
// 更新版本文件
const updateVersionFile = (nowVersion) => {
  let cptCount = fs.readdirSync(path.join(__dirname, "components")).length;
  let versionFilePath = path.join(distPath, "version.json");
  fs.writeFileSync(versionFilePath, JSON.stringify({ version: nowVersion, cptCount }));
}

let sctVersion = genVersion();
updateVersionFile(sctVersion);

module.exports = {
  mode: "production",
  entry: { main: './index.js' },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: fileName,
  },
  optimization: {
    splitChunks: { chunks: 'all', name: 'commons' },
    minimizer: [new TerserPlugin({ terserOptions: { keep_classnames: true } })]
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: { loader: 'babel-loader' },
    }],
  },
  plugins: [
    new webpack.DefinePlugin({
      sctData: { version: sctVersion }
    })
  ]
};
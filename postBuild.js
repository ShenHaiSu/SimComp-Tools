let fs = require('fs');
let path = require('path');
let distPath = path.join(__dirname, 'dist');
let moment = require("moment");
let mainVersion = 2;

let nowVersion = [mainVersion];

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

// 添加前缀
const addPreText = (nowVersion) => {
  let jsFilePath = path.join(distPath, "build.user.js");
  let jsFile = fs.readFileSync(jsFilePath);
  let preText = [
    `// ==UserScript==`,
    `// @name         SimComps - tools`,
    `// @namespace    http://shenhaisu.cc/`,
    `// @version      ${nowVersion.join(".")}`,
    `// @description  给国人使用的SimComps脚本`,
    `// @author       ShenHaiSu`,
    `// @match        http://www.simcompanies.com/*`,
    `// @match        https://www.simcompanies.com/*`,
    `// @license      MIT`,
    `// @grant        none`,
    `// @noframes`,
    `// ==/UserScript==`,
    ``,
    ``
  ].join("\n");
  fs.writeFileSync(jsFilePath, preText + jsFile, "utf-8");
}

// 更新版本文件
const updateVersionFile = (nowVersion) => {
  let cptCount = fs.readdirSync(path.join(__dirname, "components")).length;
  let versionFilePath = path.join(distPath, "version.json");
  fs.writeFileSync(versionFilePath, JSON.stringify({ version: nowVersion, cptCount }));
}


// 入口函数
(async function () {
  try {
    let nowVersion = genVersion();
    addPreText(nowVersion);
    updateVersionFile(nowVersion);
    console.log("Add Success.");
  } catch (e) {
    console.log(e);
    console.log("Add Fail.");
  }
})()
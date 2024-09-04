let fs = require('fs');
let path = require('path');
let distPath = path.join(__dirname, 'dist');

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
    `// @updateURL    http://yuyun-mainland.daoluolts.de:45154/file/download`,
    `// @downloadURL  http://yuyun-mainland.daoluolts.de:45154/file/download`,
    `// @updateURL    http://yuyun-outsea.daoluolts.de:45154/file/download`,
    `// @downloadURL  http://yuyun-outsea.daoluolts.de:45154/file/download`,
    `// @license      MIT`,
    `// @grant        none`,
    `// @noframes`,
    `// ==/UserScript==`,
    ``,
    ``
  ].join("\n");
  fs.writeFileSync(jsFilePath, preText + jsFile, "utf-8");
}

// 获取版本号
const getVersion = () => {
  let oldFile = JSON.parse(fs.readFileSync(path.join(distPath, "version.json")));
  return oldFile.version;
}


// 入口函数
(async function () {
  try {
    let nowVersion = getVersion();
    addPreText(nowVersion);
    console.log("Add Success.  " + nowVersion.join("."));
  } catch (e) {
    console.log(e);
    console.log("Add Fail.");
  }
})()
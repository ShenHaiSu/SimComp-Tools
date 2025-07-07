let fs = require('node:fs');
let path = require('node:path');
let distPath = path.join(__dirname, 'dist');

// 添加前缀
const addPreText = (nowVersion) => {
  let jsFilePath = path.join(distPath, "build.user.js");
  let jsFile = fs.readFileSync(jsFilePath);
  let preText = [
    `// ==UserScript==`,
    `// @name         SimComps - tools`,
    `// @namespace    https://daoluolts.de`,
    `// @version      ${nowVersion.join(".")}`,
    `// @description  给国人使用的SimComps脚本`,
    `// @author       ShenHaiSu`,
    `// @match        https://www.simcompanies.com/*`,
    `// @updateURL    https://scs1.daoluolts.de:8080/api/plugin-download`,
    `// @downloadURL  https://scs1.daoluolts.de:8080/api/plugin-download`,
    `// @updateURL    https://scs1.daoluolts.de:8080/api/plugin-download`,
    `// @downloadURL  https://scs1.daoluolts.de:8080/api/plugin-download`,
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
  const oldFile = JSON.parse(fs.readFileSync(path.join(distPath, "version.json"), 'utf-8'));
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
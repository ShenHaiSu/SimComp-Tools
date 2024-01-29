let fs = require('fs');
let path = require('path');
let distPath = path.join(__dirname, 'dist');
let moment = require("moment");

let preVersion = `2.19`; // 手动定制版本

function getLatestJsFile(dir) {
  const files = fs.readdirSync(dir);
  const jsFiles = files.filter(file => path.extname(file) === '.js');
  const sortedJsFiles = jsFiles.sort((a, b) => {
    const statA = fs.statSync(path.join(dir, a));
    const statB = fs.statSync(path.join(dir, b));
    return statB.mtime.getTime() - statA.mtime.getTime();
  });
  return sortedJsFiles[0];
}

function insertTextToFile(filePath, text) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const updatedContent = text + '\n' + content;
  fs.writeFileSync(filePath, updatedContent, 'utf-8');
}

function genFileVersion(_, version = "") {
  let data = { version: version.split(".") };
  let fileData = JSON.stringify(data);
  fs.writeFileSync("./dist/version.json", fileData, "utf-8");
}

let latestJsFile = getLatestJsFile(distPath);

if (latestJsFile) {
  let filePath = path.join(distPath, latestJsFile);
  let timeStamp = moment().format('YYMMDDHHmmss'); // 自动生成子版本

  let customText = [
    `// ==UserScript==`,
    `// @name         SimComps - tools`,
    `// @namespace    http://shenhaisu.cc/`,
    `// @version      ${preVersion}.${timeStamp}`,
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
  insertTextToFile(filePath, customText);
  genFileVersion(distPath, `${preVersion}.${timeStamp}`);
  console.log(`Custom text added to ${latestJsFile}`);
} else {
  console.log('No JavaScript files found in the "dist" directory.');
}

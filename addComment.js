let fs = require('fs');
let path = require('path');
let distPath = path.join(__dirname, 'dist');
let moment = require("moment");

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

let latestJsFile = getLatestJsFile(distPath);

if (latestJsFile) {
  let filePath = path.join(distPath, latestJsFile);
  let timeStamp = moment().format('YYMMDDHHmmss');

  let customText = [
    `// ==UserScript==`,
    `// @name         SimComps - tools`,
    `// @namespace    http://shenhaisu.cc/`,
    `// @version      2.1.${timeStamp}`,
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
  console.log(`Custom text added to ${latestJsFile}`);
} else {
  console.log('No JavaScript files found in the "dist" directory.');
}

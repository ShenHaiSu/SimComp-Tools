const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class salesOfficeIncomeDisplay extends BaseComponent {
  constructor() {
    super();
    this.name = "销售办公室收入显示";
    this.describe = "在销售办公室的订单页面,可以查看各个q的分别收入";
    this.enable = true;
    this.tagList = ['样式', "零售"];
  }
  commonFuncList = [{
    match: (event) => {
      try {
        if (!/b\/\d+\/$/.test(location.href)) return false;
        return tools.getBuildKind(Math.floor(location.href.match(/b\/(\d+)\/$/)[1])) == "B";
      } catch { return false }
    },
    func: this.mainFunc
  }]

  mainFunc(event, mode = "start") {
    // 检查启动标记
    let originLength = document.querySelectorAll("div>label>input").length;
    let scriptLength = document.querySelectorAll("input[type='range'][max='12'][min='0']").length;
    let isLengthChange = originLength != scriptLength;
    let isForceMode = mode == "force";
    if (!isLengthChange && !isForceMode) return;
    // 清除当前所有显示
    this.clearRangeInput();
    // 获取操作的目标
    let nodeList = Object.values(document.querySelectorAll("div>label>input")).map(node => tools.getParentByIndex(node, 6));
    for (let i = 0; i < nodeList.length; i++) {
      let rootNode = nodeList[i];
      let newNode = document.createElement("div");
      let itemInfo = rootNode.childNodes[0].innerText.split(/\n/).filter(text => text.match(/每个/)).map(text => [text.match(/每个(.+)$/)[1], parseInt(text.replaceAll(/\$|,/g, ""))]);
      let qualityBonus = parseFloat(rootNode.childNodes[0].innerText.split(/\n/).filter(text => text.match(/品质奖励/))[0]) / 100;
      let htmlText = `<input max=12 min=0 type=range value=1><div><div>Quality 品质: ${1}</div>`
      newNode.id = "script_incomeDisplay_root";
      for (let i = 0; i < itemInfo.length; i++) {
        let bonus = itemInfo[i][1] * qualityBonus;
        htmlText += `<div>${itemInfo[i][0]} $${tools.numberAddCommas(itemInfo[i][1] + bonus)} (+$${tools.numberAddCommas(bonus)})</div>`
      }
      htmlText += `</div>`;
      newNode.innerHTML = htmlText;
      rootNode.firstChild.firstChild.childNodes[1].append(newNode);
      newNode.querySelector("input[type='range'][max='12'][min='0']").addEventListener("change", event => this.rangeInputChange(event));
    }
  }

  rangeInputChange(event) {
    let quality = Math.floor(event.target.value);
    let dataRootNode = tools.getParentByIndex(event.target, 2);
    let itemInfo = dataRootNode.innerText.split(/\n/).filter(text => text.match(/每个/)).map(text => [text.match(/每个(.+)$/)[1], parseInt(text.replaceAll(/\$|,/g, ""))]);
    let qualityBonus = parseFloat(dataRootNode.innerText.split(/\n/).filter(text => text.match(/品质奖励/))[0]) / 100;
    let htmlText = `<div>Quality 品质: ${quality}</div>`;
    itemInfo.forEach(item => {
      let bonus = Number((item[1] * (quality * qualityBonus)).toFixed(1));
      htmlText += `<div>${item[0]} $${tools.numberAddCommas(item[1] + bonus)} (+$${tools.numberAddCommas(bonus)})</div>`
    });
    event.target.nextElementSibling.innerHTML = htmlText;
  }

  clearRangeInput() {
    Object.values(document.querySelectorAll("input[type='range'][max='12'][min='0']")).forEach(node => node.parentElement.remove());
  }
}
new salesOfficeIncomeDisplay();
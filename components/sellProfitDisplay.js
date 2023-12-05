const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 交易所上架/合同交易时显示利润
class sellProfitDisplay extends BaseComponent {
  constructor() {
    super();
    this.name = "交易所上架/合同交易时显示利润";
    this.describe = "在仓库发送物品到交易所或者通过合同出售的界面会自动计算收入总量与利润值";
    this.enable = true;
    this.canDisable = true;
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/warehouse\/(.+)/) && document.querySelectorAll("form").length > 0),
    func: this.mainFunc
  }]
  componentData = {
    lastPrice: 0, // 最近一次的单价
    lastAmount: 0, // 最近一次的数量
  }

  mainFunc() {
    // 利润 = 数量 * 单价 - (成本 * 单价 + 运输单位 * 运输单价 + 税费)
    try {
      let formNode = document.querySelector("form");
      let infoSpan;
      if (formNode.lastChild.querySelector("span")) {
        infoSpan = formNode.lastChild.querySelector("span");
      } else {
        infoSpan = document.createElement("span");
        infoSpan.innerText = "等待计算利润";
        formNode.lastChild.prepend(document.createElement("br"));
        formNode.lastChild.prepend(infoSpan);
      }

      // 计算利润结果
      let inputList = formNode.querySelectorAll("input");
      let spanList = formNode.querySelector("div.row").nextElementSibling.querySelectorAll("span");
      // 检查缓存
      if (parseInt(inputList[0].value) == this.componentData.lastAmount && parseFloat(inputList[1].value) == this.componentData.lastPrice) return;
      let count = parseInt(inputList[0].value);
      let quality = this.get_quality(formNode);
      let name = formNode.previousElementSibling.querySelector("b").innerText;
      let cost = this.get_cost(name, quality);
      let sellPrice = parseFloat(inputList[1].value);
      let taxFee = parseInt(spanList[1].innerText.split("\n")[0].replaceAll(/(\$)|(,)/g, "")) || 0;
      let TransUnitCount = parseInt(spanList[0].innerText.replaceAll(/(x)|(,)/g, ""));
      let TransUnitPrice = this.get_cost("运输单位", 0) || 0;
      let transPay = TransUnitCount * TransUnitPrice;
      if (taxFee == 0) transPay = transPay / 2; // 税收为0 那就是合同模式
      if (sellPrice == 0) return;
      let income = isNaN(parseInt(count * sellPrice)) ? 0 : parseInt(count * sellPrice);
      let profit = isNaN(parseInt(income - (count * cost + transPay + taxFee))) ? 0 : parseInt(income - (count * cost + transPay + taxFee));
      tools.log(`${count * sellPrice - (count * cost + transPay + taxFee)} 税费：${taxFee}`);
      tools.log(`数量：${count}\n售价：${sellPrice}\n成本：${cost}\n运输数量：${TransUnitCount}\n运输单价：${TransUnitPrice}\n利润:${profit}`);
      // if (!cost) return infoSpan.innerText = `物品成本获取失败，请联系开发者补修适配`;
      this.componentData.lastAmount = count;
      this.componentData.lastPrice = sellPrice;
      infoSpan.innerText = `收款：$${income - taxFee}，利润：$${profit}`;
    } catch (error) {
      tools.errorLog(error);
    }
  };

  get_quality(formNode) {
    let starsCount = formNode.previousElementSibling.querySelectorAll("span > svg").length;
    if (starsCount == 0) return 0;
    let qualityNumber = parseInt(formNode.previousElementSibling.querySelectorAll("span > svg")[0].parentElement.innerText);
    return isNaN(qualityNumber) ? starsCount : qualityNumber;
  }
  get_cost(name, quality) {
    let realm = runtimeData.basisCPT.realm;
    if (realm == undefined) return 0;
    let result = 0;
    indexDBData.basisCPT.warehouse[realm].forEach(item => {
      if (item.kind.name != name || item.quality != quality) return;
      let cost = Object.values(item.cost).reduce((acc, cur) => acc + cur, 0);
      result = (cost / item.amount).toFixed(4);
    });
    return result;
  }
}
new sellProfitDisplay();
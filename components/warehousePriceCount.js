const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 仓库单物品总价
class warehousePriceCount extends BaseComponent {
  constructor() {
    super()
    this.name = "仓库单物品总价值";
    this.describe = "在仓库界面鼠标移动到物品上悬停,会显示单物品合计总价值.";
    this.enable = true;
    this.canDisable = true;
  }
  commonFuncList = [
    {
      match: () => Boolean(location.href.match(/warehouse\/$/)),
      func: this.mainFunc
    }
  ];
  mainFunc() {
    try {
      let itemNodeList = document.querySelectorAll(".col-lg-10.col-md-9 > div > div > div > div > div");
      let realm = runtimeData.basisCPT.realm;
      if (realm == undefined) return;
      let priceList = {};
      for (let i = 0; i < indexDBData.basisCPT.warehouse[realm].length; i++) {
        let item = indexDBData.basisCPT.warehouse[realm][i];
        let price = 0;
        if (priceList[item.kind.name] == undefined) priceList[item.kind.name] = 0;
        Object.values(item.cost).forEach(singlePrice => price += singlePrice);
        priceList[item.kind.name] += price;
      }
      itemNodeList.forEach(function (item) {
        let name = item.querySelector("b").innerText;
        item.setAttribute("title", `成本价值：$${priceList[name].toFixed(2)}`);
      });
    } catch (error) {
      tools.errorLog(error);
    }
  }
}
new warehousePriceCount();
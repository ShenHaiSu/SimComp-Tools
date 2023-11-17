const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 零售显示总利润、时利润
// todo: 推荐定价
class retailDisplayProfit extends BaseComponent {
  constructor() {
    super();
    this.name = "零售显示总利润、时利润";
    this.describe = "在零售建筑中尝试上架零售物品的时候，会实时计算零售利润和每小时利润";
    this.enable = true;
    this.canDisable = true;
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/\/b\/\d+\//)) && document.activeElement.name == "price" && document.activeElement.tagName == "INPUT",
    func: this.mainFunc
  }];
  componentData = {
    fadeTimer: undefined, // 自动消失计时器标签
    containerNode: undefined, // 显示容器元素
  }
  cssText = [`#retail_display_div {color:var(--fontColor);border-radius:5px;background-color:rgba(0, 0, 0, 0.5);position:fixed;top:50%;right:0;transform: translateY(-50%);width:150px;z-index:1032;justify-content:center;align-items:center;}`]

  mainFunc() {
    let activeNode = document.activeElement;
    let activeNodeRect = activeNode.getBoundingClientRect();
    let targetNode = tools.getParentByIndex(activeNode, 5).previousElementSibling.querySelector("div > div > h3").parentElement;
    let quantity = tools
      .getParentByIndex(activeNode, 2)
      .previousElementSibling.querySelector("div > p > input[name='quantity']").value;
    let price = activeNode.value;
    let baseInfo;
    try {
      baseInfo = this.GetInfo(targetNode);
    } catch (error) {
      return;
    }
    if (baseInfo.profit <= 0) return; // 利润小于0 不处理
    if (quantity == "" || quantity <= 0) return; // 零售数量小于0 不处理
    if (price == "" || price <= 0) return; // 零售单价小于0 不处理
    if (this.componentData.fadeTimer) clearTimeout(this.componentData.fadeTimer);
    if (!this.componentData.containerNode) {
      let newNode = document.createElement("div");
      newNode.id = "retail_display_div";
      Object.assign(newNode.style, { display: "none" });
      this.componentData.containerNode = newNode;
      document.body.appendChild(newNode);
    }
    let totalProfit = (baseInfo.profit * quantity).toFixed(3);
    let hourProfit = (totalProfit / baseInfo.duration_hour).toFixed(3);
    this.componentData.containerNode.innerText = `预估数据：\n总利润：${totalProfit}\n时利润：${hourProfit}`;
    Object.assign(this.componentData.containerNode.style, {
      display: "flex",
      top: `${activeNodeRect.top + activeNodeRect.height + 64}px`,
      left: `${activeNodeRect.left}px`,
    });
    this.componentData.fadeTimer = setTimeout(() => {
      Object.assign(this.componentData.containerNode.style, { display: "none" });
    }, 3000);
  }

  GetInfo(node) {
    let textList = node.innerText.split("\n");
    let output = {};
    output.name = textList[0];
    output.profit = parseFloat(textList[3].replaceAll(",", "").match(/\$(-)?\d+\.\d+/)[0].replace("$", ""));
    output.duration_hour = this.GetTimeFormat(textList[4].match(/\(.+\)/)[0].replaceAll(/\(|\)/g, ""));
    return output;
  }

  GetTimeFormat(timeString) {
    let timeRegex = /(\d+)\s*([a-z]+)/gi;
    let timeUnits = { y: 8760, mo: 720, w: 168, d: 24, h: 1, m: 1 / 60, s: 1 / 3600 };
    let totalHours = 0;
    let match;
    while ((match = timeRegex.exec(timeString)) !== null) {
      let unit = match[2].toLowerCase();
      if (timeUnits.hasOwnProperty(unit)) totalHours += parseFloat(match[1]) * timeUnits[unit];
    }
    return parseFloat(totalHours.toFixed(3));
  }
}
new retailDisplayProfit();
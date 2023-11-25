const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 接受合同界面自动询价
class ACCAutomaticInquiry extends BaseComponent {
  constructor() {
    super();
    this.name = "接受合同界面自动询价";
    this.describe = "在接受合同界面会自动询价,查询当前物品当前q在交易所的价格并计算出相对mp的正负值";
    this.enable = true;
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match("headquarters/warehouse/incoming-contracts")),
    func: this.mainFunc
  }];
  componentData = {
    loadFlag: false, // 加载标记
  };
  async mainFunc() {
    if (document.querySelectorAll("b.script_automatic_inquiry_b").length != 0) return;
    if (this.componentData.loadFlag) return;
    this.componentData.loadFlag = true;
    let nodeList = Object.values(document.querySelectorAll("a[aria-label='Sign contract']")).map(node => tools.getParentByIndex(node,3));
    let realm = runtimeData.basisCPT.realm;
    for (let i = 0; i < nodeList.length; i++) {
      let node = nodeList[i];
      let nodeInfo = this.queryNodeInfo(node.getAttribute("aria-label"));
      // [resID, name, quantity, quality, unitPrice, totalPrice, from]
      tools.log(nodeInfo);
      let market_price = await tools.getMarketPrice(nodeInfo[0], nodeInfo[3], realm);
      let market_price_offset = 0;
      try {
        market_price_offset = ((nodeInfo[4] / market_price - 1) * 100).toFixed(0);
        market_price_offset = market_price_offset > 0 ? `+${market_price_offset}` : market_price_offset.toString();
      } catch {
        market_price_offset = "";
      }
      tools.log(market_price);
      if (!market_price) {
        market_price = "无";
        market_price_offset = 0;
      }
      let newNode = document.createElement("b");
      newNode.innerText = ` MP:$${market_price} MP${market_price_offset}`;
      newNode.className = "script_automatic_inquiry_b";
      node.children[2].appendChild(newNode);
    }
    this.componentData.loadFlag = false;
  }
  queryNodeInfo(input) {
    // [resID, name, quantity, quality, unitPrice, totalPrice, from]
    let output = [];
    let matchOut = [];
    matchOut = input.match(/(\d+)\squality\s(\d+)\s(.+?)\s/);
    output.push(tools.itemName2Index(matchOut[3]));
    output = output.concat([matchOut[3], matchOut[1], matchOut[2]]);
    matchOut = input.match(/\$(\d+.\d+|\d+)/g);
    output = output.concat([parseFloat(matchOut[0].replace("$", "")), parseFloat(matchOut[1].replace("$", ""))]);
    output.push(input.match(/from.+?(.+)/)[1]);
    return output;
  }
}
new ACCAutomaticInquiry();
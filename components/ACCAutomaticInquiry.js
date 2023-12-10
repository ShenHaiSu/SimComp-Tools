const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 接受合同界面询价
class ACCAutomaticInquiry extends BaseComponent {
  constructor() {
    super();
    this.name = "接受合同の询价";
    this.describe = "在接受合同界面可以自动询价,查询当前物品当前q在交易所的价格并计算出相对mp的正负值";
    this.enable = true;
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match("headquarters/warehouse/incoming-contracts")),
    func: this.mainFunc
  }];
  indexDBData = {
    workMode: 0, // 工作模式 0自动询价 1手动询价
    exactDigit: 0, // 精度 默认0
  }
  componentData = {
    loadFlag: false, // 加载标记
  };
  frontUI = () => {
    if (!Boolean(location.href.match("headquarters/warehouse/incoming-contracts"))) return tools.alert("请回到待处理入库件页面");
    this.mainWork_0();
  }
  settingUI = () => {
    let newNode = document.createElement("div");
    let htmlText = `<div class=header>接受合同界面自动询价设置</div><div class=container><div><button class="btn script_opt_submit">保存更改</button></div><table><thead><tr><td>功能<td>设置<tbody><tr><td title="在接受合同的界面自动询价比对的时候显示的mp差值精确度 默认0">精确小数点数<td><input class=form-control step=1 type=number value=######><tr><td title="询价组件工作模式 默认自动询价">询价工作模式<td><select class=form-control><option value=0>自动询价<option value=1>手动询价</select></table></div>`
    htmlText = htmlText.replace("######", this.indexDBData.exactDigit);
    newNode.id = "script_ACCAutoQuery_setting";
    newNode.innerHTML = htmlText;
    newNode.querySelector("select").value = this.indexDBData.workMode;
    newNode.querySelector("button.script_opt_submit").addEventListener('click', () => this.settingSubmit());
    return newNode;
  }
  settingSubmit() {
    let valueList = Object.values(document.querySelectorAll("div#script_ACCAutoQuery_setting input, div#script_ACCAutoQuery_setting select")).map(node => node.value);
    // 检查数据
    if (valueList[0] < 0) return tools.alert("精度必须是整数且大于等于0");
    // 更新数据保存
    this.indexDBData.exactDigit = parseFloat(valueList[0]);
    this.indexDBData.workMode = Math.floor(valueList[1]);
    tools.indexDB_updateIndexDBData();
    tools.alert("提交更新");
  }

  mainFunc() {
    switch (this.indexDBData.workMode) {
      case 0: // 自动查询
        return this.mainWork_0();
      case 1: // 手动查询
        return this.mainWork_1();
    }
  }
  // 自动查询
  async mainWork_0() {
    // 检测已有挂载
    if (document.querySelectorAll("b.script_automatic_inquiry_b").length != 0) return;
    if (document.querySelectorAll("a.script_automatic_inquiry_a").length != 0) return;
    // 检测加载状态
    if (this.componentData.loadFlag) return;
    this.componentData.loadFlag = true;
    let nodeList = Object.values(document.querySelectorAll("a[aria-label='Sign contract']")).map(node => tools.getParentByIndex(node, 3));
    let realm = await tools.getRealm();
    for (let i = 0; i < nodeList.length; i++) {
      let node = nodeList[i];
      let nodeInfo = this.queryNodeInfo(node.getAttribute("aria-label"));
      // [resID, name, quantity, quality, unitPrice, totalPrice, from]
      tools.log(nodeInfo);
      let market_price = await tools.getMarketPrice(nodeInfo[0], nodeInfo[3], realm);
      let market_price_offset = 0;
      try {
        market_price_offset = ((nodeInfo[4] / market_price - 1) * 100).toFixed(this.indexDBData.exactDigit);
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
  // 手动查询
  mainWork_1() {
    if (document.querySelectorAll("b.script_automatic_inquiry_b").length != 0) return;
    if (document.querySelectorAll("a.script_automatic_inquiry_a").length != 0) return;
    try {
      if (this.componentData.loadFlag) return;
      let nodeList = Object.values(document.querySelectorAll("a[aria-label='Sign contract']")).map(node => tools.getParentByIndex(node, 3));
      for (let i = 0; i < nodeList.length; i++) {
        let node = nodeList[i];
        let newNode = document.createElement("a");
        newNode.className = "script_automatic_inquiry_a";
        newNode.innerText = ` 询价`;
        newNode.addEventListener("click", event => this.cliclQueryHandle(event));
        node.children[2].appendChild(newNode);
      }
    } finally {
      this.componentData.loadFlag = false;
    }
  }
  async cliclQueryHandle(event) {
    let targetNode = tools.getParentByIndex(event.target, 2);
    let nodeInfo = this.queryNodeInfo(targetNode.getAttribute("aria-label"));
    let realm = await tools.getRealm();
    let market_price = await tools.getMarketPrice(nodeInfo[0], nodeInfo[3], realm);
    let market_price_offset = 0;
    try {
      market_price_offset = ((nodeInfo[4] / market_price - 1) * 100).toFixed(this.indexDBData.exactDigit);
      market_price_offset = market_price_offset > 0 ? `+${market_price_offset}` : market_price_offset.toString();
    } catch {
      market_price_offset = "";
    }
    event.target.innerText = ` MP:$${market_price} MP${market_price_offset}`
  }

}
new ACCAutomaticInquiry();
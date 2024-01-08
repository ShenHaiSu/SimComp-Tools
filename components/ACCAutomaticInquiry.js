const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 接受合同界面询价
class ACCAutomaticInquiry extends BaseComponent {
  constructor() {
    super();
    this.name = "接受合同の询价";
    this.describe = "在接受合同界面可以自动询价,查询当前物品当前q在交易所的价格并计算出相对mp的正负值";
    this.enable = true;
    this.tagList = ["询价", "合同"];
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match("headquarters/warehouse/incoming-contracts")),
    func: this.mainFunc
  }];
  indexDBData = {
    workMode: 1, // 工作模式 0自动询价 1手动询价
    exactDigit: 0, // 精度 默认0
    customSamplePrice: [[], []], // 自定义参考价格 {id:123,price:[]}
    customSwitch: false, // 自定义参考价格按钮开关
  }
  componentData = {
    loadFlag: false, // 加载标记
    customSampleA: undefined, // 自定义参考按钮节点
  };
  frontUI = () => {
    if (!Boolean(location.href.match("headquarters/warehouse/incoming-contracts"))) return tools.alert("请回到待处理入库件页面");
    this.mainWork_0();
  }
  settingUI = async () => {
    let newNode = document.createElement("div");
    let htmlText = `<div class=header>接受合同界面自动询价设置</div><div class=container><div><button class="btn script_opt_submit">保存更改</button></div><table><thead><tr><td>功能<td>设置<tbody><tr><td title="在接受合同的界面自动询价比对的时候显示的mp差值精确度 默认0">精确小数点数<td><input class=form-control step=1 type=number value=######><tr><td title="询价组件工作模式 默认自动询价">询价工作模式<td><select class=form-control><option value=0>自动询价<option value=1>手动询价</select><tr><td>自定义参考设置</td><td><input type="checkbox" ##### class="form-control"></td></tr></table></div>`
    htmlText = htmlText
      .replace("######", this.indexDBData.exactDigit)
      .replace("#####", this.indexDBData.customSwitch ? "checked" : "");
    newNode.id = "script_ACCAutoQuery_setting";
    newNode.innerHTML = htmlText;
    newNode.querySelector("select").value = this.indexDBData.workMode;
    newNode.querySelector("button.script_opt_submit").addEventListener('click', () => this.settingSubmit());
    return newNode;
  }
  settingSubmit() {
    let valueList = Object.values(document.querySelectorAll("div#script_ACCAutoQuery_setting input, div#script_ACCAutoQuery_setting select"))
      .map(node => node.type == "checkbox" ? node.checked : node.value);
    // 检查数据
    if (valueList[0] < 0) return tools.alert("精度必须是整数且大于等于0");
    // 更新数据保存
    this.indexDBData.exactDigit = parseFloat(valueList[0]);
    this.indexDBData.workMode = Math.floor(valueList[1]);
    this.indexDBData.customSwitch = valueList[2];
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
      let custom = this.getCustomPrice(realm, nodeInfo[0], nodeInfo[3]);
      if (custom != 0) market_price = custom;
      let market_price_offset = 0;
      try {
        market_price_offset = parseFloat(((nodeInfo[4] / market_price - 1) * 100).toFixed(this.indexDBData.exactDigit));
        market_price_offset = market_price_offset > 0 ? `+${market_price_offset}` : market_price_offset.toString();
      } catch {
        market_price_offset = "ERROR";
      }
      tools.log(market_price);
      if (!market_price) {
        market_price = "无";
        market_price_offset = 0;
      } else {
        market_price = tools.numberAddCommas(market_price);
      }
      let newNode = document.createElement("b");
      newNode.innerText = ` MP:$${market_price} MP${market_price_offset}%`;
      newNode.className = "script_automatic_inquiry_b";
      node.children[2].appendChild(newNode);
      if (this.indexDBData.customSwitch) {
        if (!this.componentData.customSampleA) this.genCustomSampleNode();
        node.children[2].appendChild(this.componentData.customSampleA.cloneNode(true));
      }
    }
    this.componentData.loadFlag = false;
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
        if (this.indexDBData.customSwitch) {
          if (!this.componentData.customSampleA) this.genCustomSampleNode();
          node.children[2].appendChild(this.componentData.customSampleA.cloneNode(true));
        }
      }
    } finally {
      this.componentData.loadFlag = false;
    }
  }
  // 手动查询点击
  async cliclQueryHandle(event) {
    let targetNode = tools.getParentByIndex(event.target, 2);
    let nodeInfo = this.queryNodeInfo(targetNode.getAttribute("aria-label"));
    let realm = await tools.getRealm();
    let market_price = await tools.getMarketPrice(nodeInfo[0], nodeInfo[3], realm);
    let custom = this.getCustomPrice(realm, nodeInfo[0], nodeInfo[3]);
    if (custom != 0) market_price = custom;
    let market_price_offset = 0;
    try {
      market_price_offset = ((nodeInfo[4] / market_price - 1) * 100).toFixed(this.indexDBData.exactDigit);
      market_price_offset = market_price_offset > 0 ? `+${market_price_offset}` : market_price_offset.toString();
    } catch {
      market_price_offset = "";
    }
    event.target.innerText = ` MP:$${market_price} MP${market_price_offset}`
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
  // 自定义参考标签生成
  genCustomSampleNode() {
    let newNode = document.createElement("a");
    newNode.innerText = " 自定义参考";
    newNode.setAttribute("sct_cpt", "ACCAutomaticInquiry");
    newNode.setAttribute("sct_id", "customSampleNode");
    newNode.style.opacity = "0.2";
    document.addEventListener('click', e => {
      if (e.target.tagName !== "A") return;
      if (e.target.getAttribute("sct_cpt") !== "ACCAutomaticInquiry") return;
      if (e.target.getAttribute("sct_id") !== "customSampleNode") return;
      this.showEditCustom(this.queryNodeInfo(tools.getParentByIndex(e.target, 2).getAttribute("aria-label")));
    });
    this.componentData.customSampleA = newNode;
  }
  // 展示自定义参考的设置界面
  async showEditCustom(input) {
    // [resID, name, quantity, quality, unitPrice, totalPrice, from]
    let realm = await tools.getRealm();
    let newNode = document.createElement("div");
    let cssNode = document.createElement("style");
    let htmlText = `<div sct_cpt=ACCAutomaticInquiry sct_id=editMain><table><tr><td>服务器:<td>#####<tr><td>物品名称:<td>#####<tr><td>品质:<td>#####<tr><td>参考价<td><input class=form-control type=number value=#####><tr><td colspan=2><button class="form-control btn">保存</button></table></div>`
    let customPrice = this.getCustomPrice(realm, input[0], input[3]);
    cssNode.setAttribute("sct_cpt", "ACCAutomaticInquiry");
    cssNode.setAttribute("sct_id", "editCSS");
    newNode.setAttribute("sct_cpt", "ACCAutomaticInquiry");
    newNode.setAttribute("sct_id", "editMain");
    cssNode.textContent = `[sct_cpt="ACCAutomaticInquiry"][sct_id="editMain"]{padding:5px;color:var(--fontColor);}[sct_cpt="ACCAutomaticInquiry"][sct_id="editMain"]>table{border-collapse:separate;border-spacing:5px;text-align:center;}[sct_cpt="ACCAutomaticInquiry"][sct_id="editMain"]>table>tbody>tr{height:34px;}[sct_cpt="ACCAutomaticInquiry"][sct_id="editMain"]>table button{height:40px;}`;
    htmlText = htmlText
      .replace("#####", realm == 0 ? "R1 M服务器" : "R2 E服务器")
      .replace("#####", input[1])
      .replace("#####", input[3])
      .replace("#####", customPrice == 0 ? input[4] : customPrice);
    newNode.innerHTML = htmlText;
    newNode.addEventListener('click', e => (e.target.tagName == "BUTTON") ? this.customSampleSubmit(e, input, realm) : null)
    tools.alert(newNode, cssNode);
  }
  // 获取自定义参考价格
  getCustomPrice(realm, resID, quality) {
    let index = this.indexDBData.customSamplePrice[realm].findIndex(item => item.id == resID);
    if (index == -1) return 0;
    // console.log("全对象", this.indexDBData.customSamplePrice[realm][index]);
    // console.log(`价格`, this.indexDBData.customSamplePrice[realm][index][Number(quality)]);
    if (!this.indexDBData.customSamplePrice[realm][index].price[Number(quality)]) return 0;
    return this.indexDBData.customSamplePrice[realm][index].price[Number(quality)];
  }
  // 自定义参考价格提交按钮
  customSampleSubmit(event, input, realm) {
    // input =  [resID, name, quantity, quality, unitPrice, totalPrice, from]
    tools.log(tools.getParentByIndex(event.target, 3).querySelector("input").value, input);
    let price = Number(tools.getParentByIndex(event.target, 3).querySelector("input").value);
    // 审查
    if (price < 0) return;
    // 更新
    let index = this.indexDBData.customSamplePrice[realm].findIndex(item => item.id == input[0]);
    if (index == -1) {
      this.indexDBData.customSamplePrice[realm].push({ id: input[0], price: new Array(13) });
      index = this.indexDBData.customSamplePrice[realm].length - 1;
    }
    this.indexDBData.customSamplePrice[realm][index].price[input[3]] = price;
    tools.indexDB_updateIndexDBData();
    document.querySelector(`[sct_id="dialog_close"]`).click();
  }
}
new ACCAutomaticInquiry();
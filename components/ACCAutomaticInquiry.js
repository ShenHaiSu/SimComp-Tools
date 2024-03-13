const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 接受合同界面询价
class ACCAutomaticInquiry extends BaseComponent {
  constructor() {
    super();
    this.name = "出入库合同询价";
    this.describe = "在出入库界面能看到物品价格与当前交易所中同q物品的价格便宜。";
    this.enable = false;
    this.tagList = ["询价", "合同"];
  }
  indexDBData = {
    workMode: 1, // 工作模式 0自动询价 1手动询价
    exactDigit: 0, // 精度 默认0
    customSamplePrice: [[], []], // 自定义参考价格 {id:123,price:[]}
    customSwitch: false, // 自定义参考价格按钮开关
    warehouseInfoTag: 0, // 仓库相关物品显示标记 [0:不显示; 1:显示此物品所有数量; 2:显示此物品当前q; 3:显示所有以及当前q]
  }
  componentData = {
    loadFlag: false, // 加载标记
    customSampleA: undefined, // 自定义参考按钮节点
    clickQueryTag: undefined, // 手动查询按钮模板标签
    incomingFuncList: [], // 入库函数列表
    outgoingFuncList: [], // 出库函数列表
    realm: -1, // 服务器标号
  };
  commonFuncList = [{
    // 入库显示构建
    match: () => /headquarters\/warehouse\/incoming-contracts/.test(location.href),
    func: this.incomingMain
  }, {
    // 出库显示构建
    match: () => /headquarters\/warehouse\/outgoing-contracts/.test(location.href),
    func: this.outgoingMain
  }];
  cssText = [`div[sct_cpt='ACCAutomaticInquiry'][sct_id],div[sct_cpt='ACCAutomaticInquiry'][sct_id]>b,div[sct_cpt='ACCAutomaticInquiry'][sct_id]>a[sct_id='click2Query'],div[sct_cpt='ACCAutomaticInquiry'][sct_id]>a[sct_id='customSampleNode'],div[sct_cpt='ACCAutomaticInquiry'][sct_id]>span{color:var(--fontColor) !important;}div[sct_cpt='ACCAutomaticInquiry'][sct_id]{transition:ease-in-out 0.2s;padding:2px 5px;background-color:#000000a0;border-radius:5px;}`];
  // 设置界面构建
  settingUI = async () => {
    let newNode = document.createElement("div");
    let htmlText = `<div class=header>出入库合同询价设置</div><div class=container><div><button class="btn script_opt_submit">保存更改</button></div><table><thead><tr><td>功能<td>设置<tbody><tr><td title="在接受合同的界面自动询价比对的时候显示的mp差值精确度 默认0">精确小数点数<td><input class=form-control step=1 type=number value=######><tr><td title="询价组件工作模式 默认自动询价">询价工作模式<td><select class=form-control><option value=0>自动询价<option value=1>手动询价</select><tr><td>自定义参考设置</td><td><input type="checkbox" ##### class="form-control"></td></tr><tr><td>仓库物品数显示</td><td><select class="form-control"><option value="0">不显示库存量</option><option value="1">显示总量</option><option value="2">显示此Q</option><option value="3">显示总量与此Q</option></select></td></tr></table></div>`
    htmlText = htmlText
      .replace("######", this.indexDBData.exactDigit)
      .replace("#####", this.indexDBData.customSwitch ? "checked" : "");
    newNode.id = "script_ACCAutoQuery_setting";
    newNode.innerHTML = htmlText;
    let selectList = newNode.querySelectorAll("select");
    selectList[0].value = this.indexDBData.workMode;
    selectList[1].value = this.indexDBData.warehouseInfoTag;
    newNode.querySelector("button.script_opt_submit").addEventListener('click', () => this.settingSubmit());
    return newNode;
  }
  // 设置界面提交
  settingSubmit() {
    let valueList = Object.values(document.querySelectorAll("div#script_ACCAutoQuery_setting input, div#script_ACCAutoQuery_setting select"))
      .map(node => node.type == "checkbox" ? node.checked : node.value);
    // 检查数据
    if (valueList[0] < 0) return tools.alert("精度必须是整数且大于等于0");
    // 更新数据保存
    this.indexDBData.exactDigit = parseFloat(valueList[0]);
    this.indexDBData.workMode = Math.floor(valueList[1]);
    this.indexDBData.customSwitch = valueList[2];
    this.indexDBData.warehouseInfoTag = Math.floor(valueList[3]);
    tools.indexDB_updateIndexDBData();
    tools.alert("提交更新");
  }

  // 入库显示构建
  incomingMain() {
    return (this.indexDBData.workMode == 0) ? this.incomingQueryAuto() : this.incomingQuery();
  }
  // 自动查询
  async incomingQueryAuto() {
    // 检测已有挂载
    if (document.querySelectorAll("div[sct_cpt='ACCAutomaticInquiry']").length != 0) return;
    // 检测加载状态
    if (this.componentData.loadFlag) return;
    if (this.componentData.realm == -1) this.componentData.realm = await tools.getRealm();
    let realm = this.componentData.realm;
    this.componentData.loadFlag = true;
    let nodeList = Object.values(document.querySelectorAll("a[aria-label='Sign contract']")).map(node => tools.getParentByIndex(node, 3));
    for (let i = 0; i < nodeList.length; i++) {
      let node = nodeList[i];
      // [resID, name, quantity, quality, unitPrice, totalPrice, from]
      let nodeInfo = this.queryNodeInfo(node.getAttribute("aria-label"));
      let { market_price, market_price_offset } = await this.getMarketPriceAndOffset(node, realm, nodeInfo);
      let newNode = document.createElement("div");
      newNode.innerHTML = ` <b> MP:$${market_price} MP${market_price_offset}%</b>`;
      newNode.setAttribute("sct_cpt", "ACCAutomaticInquiry");
      newNode.setAttribute("sct_id", "autoNode");
      node.children[2].appendChild(newNode);
      // 挂载自定义参考节点
      if (this.indexDBData.customSwitch) {
        if (!this.componentData.customSampleA) this.genCustomSampleNode();
        newNode.appendChild(this.componentData.customSampleA.cloneNode(true));
      }
      // 挂载库存节点
      if (this.indexDBData.warehouseInfoTag != 0) {
        let spanNode = document.createElement("span");
        spanNode.innerText = this.getWarehouseInfo(this.indexDBData.warehouseInfoTag, nodeInfo[0], nodeInfo[3], realm);
        newNode.appendChild(spanNode);
      }
    }
    this.componentData.loadFlag = false;
  }
  // 手动查询
  incomingQuery() {
    // 检测已有的挂载
    if (document.querySelectorAll("[sct_cpt='ACCAutomaticInquiry']").length != 0) return;
    // 初始化
    try {
      if (this.componentData.loadFlag) return;
      let nodeList = Object.values(document.querySelectorAll("a[aria-label='Sign contract']")).map(node => tools.getParentByIndex(node, 3));
      for (let i = 0; i < nodeList.length; i++) {
        let node = nodeList[i];
        if (!this.componentData.clickQueryTag) this.genClickQueryTag();
        let newNode = this.componentData.clickQueryTag.cloneNode(true);
        node.children[2].appendChild(newNode);
        // 挂载自定义参考节点
        if (this.indexDBData.customSwitch) {
          if (!this.componentData.customSampleA) this.genCustomSampleNode();
          newNode.appendChild(this.componentData.customSampleA.cloneNode(true));
        }
      }
    } finally {
      this.componentData.loadFlag = false;
    }
  }

  // 出库显示构建
  outgoingMain() {
    return (this.indexDBData.workMode == 0) ? this.outgoingQueryAuto() : this.outgoingQuery();
  }
  // 自动查询
  async outgoingQueryAuto() {
    try {
      // 审核过滤
      if (this.componentData.loadFlag) return;
      if (document.querySelectorAll("b[sct_cpt='ACCAutomaticInquiry']").length != 0) return;
      // 初始化
      this.componentData.loadFlag = true;
      if (this.componentData.realm == -1) this.componentData.realm = await tools.getRealm();
      let realm = this.componentData.realm;
      let nodeList = Object.values(document.querySelectorAll("a[aria-label='Cancel contract']")).map(node => tools.getParentByIndex(node, 3));
      for (let i = 0; i < nodeList.length; i++) {
        let targetNode = nodeList[i];
        // [resID, name, quantity, quality, unitPrice, totalPrice, from]
        let info = this.queryNodeInfo(targetNode.getAttribute("aria-label"));
        let { market_price, market_price_offset } = await this.getMarketPriceAndOffset(targetNode, realm, info);
        let newNode = document.createElement("div");
        newNode.innerHTML = `<b> MP:$${market_price} MP${market_price_offset}%</b>`;
        newNode.setAttribute("sct_cpt", "ACCAutomaticInquiry");
        newNode.setAttribute("sct_id", "autoNode");
        if (targetNode.querySelector("div[sct_cpt='ACCAutomaticInquiry']")) break;
        targetNode.children[2].appendChild(newNode);
        // 检测并挂载自定义参考节点
        if (this.indexDBData.customSwitch) {
          if (!this.componentData.customSampleA) this.genCustomSampleNode();
          newNode.appendChild(this.componentData.customSampleA.cloneNode(true));
        }
        // 检测并挂载仓库相关物品数节点
        if (this.indexDBData.warehouseInfoTag != 0) {
          let newHtmlText = this.getWarehouseInfo(this.indexDBData.warehouseInfoTag, info[0], Number(info[3]), realm);
          newNode.innerHTML += `<br/> <span>${newHtmlText}</span>`;
        }
      }
      this.componentData.loadFlag = false;
    } finally {
      this.componentData.loadFlag = false;
    }
  }
  // 手动查询
  outgoingQuery() {
    // 审查
    if (document.querySelectorAll("[sct_cpt='ACCAutomaticInquiry']").length != 0) return;
    // 挂载标签
    let nodeList = Object.values(document.querySelectorAll("a[aria-label='Cancel contract']")).map(node => tools.getParentByIndex(node, 3));
    for (let i = 0; i < nodeList.length; i++) {
      let node = nodeList[i];
      if (!this.componentData.clickQueryTag) this.genClickQueryTag();
      let newNode = this.componentData.clickQueryTag.cloneNode(true);
      node.children[2].appendChild(newNode);
      // 挂载自定义参考节点
      if (this.indexDBData.customSwitch) {
        if (!this.componentData.customSampleA) this.genCustomSampleNode();
        newNode.appendChild(this.componentData.customSampleA.cloneNode(true));
      }
    }
  }

  // 手动点击查询函数
  async cliclQueryHandle(event) {
    let targetNode = tools.getParentByIndex(event.target, 3);
    let nodeInfo = this.queryNodeInfo(targetNode.getAttribute("aria-label"));
    if (this.componentData.realm == -1) this.componentData.realm = await tools.getRealm();
    let realm = this.componentData.realm;
    let { market_price, market_price_offset } = await this.getMarketPriceAndOffset(targetNode, realm, nodeInfo);
    event.target.innerText = ` MP:$${market_price} MP${market_price_offset}%`;

    // 挂载仓库信息节点
    if (this.indexDBData.warehouseInfoTag != 0) {
      let newHtmlText = this.getWarehouseInfo(this.indexDBData.warehouseInfoTag, nodeInfo[0], Number(nodeInfo[3]), realm);
      let targetNode = tools.getParentByIndex(event.target, 1);
      let existNode = targetNode.querySelector("span");
      if (existNode) {
        existNode.innerHTML = `<span>${newHtmlText}</span>`;
      } else {
        targetNode.innerHTML += `<br/> <span>${newHtmlText}</span>`;
      }
    }
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
    if (/from\s.+$/.test(input)) {
      output.push(input.match(/from\s(.*)$/)[1]);
    } else if (/to\s.+$/.test(input)) {
      output.push(input.match(/to\s(.+)$/)[1]);
    }
    return output;
  }
  // 构建手动查询标签
  genClickQueryTag() {
    let newNode = document.createElement("div");
    newNode.innerHTML = `<a sct_id='click2Query'> 询价</a>&nbsp;`;
    newNode.setAttribute("sct_cpt", "ACCAutomaticInquiry");
    newNode.setAttribute("sct_id", "click2Query");
    this.componentData.clickQueryTag = newNode;

    document.body.addEventListener("click", e => {
      if (e.target.tagName != "A") return;
      if (!e.target.parentElement) return;
      if (e.target.parentElement.getAttribute("sct_cpt") !== "ACCAutomaticInquiry") return;
      if (e.target.getAttribute("sct_id") == "click2Query") return this.cliclQueryHandle(e);
    })
  }
  // 获取当前价格和相对便宜
  async getMarketPriceAndOffset(node, realm, info) {
    let market_price = await tools.getMarketPrice(info[0], info[3], realm);
    let custom = this.getCustomPrice(realm, info[0], info[3]);
    if (custom != 0) market_price = custom;
    let market_price_offset = 0;
    try {
      market_price_offset = parseFloat(((info[4] / market_price - 1) * 100).toFixed(this.indexDBData.exactDigit));
      market_price_offset = market_price_offset > 0 ? `+${market_price_offset}` : market_price_offset.toString();
    } catch {
      market_price_offset = 0;
    }
    market_price = (market_price) ? tools.numberAddCommas(market_price) : "无";
    return { market_price, market_price_offset };
  }
  // 自定义参考标签生成
  genCustomSampleNode() {
    let newNode = document.createElement("a");
    newNode.innerText = " 自定义参考";
    newNode.setAttribute("sct_cpt", "ACCAutomaticInquiry");
    newNode.setAttribute("sct_id", "customSampleNode");
    newNode.style.opacity = "0.7";
    document.addEventListener('click', e => {
      if (e.target.tagName !== "A") return;
      if (e.target.getAttribute("sct_cpt") == "ACCAutomaticInquiry" && e.target.getAttribute("sct_id") == "customSampleNode")
        this.showEditCustom(this.queryNodeInfo(tools.getParentByIndex(e.target, 3).getAttribute("aria-label")));
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
  // 生成库存相关信息
  getWarehouseInfo(mode, resID, quality, realm) {
    let outputString = "";
    let target, list;
    switch (mode) {
      case 1: // 显示所有
        target = indexDBData.basisCPT.warehouse[realm].find(item => item.kind.db_letter == resID);
        target = (target) ? target.amount : 0;
        if (!target) return "T:0;";
        outputString = `T:${tools.numberAddCommas(target)}`;
        break;
      case 2: // 显示当前Q
        target = indexDBData.basisCPT.warehouse[realm].find(item => item.quality == quality && item.kind.db_letter == resID);
        target = (target) ? target.amount : 0;
        if (!target) return "Q:0;";
        outputString = `Q:${tools.numberAddCommas(target)}`;
        break;
      case 3: // 显示所有以及当前Q
        list = indexDBData.basisCPT.warehouse[realm].filter(item => item.kind.db_letter == resID);
        target = indexDBData.basisCPT.warehouse[realm].find(item => item.quality == quality && item.kind.db_letter == resID);
        target = (target) ? target.amount : 0;
        list = (list.length == 1) ? list[0].amount : list.reduce((a, b) => (a.amount || 0) + (b.amount || 0));
        outputString = `T:${tools.numberAddCommas(list)}; Q:${tools.numberAddCommas(target)}`;
        break;
      default:
        return "ERROR";
    }
    return outputString;
  }
}
new ACCAutomaticInquiry();
const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config, langData } = require("../tools/tools.js");

class inoutboundItemFilter extends BaseComponent {
  constructor() {
    super();
    this.name = "出入库物品过滤";
    this.describe = "在出入库界面对物品和q进行筛选";
    this.enable = false;
    this.tagList = ['出库', "入库", '过滤'];
  }
  componentData = {
    mainNode: undefined, // 筛选节点总容器
    loadFlag: false, // 加载标识
    itemNodeList: [], // 出入库节点列表
    lastURL: "", // 上次挂载的url节点
  }
  commonFuncList = [{// 出入库显示构建
    match: () => /headquarters\/warehouse\/incoming-contracts/.test(location.href) || /headquarters\/warehouse\/outgoing-contracts/.test(location.href),
    func: this.mainEtner
  }];
  cssText = [`div[sct_cpt='inoutboundItemFilter'][sct_id='main']{padding:5px 10px;}div[sct_cpt='inoutboundItemFilter'][sct_id='main']>div[sct_id='searchBar']>table{width:100%;}div[sct_cpt='inoutboundItemFilter'][sct_id='main']>div[sct_id='searchBar'] tr>td{padding:10px;}div[sct_cpt='inoutboundItemFilter'][sct_id='main']>div[sct_id='searchBar'] tr>td>*{width:100%;height:35px;font-size:20px;line-height:20px;}div[sct_cpt='inoutboundItemFilter'][sct_id='main']>div[sct_id='nameSearch']{padding:2px 10px;}div[sct_cpt='inoutboundItemFilter'][sct_id='main']>div[sct_id='nameSearch'] span{display:inline-block;width:max-content;height:fit-content;background-color:#000000;border:2px white solid;padding:2px 10px;border-radius:10px;cursor:pointer;margin:4px 5px;color:var(--fontColor);}div[sct_cpt='inoutboundItemFilter'][sct_id='main']>div[sct_id='nameSearch'] span:hover{background-color:#339841 !important;}`]

  // 识别 挂载 总容器节点
  mainEtner() {
    try {
      // 审查
      if (this.componentData.loadFlag) return;
      if (this.componentData.lastURL == location.href && document.querySelector(`div[sct_cpt = 'inoutboundItemFilter'][sct_id = 'main']`)) return;
      // 修改标识
      this.componentData.loadFlag = true;
      if (this.componentData.lastURL != location.href) {
        this.componentData.mainNode = undefined;
        document.querySelector(`div[sct_cpt = 'inoutboundItemFilter'][sct_id = 'main']`)?.remove();
        this.componentData.lastURL = location.href;
      }
      // 获取并挂载节点
      this.updateMainSearchNode();
      let mainNode = this.componentData.mainNode;
      let targetNode = document.querySelector("a[aria-label='Cancel contract']");
      if (!targetNode) return;
      let targetAfterNode = tools.getParentByIndex(targetNode, 4);
      targetNode = tools.getParentByIndex(targetAfterNode, 1);
      targetNode.insertBefore(mainNode, targetAfterNode);
    } catch (e) {
      tools.errorLog(e);
      this.componentData.loadFlag = false;
    } finally {
      this.componentData.loadFlag = false;
    }
  }

  // 主框点击事件
  mainClickHandle(e) {
    // console.log(`点击事件`, e.target);
    if (e.target.tagName == "BUTTON" && e.target.innerText == "搜索") return this.buttonSearch(tools.getParentByIndex(e.target, 2).querySelector("input"));
    if (e.target.tagName == "SPAN") return this.spanSearch(e.target);
  }

  // 主框按键事件
  mainKeyDownHandle(e) {
    // console.log(`按键事件`, e.key, e.target);
    if (e.key == "Enter" && e.target.tagName == "INPUT") return this.buttonSearch(e.target);
  }

  // 按钮搜索
  buttonSearch(target) {
    // console.log(target.value);
    let value = target.value;
    let quality = tools.getParentByIndex(target, 1).previousElementSibling.firstChild.selectedIndex;
    this.mainSearch(value, quality);
  }

  // span点击搜索
  spanSearch(target) {
    let newValue = target.innerText;
    if (target.innerText == "清空搜索") {
      tools.getParentByIndex(target, 2).querySelector("div[sct_id='searchBar'] select").selectedIndex = 0;
      newValue = "";
    }
    let targetInput = document.querySelector("div[sct_cpt='inoutboundItemFilter'][sct_id='main']>div[sct_id='searchBar'] input");
    targetInput.value = newValue;
    this.buttonSearch(targetInput);
  }

  // 实际搜索函数
  mainSearch(resName = "", quality = 0) {
    // console.log(`搜索目标：${resName} 品质：${quality}`);
    // 获取节点列表
    let itemNodeList = this.componentData.itemNodeList;
    // 循环获取信息并匹配更改是否显示
    for (let i = 0; i < itemNodeList.length; i++) {
      let itemNode = itemNodeList[i];
      itemNode.style.display = "";
      if (resName == "") continue;
      // [resID, name, quantity, quality, unitPrice, totalPrice, from/to]
      let nodeInfo = this.queryNodeInfo(itemNode.getAttribute("aria-label"));
      if (resName == nodeInfo[1] && nodeInfo[3] >= quality) continue;
      itemNode.style.display = "none";
    }
  }

  // 更新节点
  updateMainSearchNode() {
    // 检测无 新建挂载到内存
    if (!this.componentData.mainNode) {
      let newMainNode = document.createElement("div");
      newMainNode.setAttribute("sct_cpt", "inoutboundItemFilter");
      newMainNode.setAttribute("sct_id", "main");
      newMainNode.innerHTML = `<div sct_id=searchBar><table><tr><td><select><option value=0>0<option value=1>1<option value=2>2<option value=3>3<option value=4>4<option value=5>5<option value=6>6<option value=7>7<option value=8>8<option value=9>9<option value=10>10<option value=11>11<option value=12>12</select><td><input placeholder=物品名><td><button class="btn form-control">搜索</button></table></div><div sct_id=nameSearch></div>`;
      newMainNode.addEventListener("click", e => this.mainClickHandle(e));
      newMainNode.addEventListener("keydown", e => this.mainKeyDownHandle(e));
      this.componentData.mainNode = newMainNode;
    }
    // 从内存读取
    let mainNode = this.componentData.mainNode;
    // 读取节点信息
    let itemNodeList = Object.values(document.querySelectorAll("a[aria-label='Cancel contract']")).map(node => tools.getParentByIndex(node, 3));
    this.componentData.itemNodeList = itemNodeList;
    // 读取节点资料并更新选择框
    let htmlText = `<span>清空搜索</span>`
    for (let i = 0; i < itemNodeList.length; i++) {
      let itemNode = itemNodeList[i];
      // [resID, name, quantity, quality, unitPrice, totalPrice, from/to]
      let nodeInfo = this.queryNodeInfo(itemNode.getAttribute("aria-label"));
      htmlText += `<span>${nodeInfo[1]}</span>`;
    }
    mainNode.querySelector("div[sct_id='nameSearch']").innerHTML = htmlText;
    // 清空原有的填空与选择
    mainNode.querySelector(`div[sct_id="searchBar"] select`).selectedIndex = 0;
    mainNode.querySelector(`div[sct_id="searchBar"] input`).value = "";
  }

  // 读取节点资料
  queryNodeInfo(input) {
    // [resID, name, quantity, quality, unitPrice, totalPrice, from/to]
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
}
new inoutboundItemFilter();
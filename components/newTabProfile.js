const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 使用新建标签页打开公司页
class newTabProfile extends BaseComponent {
  constructor() {
    super();
    this.name = "使用新建标签页打开公司页";
    this.describe = '通过事件委派拦截所有前往a的';
    this.enable = false; // 默认关闭
    this.tagList = ['实用'];
  }
  indexDBData = {
    activeZone_market: true, // 交易所是否激活
    activeZone_chat: true, // 聊天室是否激活
    activeZone_warehouse: true, // 仓库/库存是否激活
    activeZone_search: true, // 搜索是否激活
  }
  startupFuncList = [
    this.mainFunc
  ]
  settingUI = () => {
    let newNode = document.createElement("div");
    let htmlText = `<div class="header">使用新建标签页打开公司页组件设置</div><div class="container"><div><button class="btn script_opt_submit">保存更改</button></div><table><thead><tr><td>应用范围</td><td>开关</td></tr></thead><tbody>`;
    htmlText += `<tr><td title="是否在交易所场景中使用新标签页访问别家公司详情">交易所页面</td><td><input class="form-control" type="checkbox" ${this.indexDBData.activeZone_market ? "checked" : ""}></td></tr>`
    htmlText += `<tr><td title="是否在聊天页面中使用新标签页访问别家公司详情">聊天页面</td><td><input class="form-control" type="checkbox" ${this.indexDBData.activeZone_chat ? "checked" : ""}></td></tr>`
    htmlText += `<tr><td title="是否在库存/仓库页面中使用新标签页访问别家公司详情">库存/仓库页面</td><td><input class="form-control" type="checkbox" ${this.indexDBData.activeZone_warehouse ? "checked" : ""}></td></tr>`
    htmlText += `<tr><td title="是否在搜索页面中使用新标签页访问别家公司详情">搜索页面</td><td><input class="form-control" type="checkbox" ${this.indexDBData.activeZone_search ? "checked" : ""}></td></tr>`
    htmlText += `</tbody></table></div>`;
    newNode.id = "script_newTabProfile_setting";
    newNode.innerHTML = htmlText;
    newNode.querySelector("button.script_opt_submit").addEventListener("click", () => this.settingSubmit());
    return newNode;
  }
  settingSubmit() {
    let valueList = Object.values(document.querySelectorAll("div#script_newTabProfile_setting input[type='checkbox']")).map(node => node.checked);
    this.indexDBData.activeZone_market = valueList[0];
    this.indexDBData.activeZone_chat = valueList[1];
    this.indexDBData.activeZone_warehouse = valueList[2];
    this.indexDBData.activeZone_search = valueList[3];
    tools.indexDB_updateIndexDBData();
    tools.alert("保存并记录");
  }
  // 添加root标签事件分发
  mainFunc(window) {
    let targetNode = document.querySelector("div#root");
    if (!targetNode) return setTimeout(() => this.mainFunc(undefined), 1000);
    targetNode.addEventListener('click', event => this.clickHandle(event));
  }
  // 进行事件分发
  clickHandle(event) {
    try {
      // 屏蔽dom事件 以及没有指向的事件
      if (!event.target) return;
      // 检查当前是否符合开启标准
      let matchList = [
        Boolean(this.indexDBData.activeZone_market && /market\/resource\/\d+\/$/.test(location.href)), // 交易所检测
        Boolean(this.indexDBData.activeZone_chat && /messages\/.+\/$/.test(location.href)), // 聊天室检测
        Boolean(this.indexDBData.activeZone_warehouse && /headquarters\/warehouse\//.test(location.href)), // 聊天室检测
        Boolean(this.indexDBData.activeZone_search && /search\//.test(location.href)), // 聊天室检测
      ];
      if (!matchList.includes(true)) return;
      let result = this.nodeTagCheck(event.target);
      if (!result || !result[0]) return;
      window.open(result[1]);
      event.preventDefault();
    } catch (error) {
      tools.errorLog(error);
    }
  }
  nodeTagCheck(node, index = 0) {
    let realm = runtimeData.basisCPT.realm;
    let myName = indexDBData.basisCPT.userInfo[realm].authCompany.company;
    if (index >= 3) return [false, ""];
    let reg = /\/.+\/company\/\d+\/.+\//;
    if (node.tagName == "A" && node.getAttribute("href")) {
      if (node.getAttribute("href").match(myName)) return [false, ""];
      if (reg.test(node.getAttribute("href"))) return [true, node.getAttribute("href")];
    }
    return this.nodeTagCheck(node.parentElement, ++index);
  }
}
new newTabProfile();
const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class chatFilter extends BaseComponent {
  constructor() {
    super();
    this.name = "聊天信息过滤/高亮";
    this.describe = "在聊天界面,隐藏/高亮符合规则的信息";
    this.enable = false;
    this.tagList = ['聊天', '过滤'];
  }
  indexDBData = {
    checkMode: 0, // 匹配模式 0-列表匹配 1-正则匹配
    // 列表匹配方案
    hide_item: ["fuck", "妈的", "媽的", "shit"], // 隐藏 列表
    hightLight_item: [], // 高亮 列表
    // 正则匹配方案
    hide_reg: new RegExp(), // 过滤 正则
    highLight_reg: new RegExp(), // 高亮 正则
  }
  chatMsgFuncList = [this.mainCheck]
  cssText = [
    `@keyframes script_borderColorChange{0%{border-color:#ff0000;}50%{border-color:#00ff00;}100%{border-color:#ff0000;}}.script_chatFilter_hightLightClass{border:5px solid;animation:script_borderColorChange 2s infinite linear;}.script_chatFilter_hideClass{opacity:0.05;transition:ease-in-out 0.1s;}.script_chatFilter_hideClass:hover{opacity:0.9;}`
  ]

  // 设置界面
  settingUI = () => {
    let mainNode = document.createElement("div");
    let htmlText = `<div class="header">聊天信息过滤/高亮设置</div><div class="container"><div><button class="btn script_opt_submit">保存更改</button></div>`;
    htmlText += `<table><thead><tr><td>功能<td>设置<tbody><tr><td title="启用一种,另一种模式会直接失效\n[默认]列表匹配 - 匹配上任意一个列表中的内容就会响应 \n正则匹配 - 使用正则的匹配纯文本">匹配模式<td><select class=form-control><option value=0>列表匹配<option value=1>正则匹配</select><tr><td>高亮正则<td><input value="#####" class=form-control><tr><td>过滤正则<td><input value="#####" class=form-control></table>`
    htmlText = htmlText.replace("#####", `/${this.indexDBData.highLight_reg.source}/${this.indexDBData.highLight_reg.flags}`); // 高亮正则
    htmlText = htmlText.replace("#####", `/${this.indexDBData.hide_reg.source}/${this.indexDBData.hide_reg.flags}`); // 过滤正则
    htmlText += `<table><thead><tr><td>高亮的内容</td><td>删除</td></tr></thead><tbody>`;
    for (let i = 0; i < this.indexDBData.hightLight_item.length; i++) {
      htmlText += `<tr><td><input class="form-control" value="${this.indexDBData.hightLight_item[i]}"></td><td><button class="btn script_chatFilter_delete">删除</button></td></tr>`;
    }
    htmlText += `</tbody></table><button class="btn" style="width: 100%;" id="script_chatFilter_add">添加</button><table><thead><tr><td>过滤/屏蔽的内容</td><td>删除</td></tr></thead><tbody>`;
    for (let i = 0; i < this.indexDBData.hide_item.length; i++) {
      htmlText += `<tr><td><input class="form-control" value="${this.indexDBData.hide_item[i]}"></td><td><button class="btn script_chatFilter_delete">删除</button></td></tr>`;
    }
    htmlText += `</tbody></table><button class="btn" style="width: 100%;" id="script_chatFilter_add">添加</button></div>`;
    mainNode.id = "script_chatFiletr_setting";
    mainNode.innerHTML = htmlText;
    mainNode.querySelector("select").value = this.indexDBData.checkMode;
    mainNode.querySelector("select").addEventListener("change", e => this.settingModeChange(e));
    mainNode.querySelector("select").dispatchEvent(new Event("change"));
    mainNode.addEventListener('click', event => this.settingClick(event));
    return mainNode;
  }
  // 匹配模式切换
  settingModeChange(e) {
    let nowMode = Number(e.target.value);
    if (nowMode == 0) {
      // 关闭正则显示
      let tempNode = tools.getParentByIndex(e.target, 2);
      tempNode.nextElementSibling.style.display = "none";
      tempNode.nextElementSibling.nextElementSibling.style.display = "none";
      // 打开列表显示
      tempNode = tools.getParentByIndex(e.target, 4);
      let nextElement = tempNode.nextElementSibling;
      while (nextElement != null) {
        nextElement.style.display = "";
        nextElement = nextElement.nextElementSibling;
      }
    } else if (nowMode == 1) {
      // 打开正则显示
      let tempNode = tools.getParentByIndex(e.target, 2);
      tempNode.nextElementSibling.style.display = "";
      tempNode.nextElementSibling.nextElementSibling.style.display = "";
      // 关闭列表显示
      tempNode = tools.getParentByIndex(e.target, 4);
      let nextElement = tempNode.nextElementSibling;
      while (nextElement != null) {
        nextElement.style.display = "none";
        nextElement = nextElement.nextElementSibling;
      }
    }
  }
  // 设置界面被点击事件分发
  settingClick(event) {
    if (event.target.id == "script_chatFilter_add") return this.settingAddNode(event);
    if (/script_opt_submit/.test(event.target.className)) return this.settingSubmit(event);
    if (/script_chatFilter_delete/.test(event.target.className)) return this.settingDeleteOne(event);
  }
  // 提交更改
  settingSubmit(event) {
    let root = tools.getParentByIndex(event.target, 3);
    let tableList = Object.values(root.querySelectorAll("table"));
    let baseConf = Object.values(tableList[0].querySelectorAll("input, select")).map(node => node.value);
    let highLightList = Object.values(tableList[1].querySelectorAll("input")).map(node => node.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    let hideList = Object.values(tableList[2].querySelectorAll("input")).map(node => node.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // 检查空内容
    if (baseConf[1] == "") baseConf[1] = "/(?:)/";
    if (baseConf[2] == "") baseConf[2] = "/(?:)/";
    if (!tools.regStringCheck(baseConf[1]) || !tools.regStringCheck(baseConf[2])) return tools.alert("正则表达式语法不正确");
    if (highLightList.filter(value => value == "").length != 0) return tools.alert("内容不能为空");
    if (hideList.filter(value => value == "").length != 0) return tools.alert("内容不能为空");
    // 保存并刷新
    this.indexDBData.checkMode = Number(baseConf[0]);
    this.indexDBData.highLight_reg = new RegExp(baseConf[1].replace(/^\//, "").replace(/\/[img]*$/, ""), baseConf[1].match(/\/([img])*$/)[1]);
    this.indexDBData.hide_reg = new RegExp(baseConf[2].replace(/^\//, "").replace(/\/[img]*$/, ""), baseConf[2].match(/\/([img])*$/)[1]);
    this.indexDBData.hightLight_item = highLightList;
    this.indexDBData.hide_item = hideList;
    tools.indexDB_updateIndexDBData();
    tools.alert("已提交更改.");
  }
  // 添加元素
  settingAddNode(event) {
    let targetNode = event.target.previousElementSibling.querySelector("tbody");
    let newNode = document.createElement("tr");
    newNode.innerHTML = `<td><input class="form-control"></td><td><button class="btn script_chatFilter_delete">删除</button></td>`;
    targetNode.appendChild(newNode);
  }
  // 删除元素
  settingDeleteOne(event) {
    tools.getParentByIndex(event.target, 2).remove();
  }

  // 功能处理主函数
  mainCheck(mainNode, textList) {
    let targetNodeList = mainNode.childNodes[2].childNodes;
    for (let i = 0; i < targetNodeList.length; i++) {
      let singleNode = targetNodeList[i]
      let text = textList[i];
      // 过滤class
      if (/script_chatFilter_hideClass/.test(singleNode.childNodes[0].className) || /script_chatFilter_hightLightClass/.test(singleNode.childNodes[0].className))
        continue;
      // 使用匹配模式
      if (this.checkSubString(text, this.indexDBData.hide_item, this.indexDBData.hide_reg)) {
        // 屏蔽做法
        singleNode.childNodes[0].className += ` script_chatFilter_hideClass`;
      } else if (this.checkSubString(text, this.indexDBData.hightLight_item, this.indexDBData.highLight_reg)) {
        // 高亮做法
        singleNode.childNodes[0].className += ` script_chatFilter_hightLightClass`;
      }
    }
  }
  // 判断分发
  checkSubString = (text, list, reg) => {
    switch (this.indexDBData.checkMode) {
      case 0: // 列表匹配模式
        return this.listModeCheck(text, list);
      case 1: // 正则匹配模式
        return this.regModeCheck(text, reg);
    }
  }
  // 列表匹配
  listModeCheck = (longString, arr) => arr.some(value => longString.indexOf(value) != -1)
  // 正则匹配
  regModeCheck = (text, reg) => reg.test(text);
}

new chatFilter();
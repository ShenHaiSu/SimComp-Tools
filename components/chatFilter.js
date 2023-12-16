const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class chatFilter extends BaseComponent {
  constructor() {
    super();
    this.name = "聊天信息过滤/高亮";
    this.describe = "在聊天界面,隐藏/高亮符合规则的信息";
    this.enable = false;
  }
  indexDBData = {
    hide_item: ["fuck", "妈的", "媽的", "shit"], // 隐藏 列表
    hightLight_item: [], // 高亮 列表
  }
  chatMsgFuncList = [
    this.mainCheck
  ]
  cssText = [
    `@keyframes script_borderColorChange{0%{border-color:#ff0000;}50%{border-color:#00ff00;}100%{border-color:#ff0000;}}.script_chatFilter_hightLightClass{border:5px solid;animation:script_borderColorChange 2s infinite linear;}.script_chatFilter_hideClass{opacity:0.05;transition:ease-in-out 0.1s;}.script_chatFilter_hideClass:hover{opacity:0.9;}`
  ]

  // 设置界面
  settingUI = () => {
    let mainNode = document.createElement("div");
    let htmlText = `<div class="header">聊天信息过滤/高亮设置</div><div class="container"><div><button class="btn script_opt_submit">保存更改</button></div><table><thead><tr><td>高亮的内容</td><td>删除</td></tr></thead><tbody>`;
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
    mainNode.addEventListener('click', event => this.settingClick(event));
    return mainNode;
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
    let highLightList = Object.values(tableList[0].querySelectorAll("input")).map(node => node.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    let hideList = Object.values(tableList[1].querySelectorAll("input")).map(node => node.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // 检查空内容
    if (highLightList.filter(value => value == "").length != 0) return tools.alert("内容不能为空");
    if (hideList.filter(value => value == "").length != 0) return tools.alert("内容不能为空");
    // 保存并刷新
    this.indexDBData.hightLight_item = highLightList;
    this.indexDBData.hide_item = hideList;
    tools.indexDB_updateIndexDBData();
    tools.alert("已提交更改.");
  }
  // 添加元素
  settingAddNode(event) {
    let targetNode = event.target.previousElementSibling.querySelector("tbody");
    let newNode = document.createElement("tr");
    newNode.innerHTML = `<td><input class="form-control"></td><td><button class="btn script_globalBlock_delete">删除</button></td>`;
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
      if (this.checkSubString(this.indexDBData.hide_item, text) && !/script_chatFilter_hideClass/.test(singleNode.childNodes[0].className)) {
        // 屏蔽做法
        singleNode.childNodes[0].className += ` script_chatFilter_hideClass`;
      } else if (this.checkSubString(this.indexDBData.hightLight_item, text) && !/script_chatFilter_hightLightClass/.test(singleNode.childNodes[0].className)) {
        // 高亮做法
        singleNode.childNodes[0].className += ` script_chatFilter_hightLightClass`;
      }
    }
  }
  // 检查文本包含
  checkSubString = (arr, longString) => arr.some(value => longString.indexOf(value) != -1)
}

new chatFilter();
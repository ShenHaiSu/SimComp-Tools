const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 自定义生产数量按钮
class customQuantityButton extends BaseComponent {
  constructor() {
    super();
    this.name = "自定义生产数量按钮";
    this.describe = "只想生产24小时？没有问题！只想生产12小时？也没问题！\n只要你想 都能自定义填入！";
    this.enable = false;
    this.tagList = ['快捷'];
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/\/b\/\d+\/$/)),
    func: this.mainFunc
  }]
  indexDBData = {
    buttonText: "12hr", // 按钮文本
    otherTextList: [], // 更多按钮列表
  }
  componentData = {
    lastURL: "", // 最近的一次url
    onload: false, // 是否正在挂载
    buttonNode: undefined, // 按钮节点
  }
  cssText = [`button[sct_cpt='customQuantityButton'][sct_id='script_custom_button']{margin-right:3px;text-transform:none !important;}`]
  settingUI = () => {
    let newNode = document.createElement("div");
    let htmlText = `<div class="header">自定义生产数量按钮</div><div class="container"><div><div><button class="btn script_opt_submit">保存</button></div></div><table><thead><tr><td>功能</td><td colspan="2">设置</td></tr></thead><tbody><tr><td title="按钮的内容会直接填写在格子中">按钮文本</td><td colspan="2"><input class="form-control" value="######"></td></tr>`;
    htmlText = htmlText.replace("######", this.indexDBData.buttonText);
    for (let i = 0; i < this.indexDBData.otherTextList.length; i++) {
      let text = this.indexDBData.otherTextList[i];
      htmlText += `<tr><td><span>额外按钮</span></td><td><input class="form-control" value="${text}"></td><td><button class="btn form-control" sct_cpt="customQuantityButton" sct_id="deleteOne">删除</button></td></tr>`
    }
    htmlText += `<tr><td colspan=3><button class="btn form-control"sct_cpt=customQuantityButton sct_id=addNewText>添加</button></tbody></table></div>`;
    newNode.innerHTML = htmlText;
    newNode.id = "setting-container-8";
    newNode.className = "col-sm-12 setting-container";
    // 按键函数挂载
    newNode.addEventListener("click", e => this.settingClickHandle(e));
    // 返回元素
    return newNode;
  }
  settingClickHandle(event) {
    if (event.target.className == `btn script_opt_submit`) return this.settingSubmitHandle();
    if (event.target.getAttribute("sct_id") == "deleteOne") return this.settingDeleteOne(event);
    if (event.target.getAttribute("sct_id") == "addNewText") return this.settingAddNewText(event);
  }
  // 设置数据提交
  settingSubmitHandle() {
    // 数据更新
    let valueList = [];
    document.querySelectorAll("#setting-container-8 input").forEach((item) => valueList.push(item.value));
    // 审查数据 预处理数据
    if (valueList[0] == "") valueList[0] = "12hr";
    if (valueList.some(item => !Boolean(item))) return tools.alert("不能为空");
    // 保存
    this.indexDBData.buttonText = valueList[0];
    valueList.splice(0,1);
    this.indexDBData.otherTextList = valueList;
    tools.indexDB_updateIndexDBData();
    // 清除已有元素并重新挂载
    document.querySelectorAll("button[sct_cpt='customQuantityButton'][sct_id='script_custom_button']").forEach(node => node.remove());
    this.mainFunc();
    tools.alert("已提交更改。");
  }
  // 删除一个数据
  settingDeleteOne(event) {
    tools.getParentByIndex(event.target, 2).remove();
  }
  // 添加一个数据
  settingAddNewText(event) {
    let targetNode = tools.getParentByIndex(event.target, 3);
    let beforeNode = tools.getParentByIndex(event.target, 2);
    let newNode = document.createElement("tr");
    newNode.innerHTML = `<td><span>额外按钮</span></td><td><input class="form-control"></td><td><button class="btn form-control" sct_cpt="customQuantityButton" sct_id="deleteOne">删除</button></td>`;
    targetNode.insertBefore(newNode, beforeNode);
  }
  mainFunc(event, mode) {
    try {
      let urlMatch = this.componentData.lastURL == location.href;
      let nodeMatch = document.querySelectorAll("button[sct_cpt='customQuantityButton'][sct_id='script_custom_button']").length != 0;
      let onload = this.componentData.onload;
      let forceMode = mode == "force";
      if ((urlMatch && nodeMatch && !forceMode) || onload) return;
      this.componentData.onload = true;
      if (!this.componentData.buttonNode) this.genButtonNode();
      document.querySelectorAll("h3 > svg").forEach((node) => this.addButtonNode(node));
      this.componentData.onload = false;
      this.componentData.lastURL = location.href;
    } catch {
      this.componentData.onload = false;
      this.componentData.lastURL = "";
      document.querySelectorAll("button[sct_cpt='customQuantityButton'][sct_id='script_custom_button']").forEach(node => node.remove());
    }
  }
  // 生成按钮节点到
  genButtonNode() {
    let newNode = document.createElement("button");
    newNode.className = `script_custom_button`;
    Object.assign(newNode, { type: "button", role: "button" });
    newNode.setAttribute("sct_cpt", "customQuantityButton");
    newNode.setAttribute("sct_id", "script_custom_button");
    this.componentData.buttonNode = newNode;

    document.body.addEventListener("click", e => {
      if (e.target.tagName !== "BUTTON") return;
      if (e.target.getAttribute("sct_cpt") !== "customQuantityButton") return;
      if (e.target.getAttribute("sct_id") !== "script_custom_button") return;
      let target_node = e.target.parentElement.parentElement.querySelector("input");
      let target_text = e.target.innerText;
      target_node.click();
      tools.setInput(target_node, target_text);
      e.preventDefault();
    })
  }
  // 添加到DOM位置
  addButtonNode(node) {
    // 添加单常规按钮
    let targetNode = node.parentElement.parentElement.querySelector("div > button").parentElement;
    let newNode = this.componentData.buttonNode.cloneNode(true);
    let commonClass = targetNode.querySelector("button").className;
    newNode.className += ` ${commonClass}`;
    newNode.innerText = this.indexDBData.buttonText;
    targetNode.prepend(newNode);
    // 添加其他额外按钮
    if (this.indexDBData.otherTextList.length == 0) return;
    for (let i = 0; i < this.indexDBData.otherTextList.length; i++) {
      newNode = this.componentData.buttonNode.cloneNode(true);
      newNode.className += ` ${commonClass}`;
      newNode.innerText = this.indexDBData.otherTextList[i];
      targetNode.prepend(newNode);
    }
  }
}
new customQuantityButton();
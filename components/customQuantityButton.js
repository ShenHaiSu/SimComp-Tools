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
    otherTextList: ["testM"], // 更多按钮列表
  }
  componentData = {
    lastURL: "", // 最近的一次url
    onload: false, // 是否正在挂载
    buttonNode: undefined, // 按钮节点
  }
  cssText = [`button[sct_cpt='customQuantityButton'][sct_id='script_custom_button']{margin-right:3px;text-transform:none !important;}`]
  settingUI = () => {
    let newNode = document.createElement("div");
    let htmlText = `<div><div class='header'>自定义生产数量按钮</div><div class=container><div><div><button class="btn script_opt_submit">保存</button></div></div><table><tr style=height:60px><td>功能<td>设置<tr><td title=按钮的内容会直接填写在格子中>按钮文本<td><input class='form-control' value=#####></table></div></div>`;
    htmlText = htmlText.replace("#####", this.indexDBData.buttonText);
    newNode.innerHTML = htmlText;
    newNode.id = "setting-container-8";
    newNode.className = "col-sm-12 setting-container";
    // 按键函数挂载
    newNode.querySelector("button.btn.script_opt_submit").addEventListener("click", () => this.settingSubmitHandle());
    // 返回元素
    return newNode;
  }
  settingSubmitHandle() {
    // 数据更新
    let valueList = [];
    document.querySelectorAll("#setting-container-8 input").forEach((item) => valueList.push(item.value));
    if (valueList[0] == "") valueList[0] = "12hr";
    this.indexDBData.buttonText = valueList[0];
    tools.indexDB_updateIndexDBData();
    // 清除已有元素并重新挂载
    document.querySelectorAll("button[sct_cpt='customQuantityButton'][sct_id='script_custom_button']").forEach(node => node.remove());
    this.mainFunc();
    tools.alert("已提交更改。");
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
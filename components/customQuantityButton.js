const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 自定义生产数量按钮
class customQuantityButton extends BaseComponent {
  constructor() {
    super();
    this.name = "自定义生产数量按钮";
    this.describe = "只想生产24小时？没有问题！只想生产12小时？也没问题！\n只要你想 都能自定义填入！";
    this.enable = true;
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/\/b\/\d+\/$/)),
    func: this.mainFunc
  }]
  indexDBData = {
    buttonText: "12hr", // 按钮文本
  }
  componentData = {
    lastURL: "", // 最近的一次url
    onload: false, // 是否正在挂载
  }
  cssText = [`button.btn.script_custom_button{margin-right: 3px;}`]
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
    document.querySelectorAll("button.btn.script_custom_button").forEach(node => node.remove());
    this.mainFunc();
    tools.alert("已提交更改。");
  }
  mainFunc(event, mode) {
    try {
      let urlMatch = this.componentData.lastURL == location.href;
      let nodeMatch = document.querySelectorAll("button.btn.script_custom_button").length != 0;
      let onload = this.componentData.onload;
      let forceMode = mode == "force";
      if ((urlMatch && nodeMatch && !forceMode) || onload) return;
      this.componentData.onload = true;
      document.querySelectorAll("h3 > svg").forEach((node) => {
        tools.log(node);
        let targetNode = node.parentElement.parentElement.querySelector("div > button").parentElement;
        let newNode = document.createElement("button");
        newNode.className = `btn script_custom_button ${targetNode.querySelector("button").className}`;
        newNode.innerText = this.indexDBData.buttonText;
        Object.assign(newNode, { type: "button", role: "button" });
        targetNode.prepend(newNode);
        newNode.addEventListener("click", (event) => {
          let target_node = event.target.parentElement.parentElement.querySelector("input");
          let target_text = event.target.innerText;
          tools.setInput(target_node, target_text);
          event.preventDefault();
        });
      });
      this.componentData.onload = false;
      this.componentData.lastURL = location.href;
    } catch {
      this.componentData.onload = false;
      this.componentData.lastURL = "";
      document.querySelectorAll("button.btn.script_custom_button").forEach(node => node.remove());
    }
  }
}
new customQuantityButton();
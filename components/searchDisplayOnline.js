const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 标签搜索仅显示在线公司
class searchDisplayOnline extends BaseComponent {
  constructor() {
    super();
    this.name = "标签搜索仅显示在线公司";
    this.describe = "在标签搜索公司的界面上方增加一个按钮\n点击即可切换仅显示在线玩家";
    this.enable = true;
    this.canDisable = true;
    this.tagList = ['实用', '过滤'];
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/\/market\/tag-search\/.+\//)),
    func: this.mainFunc
  }];
  componentData = {
    button_node: undefined, // 按钮创建标志
    showFlag: false, // 是否仅显示在线公司
  }
  mainFunc() {
    let targetNode = document.querySelector("div > h1 > svg").parentElement;
    if (!this.componentData.button_node && targetNode.querySelectorAll("button").length == 0) {
      // 运行时数据未挂载 并且界面无挂载标签
      let newNode = document.createElement("button");
      Object.assign(newNode.style, { fontSize: "17px", backgroundColor: "none", color: feature_config.fontColor });
      newNode.className = "btn";
      newNode.innerText = "仅显示在线";
      this.componentData.button_node = newNode;
      targetNode.appendChild(this.componentData.button_node);
      newNode.addEventListener("click", () => this.buttonHandle());
    } else if (this.componentData.button_node && targetNode.querySelectorAll("button").length == 0) {
      // 运行时数据已挂载 但是界面无挂载标签
      targetNode.appendChild(this.componentData.button_node);
    } else {
      return;
    }
  }

  buttonHandle() {
    let button_node = this.componentData.button_node;
    let flag;
    tools.log("当前搜索界面仅显示在线标记为：", this.componentData.showFlag);
    if (this.componentData.showFlag) {
      // 已开启仅显示在线 要切换到未开启
      Object.assign(button_node.style, { backgroundColor: "rgb(107,107,107)" });
      this.componentData.showFlag = false;
      flag = "";
    } else {
      // 未开启仅显示在线 要切换到已开启
      Object.assign(button_node.style, { backgroundColor: "green" });
      this.componentData.showFlag = true;
      flag = "none";
    }
    let elements = document.querySelectorAll("div > div.row > div.col-sm-6");
    for (let i = 0; i < elements.length; i++) {
      let item = elements[i];
      let text = item.querySelector("div.pull-right").nextElementSibling.innerText;
      if (text !== "n/a" && text !== "offline") continue;
      item.style.display = flag;
    }
  }
}
new searchDisplayOnline();
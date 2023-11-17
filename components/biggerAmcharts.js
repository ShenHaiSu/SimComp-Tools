const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 总览与财报界面图表放大
class biggerAmcharts extends BaseComponent {
  constructor() {
    super();
    this.name = "图表放大";
    this.describe = "在总览页面或者财报页面点一下空白处触发检测就会放大图表\n灵感来源：Sim Companies Visual Improvements\nhttps://greasyfork.org/en/scripts/432355-sim-companies-visual-improvements";
    this.enable = true;
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/headquarters\/(accounting\/|overview\/$)/)),
    func: this.mainFunc
  }];
  mainFunc() {
    let url = location.href;
    if (url.endsWith("headquarters/overview/")) {
      // 总览界面
      let target_node = document.querySelector("div.row > div.col-sm-6 > div > div > div");
      Object.assign(target_node.style, { height: "600px" });
      let msg_node = target_node.parentElement.parentElement.parentElement.parentElement.lastChild;
      msg_node.className = "col-sm-6 text-center";
      if (msg_node.querySelectorAll("br").length > 1) return;
      msg_node.lastChild.prepend(document.createElement("br"));
      msg_node.lastChild.prepend(document.createElement("br"));
      msg_node.lastChild.prepend(document.createElement("br"));
    } else {
      // 财务界面
      let target_node = document.querySelector("div.col-md-9 > div > div > div > div > div.amcharts-main-div");
      target_node = target_node.parentElement;
      Object.assign(target_node.style, { height: "600px" });
      // target_node.style.height = "600px";
    }
  }
}
new biggerAmcharts();
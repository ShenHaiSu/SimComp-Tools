const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 交易行按钮旁高提醒
class marketHighReminder extends BaseComponent {
  constructor() {
    super();
    this.name = "交易行按钮旁高提醒";
    this.describe = "交易行旁按钮高提醒，提示当前是R1还是R2";
    this.enable = true;
    this.tagList = ['样式',"交易所"];
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/market\/resource\/(\d+)\//)),
    func: this.mainFunc
  }];
  mainFunc() {
    let srcString = document.querySelectorAll(".navbar-container img")[0].src;
    let target_node = document.querySelector("form input[name='quantity']");
    Object.assign(target_node.style, {
      background: `url('${srcString}')`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "contain",
      backgroundPosition: "right",
    });
  }
}
new marketHighReminder();
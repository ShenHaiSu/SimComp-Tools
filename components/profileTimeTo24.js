const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");


// 时间转换为24小时制
class profileLocalTimeConvertTo24 extends BaseComponent {
  constructor() {
    super();
    this.name = "当地时间转换为24小时制";
    this.describe = "公司资料页面中的 当地时间 自动从12小时制转换为24小时制";
    this.enable = true;
    this.canDisable = true;
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/company\/(0|1)\/.*\//)),
    func: this.mainFunc
  }];
  mainFunc() {
    let elements = document.querySelectorAll("div > table > tbody > tr > td");
    let element;
    if (elements.length == 0) return;
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].innerText != "当地时间") continue;
      element = elements[i + 1];
      break;
    }
    let result = tools.convert12To24Hr(element.innerText);
    element.innerText = result ? result : element.innerText;
  }
}
new profileLocalTimeConvertTo24();

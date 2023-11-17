const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");


// 公司地图界面隐藏滚动条
class mapHideScroll extends BaseComponent {
  constructor() {
    super();
    this.name = "公司地图界面隐藏滚动条";
    this.describe = "如名";
    this.enable = true;
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/landscape\/$/)),
    func: this.mainFunc
  }, {
    match: () => !Boolean(location.href.match(/landscape\/$/)),
    func: this.setBack
  }];
  mainFunc() {
    let target = document.querySelector("div#root div#page");
    if (!target) return;
    target.style.overflow = "hidden";
  }
  setBack() {
    let target = document.querySelector("div#root div#page");
    if (!target) return;
    target.style.overflow = "";
  }
}
new mapHideScroll();
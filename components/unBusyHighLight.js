const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class unBusyHighLight extends BaseComponent {
  constructor() {
    super();
    this.name = "空闲建筑高亮";
    this.describe = "如题";
    this.enable = false; // 默认关闭
  }
  commonFuncList = [{
    match: () => Boolean(/landscape\/$/.test(location.href)),
    func: this.mainFunc
  }]
  cssText = [
    `@keyframes script_fontSizeAnimation{0%{font-size:14px;}50%{font-size:20px;}100%{font-size:14px;}}.script_unBusyHighLight_aTag{animation:script_fontSizeAnimation 1s infinite;}`
  ]

  async mainFunc() {
    let realm = await tools.getRealm();
    let unBusyList = indexDBData.basisCPT.building[realm]
      .filter(build => build.busy == undefined)
      .map(build => build.id + "");
    let buildingList = Object.values(document.querySelectorAll("div#page>div>div>div>div>a"))
      .filter(build => /\/b\/(\d+)\/$/.test(build.href) && unBusyList.includes(build.href.match(/\/b\/(\d+)\/$/)[1]))
      .filter(build => !/script_unBusyHighLight_aTag/.test(build.className));

    for (let i = 0; i < buildingList.length; i++) {``
      buildingList[i].className += ` script_unBusyHighLight_aTag`;
    }
  }
}
new unBusyHighLight();
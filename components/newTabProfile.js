const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 使用新建标签页打开公司页
class newTabProfile extends BaseComponent {
  constructor() {
    super();
    this.name = "使用新建标签页打开公司页";
    this.describe = '通过事件委派拦截所有前往a的';
    this.enable = true;
  }
  startupFuncList = [
    this.mainFunc
  ]
  mainFunc(window) {
    let targetNode = document.querySelector("div#root");
    if (!targetNode) return setTimeout(() => this.mainFunc(undefined), 1000);
    targetNode.addEventListener('click', event => this.clickHandle(event));
  }
  clickHandle(event) {
    if (!event.target) return;
    let result = this.nodeTagCheck(event.target);
    if (!result || !result[0]) return;
    window.open(result[1]);
    event.preventDefault();
  }
  nodeTagCheck(node, index = 0) {
    let realm = runtimeData.basisCPT.realm;
    let myName = indexDBData.basisCPT.userInfo[realm].authCompany.company;
    if (index >= 3) return [false, ""];
    let reg = /\/.+\/company\/\d+\/.+\//;
    if (node.tagName == "A" && node.getAttribute("href")) {
      if (node.getAttribute("href").match(myName)) return [false, ""];
      if (reg.test(node.getAttribute("href"))) return [true, node.getAttribute("href")];
    }
    return this.nodeTagCheck(node.parentElement, ++index);
  }
}
new newTabProfile();
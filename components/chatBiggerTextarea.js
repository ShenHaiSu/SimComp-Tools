const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class chatBiggerTextarea extends BaseComponent {
  constructor() {
    super();
    this.name = "聊天室输入框自动放大";
    this.describe = "在输入的时候自动放大";
    this.enable = false;
  }
  componentData = {
    lastElement: undefined, // 最新点击输入框的元素
  }
  commonFuncList = [{
    match: (event) => event != undefined && /messages\/(.+)/.test(location.href),
    func: this.mainFunc
  }]
  cssText = [`div.input-group>div>div>textarea.script_showBig{height:200px !important;top:-150px !important;}div#script_BiggerTextarea_setAfter:after{content:"";display:block;height:150px;}`]

  mainFunc(event) {
    let target = window.document.activeElement;
    try {
      if (target.tagName === "TEXTAREA") {
        target.style.transition = "ease-in-out 0.2s";
        if (target == this.componentData.lastElement && target.classList.contains("script_showBig")) {
          return;
        } else if (target == this.componentData.lastElement) {
          this.addBigClass(target, undefined);
        } else if (!target.classList.contains("script_showBig")) {
          this.addBigClass(target, this.componentData.lastElement);
        } else {
          this.addBigClass(undefined, this.componentData.lastElement);
        }
      } else {
        this.addBigClass(undefined, this.componentData.lastElement);
      }
    } finally {
      if (target.tagName === "TEXTAREA") this.componentData.lastElement = target;
    }
  }
  // 添加框
  addBigClass(addaNode, removeNode) {
    if (addaNode) {
      addaNode.classList.add("script_showBig");
      let targetNode = tools.getParentByIndex(addaNode, 6).previousElementSibling.childNodes[0].childNodes[0];
      targetNode.style.transition = "ease-in-out 0.2s";
      targetNode.id = "script_BiggerTextarea_setAfter";
    }
    if (removeNode) {
      removeNode.classList.remove("script_showBig");
      let targetNode = tools.getParentByIndex(removeNode, 6).previousElementSibling.childNodes[0].childNodes[0];
      targetNode.style.transition = "ease-in-out 0.2s";
      targetNode.id = "";
    }
  }
}
new chatBiggerTextarea();
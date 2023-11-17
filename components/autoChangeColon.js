const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 输入框中英冒号切换
class autoChangeColon extends BaseComponent {
  constructor() {
    super();
    this.name = "中英冒号切换";
    this.describe = "聊天室输入框自动中英冒号切换";
    this.enable = true;
    this.canDisable = true;
  }
  commonFuncList = [
    {
      match: () => Boolean(location.href.match(/messages\/(.+)/) && document.activeElement.type == "textarea"),
      func: this.mainFunc
    }
  ]
  mainFunc() {
    let cursorPosition = document.activeElement.selectionStart;
    let changeAble = !!document.activeElement.value.match("：");
    if (!changeAble) return;
    tools.setInput(document.activeElement, document.activeElement.value.replace("：", ":"));
    document.activeElement.setSelectionRange(cursorPosition, cursorPosition);
  }
}
new autoChangeColon();
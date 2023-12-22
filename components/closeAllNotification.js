const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 关闭弹窗
class closeAllNotification extends BaseComponent {
  constructor() {
    super();
    this.name = "关闭弹窗";
    this.describe = "关闭所有弹窗,让网页再也没有消息提醒(来自官方的)";
    this.enable = true;
    this.canDisable = true;
    this.tagList = ['样式'];
  }
  startupFuncList = [
    this.startupCloseNotification
  ]
  debounceFuncList = [{
    bounce: 50,
    func: this.startupCloseNotification
  }]
  async startupCloseNotification() {
    let targetNode = document.querySelector("div.container > div.chat-notifications");
    if (!targetNode) return;
    Object.assign(targetNode.style, { display: "none" });
    tools.log("已关闭弹窗元素的显示.");
  }
}
new closeAllNotification();
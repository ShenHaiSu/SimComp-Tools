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
  }
  componentData = {
    isClose: false, // 已关闭标记
    timerFlag: undefined, // 定时器标记
  }
  startupFuncList = [
    this.startupCloseNotification
  ]
  startupCloseNotification() {
    this.componentData.timerFlag = setInterval(() => {
      let targetNode = document.querySelector("div.container > div.chat-notifications");
      if (!targetNode) return;
      Object.assign(targetNode.style, { display: "none" });
      this.componentData.isClose = true;
      clearInterval(this.componentData.timerFlag);
      tools.log("已关闭弹窗元素的显示.")
    }, 2000);
  }
}
new closeAllNotification();
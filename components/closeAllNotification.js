const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 关闭弹窗
class closeAllNotification extends BaseComponent {
  constructor() {
    super();
    this.name = "关闭消息弹窗";
    this.describe = "关闭所有消息弹窗,让网页再也没有消息提醒(来自官方的)";
    this.enable = false;
    this.tagList = ['样式'];
  }
  cssText = [`div.container>div.chat-notifications{display:none !important;}`]
}
new closeAllNotification();
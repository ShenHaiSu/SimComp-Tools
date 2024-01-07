const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 单大聊天窗口
class singleBigChat extends BaseComponent {
  constructor() {
    super();
    this.name = "单大聊天窗口";
    this.describe = "让聊天窗页面只有一个大窗口,可以畅爽体验.";
    this.enable = false;
    this.tagList = ['样式',"聊天"];
  }
  cssText = [`div#page>div>div.container>div.row>div.col-lg-9.col-md-8.col-sm-7>div.row>div.col-lg-6:nth-of-type(1){width:100% !important;}div#page>div>div.container>div.row>div.col-lg-9.col-md-8.col-sm-7>div.row>div.col-lg-6:nth-of-type(2){display:none !important;}`]
}
new singleBigChat();
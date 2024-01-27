const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class searchShowIntroduction extends BaseComponent {
  constructor() {
    super();
    this.name = "搜索显示完整简介";
    this.describe = "在搜索界面可以将所有人的公司简介显示完整。";
    this.enable = false;
  }
  cssText = [`div>div.row>div.col-sm-6>div[class]{height:max-content !important;}div>div.row>div.col-sm-6>div[class]>div:last-of-type{height:max-content !important;overflow:visible !important;}`];
}
new searchShowIntroduction();
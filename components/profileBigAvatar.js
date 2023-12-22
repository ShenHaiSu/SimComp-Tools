const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 资料页面头像放大
class profileBigAvatar extends BaseComponent {
  constructor() {
    super();
    this.name = "资料页头像点击放大";
    this.describe = "在资料页点击头像会方法";
    this.enable = true;
    this.canDisable = true;
    this.tagList = ['样式'];
  }
  commonFuncList = [{
    match: event => Boolean(location.href.match(/company\/(0|1)\/.*\//)) && event.target.tagName == "IMG" && event.target.parentElement.tagName == "H1",
    func: this.mainFunc
  }];
  mainFunc(event) {
    tools.log(event.target.style.width);
    if (!event.target.style.width || event.target.style.width == "90px") {
      Object.assign(event.target.style, { width: "300px", height: "300px", zIndex: "1031" });
    } else {
      Object.assign(event.target.style, { width: "90px", height: "90px", zIndex: "0" });
    }
  }
}
new profileBigAvatar();


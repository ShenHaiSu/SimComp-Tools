const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 单大聊天窗口
class singleBigChat extends BaseComponent {
  constructor() {
    super();
    this.name = "单大聊天窗口";
    this.describe = "让聊天窗页面只有一个大窗口,可以畅爽体验.";
    this.enable = false;
    this.canDisable = true;
    this.tagList = ['样式'];
  }
  commonFuncList = [
    {
      match: () => Boolean(location.href.match(/messages\/(.+)/)),
      func: this.mainFunc
    }, {
      match: () => !Boolean(location.href.match(/messages\/(.+)/)),
      func: this.showOther
    }
  ]
  // 隐藏不是主要目标的标签
  // 修改主要目标的class
  mainFunc() {
    let count = 0;
    document.querySelectorAll(".well-header").forEach((item) => {
      if (item.innerText.match(/(聊天室)|(联络人)/)) return;
      let targetNode = tools.getParentByIndex(item, 3);
      targetNode.className = targetNode.className.replace("col-lg-6", "col-lg-12");
      if (count) targetNode.style.display = "none";
      count++;
    });
  }
  // 非聊天界面的时候取消可能的元素影响
  showOther() {
    let targetNode = document.querySelector("div#page div.container>div.row");
    if (targetNode && targetNode.style.display == "none") Object.assign(targetNode.style, { display: "block" });
  }
}
new singleBigChat();
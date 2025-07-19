const BaseComponent = require("../tools/baseComponent.js");
const { tools } = require("../tools/tools.js");

// 总览与财报界面图表放大
class BiggerAmcharts extends BaseComponent {
  constructor() {
    super();
    this.name = "图表放大";
    this.describe = "在总览页面或者财报页面点一下空白处触发检测就会放大图表\n灵感来源：Sim Companies Visual Improvements\nhttps://greasyfork.org/en/scripts/432355-sim-companies-visual-improvements";
    this.enable = true;
    this.tagList = ["样式", "图表"];
  }

  // 定义匹配规则和对应处理函数
  commonFuncList = [{
    match: () => Boolean(location.href.match(/headquarters\/(accounting\/|overview\/$)/)),
    func: this.mainFunc
  }];

  // 处理图表放大的主函数
  mainFunc() {
    const CHART_HEIGHT = "600px";
    const url = location.href;

    if (url.endsWith("headquarters/overview/")) {
      this.handleOverviewPage(CHART_HEIGHT);
    } else {
      this.handleAccountingPage(CHART_HEIGHT);
    }
  }

  // 处理总览页面的图表放大
  handleOverviewPage(height) {
    const chartNode = document.querySelector("div.row > div.col-sm-6 > div > div > div");
    Object.assign(chartNode.style, { height });

    const messageNode = tools.getParentByIndex(chartNode, 4).lastChild;
    messageNode.className = "col-sm-6 text-center";

    // 避免重复添加换行
    if (messageNode.querySelectorAll("br").length > 1) return;

    // 使用文档片段一次性添加三个换行符，减少DOM操作
    const fragment = document.createDocumentFragment();
    Array(3).fill().forEach(() => {
      fragment.appendChild(document.createElement("br"));
    });
    messageNode.lastChild.prepend(fragment);
  }

  // 处理财务页面的图表放大
  handleAccountingPage(height) {
    const chartNode = document.querySelector("div.col-md-9 > div > div > div > div > div.amcharts-main-div")
      .parentElement;
    Object.assign(chartNode.style, { height });
  }
}

new BiggerAmcharts();

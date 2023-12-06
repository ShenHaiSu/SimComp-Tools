const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class saleOfficeAutoQuery extends BaseComponent {
  constructor() {
    super();
    this.name = "销售办公室/大楼一键询单";
    this.describe = "在公司地图界面点击前台功能按钮,会自动开始逐一办公室/大楼的询单.请先确保资金充足.";
    this.enable = true;
  }
  componentData = {
    TBuildList: [], // 目标建筑列表 [{id:13,netBack:false}]
    lastNetTime: 0, // 最近一次网络请求的时间戳
  }
  netFuncList = [{
    urlMatch: () => true,
    func: this.freshNetTimeStamp
  }]

  frontUI = async () => {
    try {
      // 获取比对形成目标建筑列表
      let realm = runtimeData.basisCPT.realm;
      this.componentData.TBuildList = indexDBData.basisCPT.building[realm]
        .filter(build => build.kind == "B" && build.busy == undefined)
        .map(build => { return { id: build.id, netBack: false } });
      // 排查目标列表长度
      if (this.componentData.TBuildList.length == 0) return window.alert("未检测到可以询单的建筑.如果确定依然可以询单,请联系开发者.");
      // 封锁用户操作
      tools.setWindowMask(true);
      // 逐一操作
      for (let i = 0; i < this.componentData.TBuildList.length; i++) {
        let targetBuild = this.componentData.TBuildList[i];
        // 检查并回到地图界面
        if (!/landscape\//.test(location.href)) {
          if (!document.querySelector("nav>a#menu-map")) return window.alert("请回到地图界面");
          document.querySelector("nav>a#menu-map").click();
        }
        await tools.dely(1000);
        // 获取本次操作的按钮
        Object.values(document.querySelectorAll("div#page>div>div>div>div>a")).filter(aTag => aTag.href.match(targetBuild.id))[0].click();
        await tools.dely(1000);
        // 尝试获取寻找客户的标签并点击
        while (true) {
          // 检查当前时间距离最近一次网络请求间隔
          await tools.dely(2000);
          if (new Date().getTime() - this.componentData.lastNetTime <= 4000) continue;
          let queryContNode = document.querySelector("div>p>button>svg[data-icon='circle-plus']");
          if (queryContNode == null) break;
          queryContNode.parentElement.click();
        }
        // 返回地图界面
        document.querySelector("nav>a#menu-map").click();
      }
      this.componentData.TBuildList = [];
      window.alert("一键询单已完成.");
    } finally {
      // 解锁用户操作
      tools.setWindowMask(false);
    }
  }

  netReqGet(url, method, resp) {
    // let data = JSON.parse(resp);
    let netReqID = parseInt(url.match(/buildings\/(\d+)\/sales-orders/)[1]);
    let targetIndex = this.componentData.TBuildList.findIndex(build => build.id == netReqID);
    if (targetIndex == -1) return;
    this.componentData.TBuildList[targetIndex].netBack = true;
  }
  freshNetTimeStamp() {
    if (!/\/b\/\d+\//.test(location.href)) return;
    this.componentData.lastNetTime = new Date().getTime();
  }
}
new saleOfficeAutoQuery();
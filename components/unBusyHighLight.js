const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class unBusyHighLight extends BaseComponent {
  constructor() {
    super();
    this.name = "空闲建筑高亮";
    this.describe = "如题";
    this.enable = false; // 默认关闭
    this.tagList = ['样式', "建筑"];
  }
  componentData = {
    blackList: ["n", "B"], // 屏蔽的建筑类型 n 银行
  }
  commonFuncList = [{
    match: () => Boolean(/landscape\/$/.test(location.href)),
    func: this.mainFunc
  }]
  cssText = [
    `.script_unBusyHighLight_aTag span>span{background-color:#ffff00;color:black;}.script_unBusyHighLight_aTag span>small>span{background-color:#ffff00;color:black;}`
  ]

  async mainFunc() {
    if (Object.values(document.querySelectorAll("div#page>div>div>div>div>a")).length === 0) return;
    this.clearClassName();
    let realm = await tools.getRealm();

    // 生成当前不忙的建筑数组 跳过大楼建筑
    let unBusyList = indexDBData.basisCPT.building[realm]
      .filter(build => build.busy == undefined && !this.componentData.blackList.includes(build.kind))
      .map(build => build.id + "");
    this.changeClassName(unBusyList);

    // 额外处理大楼建筑
    let unBustSaleOfficeList = indexDBData.basisCPT.building[realm].filter(build => build.kind == "B" && !Boolean(build.salesContract));
    for (let i = 0; i < unBustSaleOfficeList.length; i++) {
      let officeContrate = await tools.getNetData(`https://www.simcompanies.com/api/v2/companies/buildings/${unBustSaleOfficeList[i].id}/sales-orders/`);
      // console.log(`${unBustSaleOfficeList[i].id} 建筑已有单：`, officeContrate);
      if (!officeContrate) continue;
      if (officeContrate.length == 0) this.changeClassName([unBustSaleOfficeList[i].id + ""])
    }
  }

  // 捕获建筑dom标签并过滤
  changeClassName(unBusyList) {
    let buildingList = Object.values(document.querySelectorAll("div#page>div>div>div>div>a"))
      .filter(build => /\/b\/(\d+)\/$/.test(build.href) && unBusyList.includes(build.href.match(/\/b\/(\d+)\/$/)[1]))
      .filter(build => !/script_unBusyHighLight_aTag/.test(build.className));

    for (let i = 0; i < buildingList.length; i++) {
      buildingList[i].className += ` script_unBusyHighLight_aTag`;
    }
  }

  // 清除所有的tag
  clearClassName() {
    let buildingList = Object.values(document.querySelectorAll("div#page>div>div>div>div>a"));
    for (let i = 0; i < buildingList.length; i++) {
      buildingList[i].className.replace("script_unBusyHighLight_aTag", "");
    }
  }
}
new unBusyHighLight();
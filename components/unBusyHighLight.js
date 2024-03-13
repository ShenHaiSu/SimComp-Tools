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
  indexDBData = {
    mode: 0, // 高亮css模式 [0:改变底色; 1:文字加粗; 2:文字放大; 3:文字加粗放大; 4:辣眼缩放;]
  }
  componentData = {
    blackList: ["n", "B"], // 屏蔽的建筑类型 n 银行
  }
  commonFuncList = [{
    match: () => Boolean(/landscape\/$/.test(location.href)),
    func: this.mainFunc
  }]
  cssText = [
    `@keyframes sct_unbusyCycle{0%{color:red;background-color:yellow;}25%{color:blue;background-color:red;}50%{color:green;background-color:blue;}75%{color:yellow;background-color:green;}100%{color:red;background-color:yellow;}}.script_unBusyHighLight_aTag span>span,.script_unBusyHighLight_aTag span>small>span{background-color:#ffff00;color:black;transition:all ease-in-out 0.5s;}.script_unBusyHighLight_larger span>span,.script_unBusyHighLight_larger span>small>span{font-size:20px !important;}.script_unBusyHighLight_bold span>span,.script_unBusyHighLight_bold span>small>span{font-weight:bolder;}.script_unBusyHighLight_anime span>span,.script_unBusyHighLight_anime span>small>span{animation:sct_unbusyCycle 4s infinite;}`
  ]

  settingUI = async () => {
    let mainNode = document.createElement("div");
    let htmlText = `<div class=header>空闲建筑高亮设置</div><div class=container><div><button class="btn script_opt_submit">保存更改</button></div><table><thead><tr><td>功能<td>设置<tbody><tr><td>高亮显示模式<td><select class='showMode form-control'><option value=0>仅更改底色<option value=1>底色变更文字加粗<option value=2>底色变更文字放大<option value=3>底色变更文字加粗放大<option value=4>辣眼特效</select></table></div>`;
    mainNode.innerHTML = htmlText;
    mainNode.id = "unBusyHighLightSetting";
    mainNode.querySelector("select.showMode").selectedIndex = this.indexDBData.mode;
    mainNode.addEventListener("click", e => this.settingMainClick(e));
    return mainNode;
  }
  // 设置界面点击事件分发
  settingMainClick(e) {
    if (e.target.tagName != "BUTTON") return;
    if (/script_opt_submit/.test(e.target.className)) return this.settingSubmit(e.target);
  }
  // 设置界面提交事件
  settingSubmit(node) {
    let valueList = Object.values(tools.getParentByIndex(node, 2).querySelectorAll("select")).map(item => item.value);
    valueList[0] = Math.floor(valueList[0]);

    this.clearClassName();
    this.indexDBData.mode = valueList[0];
    tools.indexDB_updateIndexDBData();
    tools.alert("已提交更改");
    this.clearClassName();
  }

  // 主入口函数
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
      if (!officeContrate) continue;
      if (officeContrate.length == 0) this.changeClassName([unBustSaleOfficeList[i].id + ""]);
    }
  }

  // 捕获建筑dom标签并过滤
  changeClassName(unBusyList) {
    // 捕获a建筑节点列表
    let buildingList = Object.values(document.querySelectorAll("div#page>div>div>div>div>a"))
      .filter(build => /\/b\/(\d+)\/$/.test(build.href) && unBusyList.includes(build.href.match(/\/b\/(\d+)\/$/)[1]))
      .filter(build => !/script_unBusyHighLight_aTag/.test(build.className));
    let addClassName = this.genClassName();

    // 遍历挂载
    for (let i = 0; i < buildingList.length; i++) buildingList[i].className += ` ${addClassName}`;
  }

  // 清除所有的tag
  clearClassName() {
    let buildingList = Object.values(document.querySelectorAll("div#page>div>div>div>div>a"));
    let addClassName = this.genClassName();
    for (let i = 0; i < buildingList.length; i++) buildingList[i].className.replace(addClassName, "");
  }

  // 生成className
  genClassName() {
    let outputClass = `script_unBusyHighLight_aTag `;
    switch (this.indexDBData.mode) {
      case 1:
        outputClass += `script_unBusyHighLight_bold `;
        break;
      case 2:
        outputClass += `script_unBusyHighLight_larger `;
        break;
      case 3:
        outputClass += `script_unBusyHighLight_larger script_unBusyHighLight_bold `;
        break;
      case 4:
        outputClass += `script_unBusyHighLight_larger script_unBusyHighLight_bold script_unBusyHighLight_anime`;
        break;
    }
    return outputClass;
  }
}
new unBusyHighLight();
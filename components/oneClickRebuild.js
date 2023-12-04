const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config, langData } = require("../tools/tools.js");

class oneClickRebuild extends BaseComponent {
  constructor() {
    super();
    this.name = "更好的一键重建";
    this.describe = `可以自定义矿井/油井/采石场的重建丰度检测,只要不满足就会显示一键重建按钮`;
    this.enable = true;
  }
  indexDBData = {
    // 矿井
    minAbundance_14: 99.9, // 矿物   允许的最小丰富
    minAbundance_15: 99.9, // 铝土矿
    minAbundance_68: 99.9, // 金矿石
    minAbundance_42: 99.9, // 铁矿石
    // 采石场
    minAbundance_44: 99.9, // 沙子
    minAbundance_104: 99.9, // 黏土
    minAbundance_105: 99.9, // 石灰石
    // 油井
    minAbundance_10: 99.9, // 原油
    minAbundance_74: 99.9, // 甲烷
  }
  cssText = [
    `button#script_mineRebuild_btn{color:var(--fontColor);display: block;width: 90%;margin: 10px auto;background-color: rgb(165,42,42);}button#script_mineRebuild_btn:hover{background-color:rgb(103 34 34);color:white;}`,
    `button#script_mineRebuild_btn{padding:0;}`
  ]
  componentData = {
    abundanceList: {}, // 缓存建筑丰度列表 {id:{"14": 70.1, "15": 65.1, "68": 61, "42": 51.5}}
    btnNode: undefined, // 按钮对象缓存
    tampTargetName: "", // 临时重建目标
    targetBuildList: ["M", "Q", "O"], // 目标建筑类型 矿井 采石场 油井
  }
  netFuncList = [{
    urlMatch: url => /buildings\/\d+\/abundance\//.test(url),
    func: this.netReqGet
  }]
  commonFuncList = [{
    match: () => /b\/\d+\/$/.test(location.href),
    func: this.mainFunc
  }]

  frontUI = async () => {
    if (/b\/\d+\/$/.test(location.href)) {
      let buildingID = parseInt(location.href.match(/b\/(\d+)\/$/)[1]);
      if (!this.componentData.targetBuildList.includes(tools.getBuildKind(buildingID))) return window.alert("请先进入建筑界面,包括:矿井 采石场 油井");
      this.rebuildHandle(undefined);
      return;
    } else if (/\/landscape\/$/.test(location.href) && window.confirm("现在将会使用插件组件配置来查询所有不符合条件的矿井/采石场/油井,你确定吗?(请仔细检查配置,仔细检查配置,仔细检查配置)")) {
      return this.oneClickRebuildAll();
    }
  }
  settingUI = () => {
    let newNode = document.createElement("div");
    let htmlText = `<div class=header>更好的一键重建</div><div class=container><div><div><button class="btn script_opt_submit">保存</button></div></div><table><thead><tr><td>功能<td>设置<tbody><tr><td>矿井-矿物<td><input class=form-control max=100 min=0 step=0.1 type=number value=######><tr><td>矿井-铝土矿<td><input class=form-control max=100 min=0 step=0.1 type=number value=######><tr><td>矿井-金矿石<td><input class=form-control max=100 min=0 step=0.1 type=number value=######><tr><td>矿井-铁矿石<td><input class=form-control max=100 min=0 step=0.1 type=number value=######><tr><td>采石场-沙子<td><input class=form-control max=100 min=0 step=0.1 type=number value=######><tr><td>采石场-黏土<td><input class=form-control max=100 min=0 step=0.1 type=number value=######><tr><td>采石场-石灰石<td><input class=form-control max=100 min=0 step=0.1 type=number value=######><tr><td>油井-原油<td><input class=form-control max=100 min=0 step=0.1 type=number value=######><tr><td>油井-甲烷<td><input class=form-control max=100 min=0 step=0.1 type=number value=######></table></div>`;
    htmlText = htmlText.replace("######", this.indexDBData.minAbundance_14);
    htmlText = htmlText.replace("######", this.indexDBData.minAbundance_15);
    htmlText = htmlText.replace("######", this.indexDBData.minAbundance_68);
    htmlText = htmlText.replace("######", this.indexDBData.minAbundance_42);
    htmlText = htmlText.replace("######", this.indexDBData.minAbundance_44);
    htmlText = htmlText.replace("######", this.indexDBData.minAbundance_104);
    htmlText = htmlText.replace("######", this.indexDBData.minAbundance_105);
    htmlText = htmlText.replace("######", this.indexDBData.minAbundance_10);
    htmlText = htmlText.replace("######", this.indexDBData.minAbundance_74);
    newNode.innerHTML = htmlText;
    newNode.id = "script_mineRebuild_setting";
    newNode.querySelector("button.script_opt_submit").addEventListener('click', () => this.settingSubmit())
    return newNode;
  }
  settingSubmit() {
    let valueList = Object.values(document.querySelectorAll("#script_mineRebuild_setting input")).map(node => parseFloat(node.value));
    // 审核
    if (valueList.filter(value => Boolean(value < 0 || value >= 100)).length != 0) return window.alert("不能低于0或者大于等于100");
    // 更新
    this.indexDBData.minAbundance_14 = valueList[0];
    this.indexDBData.minAbundance_15 = valueList[1];
    this.indexDBData.minAbundance_68 = valueList[2];
    this.indexDBData.minAbundance_42 = valueList[3];
    this.indexDBData.minAbundance_44 = valueList[4];
    this.indexDBData.minAbundance_104 = valueList[5];
    this.indexDBData.minAbundance_105 = valueList[6];
    this.indexDBData.minAbundance_10 = valueList[7];
    this.indexDBData.minAbundance_74 = valueList[8];
    // 保存
    tools.indexDB_updateIndexDBData();
    window.alert("保存并更新");
    // 刷新显示
    if (document.querySelector("button#script_mineRebuild_btn"))
      document.querySelectorAll("button#script_mineRebuild_btn").forEach(btn => btn.remove());
  }
  // 丰度网络请求拦截
  netReqGet(url, method, resp) {
    let data = JSON.parse(resp);
    this.componentData.abundanceList[data.buildingId] = data.abundance;
    // console.log(this.componentData.abundanceList);
  }
  // 丰度检测
  abundanceCheck(buildingID) {
    let nowBuildAbundance = this.componentData.abundanceList[buildingID];
    for (const key in nowBuildAbundance) {
      if (!Object.hasOwnProperty.call(nowBuildAbundance, key)) continue;
      if (this.indexDBData[`minAbundance_${key}`] == undefined) return false;
      if (this.indexDBData[`minAbundance_${key}`] == 0) continue;
      if (nowBuildAbundance[key] < this.indexDBData[`minAbundance_${key}`]) continue;
      return false; // 不能重建
    }
    return true; // 可以重建
  }
  // 检测并挂载重建按钮
  mainFunc() {
    // 检测建筑类型
    let buildingID = parseInt(location.href.match(/b\/(\d+)\/$/)[1]);
    if (!this.componentData.targetBuildList.includes(tools.getBuildKind(buildingID))) return;
    // 检测官方重建按钮
    // if (document.querySelector("button>svg[data-icon='recycle']")) return;
    // 检测脚本重建按钮
    if (document.querySelector("button#script_mineRebuild_btn")) return;
    // 检测缓存数据
    if (this.componentData.abundanceList[buildingID] == undefined) return;
    // 检测丰富要求
    if (!this.abundanceCheck(buildingID)) return;
    // 构建按钮
    if (!this.componentData.btnNode) {
      this.componentData.btnNode = document.createElement("button");
      this.componentData.btnNode.id = "script_mineRebuild_btn";
      this.componentData.btnNode.className = "btn";
      this.componentData.btnNode.innerText = "重建";
    }
    // 挂载按钮
    let parentNodeList = Object.values(document.querySelectorAll(`button>svg[data-icon='dumpster'][role='img']`));
    let tampNode = this.componentData.btnNode.cloneNode(true);
    let tampNode2 = this.componentData.btnNode.cloneNode(true);
    tampNode.addEventListener('click', (event) => this.rebuildHandle(event));
    tampNode2.addEventListener('click', event => this.rebuildHandle(event));
    tools.getParentByIndex(parentNodeList[0], 2).appendChild(tampNode);
    tools.getParentByIndex(parentNodeList[1], 3).appendChild(tampNode2);
  }
  // 重建按钮函数
  async rebuildHandle(event, mode = "one") {
    // 再次确认
    if (mode == "one" && !window.confirm("确认要重建吗?")) return;
    let buildName = document.querySelector("div>span>b").innerText;
    try {
      tools.setWindowMask(true);
      document.querySelector(`button>svg[data-icon="dumpster"]`).parentElement.click();
      await tools.dely(1500);
      document.querySelector("div.modal-body.modal-upgrade button.btn-primary").click();
      await tools.dely(1500);
      Object.values(document.querySelectorAll("div#page>div>div>div>div>a")).filter(node => node.href.match(/\/landscape\/buildings\/\d+\//))[0].click();
      await tools.dely(1500);
      Object.values(document.querySelectorAll("div.hover-effect>p>b")).filter(node => node.innerText == buildName)[0].click();
      await tools.dely(1500);
      document.querySelector(`button.btn.btn-primary`).click();
      await tools.dely(1500);
    } catch (error) {
      console.error(error);
      window.alert("一键重建功能出现错误,请打开开发者工具(F12)找到最近的error信息发送给开发者.");
    } finally {
      if (mode == "one") {
        tools.setWindowMask(false);
        window.alert("一键重建已完成.");
      }
    }
  }
  // 一键重建全部
  async oneClickRebuildAll() {
    try {
      tools.setWindowMask(true);
      let realm = await tools.getRealm();
      let buildList = indexDBData.basisCPT.building[realm];
      buildList = buildList.filter(build => this.componentData.targetBuildList.includes(build.kind) && build.busy == undefined);
      for (let i = 0; i < buildList.length; i++) {
        let buildID = buildList[i].id;
        if (this.componentData.abundanceList[buildID] == undefined) {
          let netData = await tools.getNetData(`https://www.simcompanies.com/api/v2/companies/buildings/${buildID}/abundance/`);
          if (!netData) continue;
          this.componentData.abundanceList[buildID] = netData.abundance;
        }
        if (!this.abundanceCheck(buildID)) continue;
        Object.values(document.querySelectorAll("div#page>div>div>div>div>a")).filter(node => node.href.match(buildID))[0].click();
        await tools.dely(1500);
        await this.rebuildHandle(undefined, "all");
      }
    } finally {
      tools.setWindowMask(false);
      window.alert("一键重建已完成.");
    }
  }
}
new oneClickRebuild();
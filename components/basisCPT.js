const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config, langData } = require("../tools/tools.js");

// 基础组件
class basisCPT extends BaseComponent {
  constructor() {
    super();
    this.name = "插件基础功能";
    this.describe = "包含了图形界面挂载，设置界面挂载等基础功能，不支持关闭";
    this.enable = true;
    this.canDisable = false; // 不允许关闭
  }
  // 函数挂载
  startupFuncList = [
    this.startupUserInfo,
    this.startupWarehouseInfo,
    this.startupSideBarMain,
    this.startupSettingContainer,
    this.startupExecutives,
    this.startupForDonation
  ]
  netFuncList = [
    {    // 用户信息拦截
      urlMatch: url => /companies\/me\/$/.test(url),
      func: this.userInfo
    }, { // 建筑数据拦截
      urlMatch: url => /me\/buildings\/$/.test(url),
      func: this.buildingInfo
    }, { // 仓库数据拦截
      urlMatch: url => /v2\/resources\/$/.test(url),
      func: this.warehouseInfo
    }, { // 交易所请求拦截
      urlMatch: url => /market\/(all\/)?\d+\/\d+\//.test(url),
      func: this.marketData
    }, { // 语言包拦截
      urlMatch: url => /lang5\/zh.json$/.test(url),
      func: this.langData
    }, { // 高管拦截
      urlMatch: url => /me\/executives\/$/.test(url),
      func: this.netExecutives
    }
  ]
  debounceFuncList = [{
    // [{bounce:20, func}]
    bounce: 20,
    func: this.debounceSaveIndexDB
  }]
  // css定义
  cssText = [
    `:root{--fontColor:##FONTCOLOR##}div#script_hover_node{width:fit-content;height:fit-content;position:fixed;bottom:-85px;right:10px;background:rgb(0,0,0,0.5);z-index:1050;transition:ease-in 0.25s;padding:5px;border-radius:5px;color:var(--fontColor);}div#script_hover_node:hover{bottom:10px;right:10px;}div#script_hover_node>div{margin-bottom:5px;}div#script_hover_node span{display:block;height:35px;line-height:35px;width:100%;text-align:center;transition:ease-in 0.25s;color:var(--fontColor);border-radius:5px;}div#script_hover_node span:hover{background-color:rgb(255,255,255) !important;color:black !important;}div#script_hover_node button{background-color:rgb(54,54,54);color:var(--fontColor);}div#script_hover_node button:hover{background-color:rgb(114,114,114);font-weight:700;}div.script_base_container{min-width:450px;overflow-y:auto;overflow-x:hidden;position:fixed;top:0px;right:-150%;display:block;width:35%;height:100%;background-color:rgb(0,0,0,0.7);padding:10px;z-index:1049;transition:ease-in-out 0.25s;color:var(--fontColor);}div#script_msg_node table,div#script_cpt_node table{border-collapse:separate;border-spacing:10px;}div#script_msg_node table>tbody>tr,div#script_cpt_node table>tbody>tr{vertical-align:top;}div#script_msg_node table>tbody>tr>td:nth-child(1){width:70px;max-width:70px;text-align:center;}div#script_cpt_node table{width:100%}div#script_cpt_node table>tbody>tr>td:nth-child(2){width:70px;text-align:center;}div#script_cpt_node table>tbody>tr>td>button{transition:ease-in-out 0.1s;max-width:300px;background-color: rgb(114,114,114);}div#script_cpt_node table>tbody>tr>td>button:hover{color:black;background-color:#ffffff;box-shadow:0 0 10px 3px wheat;}#script_cpt_setting_container{max-width:60%;min-width:435px;color:var(--fontColor);display:none;box-shadow:0 0 3px 1px rgb(0,0,0,0.5);border-radius:10px;padding:10px;position:fixed;transform:translateX(-50%) translateY(-50%);top:50%;left:50%;background-color:rgb(0,0,0,0.9);z-index:1051;}#script_setting_head{width:100%;margin-bottom:10px;max-height:26px;line-height:26px;height:26px;}#script_setting_head>div>span{position:relative;font-size:21px;left:-10px;display:block;}#script_setting_head>div:nth-child(2){text-align:end;}#script_setting_head>div>button{background-color:red;right:0;position:relative;text-align:center;height:26px;line-height:16px;}#script_setting_body{padding:5px;width:100%;max-height:400px;overflow-y:auto;overflow-x:hidden;}div.setting-container{color:var(--fontColor);}div.setting-container button, div.setting-container input, div.setting-container select{transition:ease-in-out 0.1s;background-color:rgb(76,76,76);color:var(--fontColor);}div.setting-container div.header{background-color:rgb(0,0,0);text-align:center;font-size:20px;font-weight:700;}div.setting-container div.container{width:100%;display:block;margin-top:10px;margin-bottom:10px;}div.setting-container div.container>table, div.setting-container div.container>div>table{border-collapse:separate;border-spacing:10px;text-align:center;width:100%;height:100%;}div.setting-container button.script_opt_submit{width:80%;height:49px;margin:auto;display:block;font-size:20px;transition:ease-in-out 0.1s;}div.setting-container div>table>thead>tr {height: 50px;}div.setting-container button:hover{color:black;background-color:#ffffff;box-shadow:0 0 10px 3px wheat;}div#script_cpt_node > div#scriptCPT_mainBody::after{content:"";display:block;height:50px;}div#script_cpt_node table>tbody>tr>td>button.funcExist{background-color:green;}div#script_cpt_node table>tbody>tr>td>button.funcExist:hover{background-color:#ffffff;}div#scriptCPT_mainBody tbody>tr:hover{background-color: rgb(255,255,255,0.1);}#script_cptSearch_input{background:rgb(0,0,0,0.8);color:var(--fontColor);}`,
    `:root{--fontColor:##FONTCOLOR##}div#script_hover_node{width:fit-content;height:fit-content;position:fixed;bottom:-95px;right:-20px;background:rgb(0,0,0,0.5);z-index:1050;transition:ease-in 0.25s;padding:5px;border-radius:5px;color:var(--fontColor);}div#script_hover_node:hover{bottom:10px;right:10px;}div#script_hover_node>div{margin-bottom:5px;}div#script_hover_node span{display:block;height:35px;line-height:35px;width:100%;text-align:center;transition:ease-in 0.25s;color:var(--fontColor);border-radius:5px;}div#script_hover_node span:hover{background-color:rgb(255,255,255) !important;color:black !important;}div#script_hover_node button{background-color:rgb(54,54,54);color:var(--fontColor);}div#script_hover_node button:hover{background-color:rgb(114,114,114);font-weight:700;}div.script_base_container{width:100%;height:100%;overflow-y:auto;overflow-x:hidden;position:fixed;top:0px;right:-150%;display:block;background-color:rgb(0,0,0,0.7);padding:10px;z-index:1049;transition:ease-in-out 0.25s;color:var(--fontColor);}div#script_msg_node table,div#script_cpt_node table{border-collapse:separate;border-spacing:10px;}div#script_msg_node table>tbody>tr,div#script_cpt_node table>tbody>tr{vertical-align:top;}div#script_msg_node table>tbody>tr>td:nth-child(1){width:70px;max-width:70px;text-align:center;}div#script_cpt_node table{width:100%}div#script_cpt_node table>tbody>tr>td:nth-child(2){width:70px;text-align:center;}div#script_cpt_node table>tbody>tr>td>button{transition:ease-in-out 0.1s;max-width:300px;background-color:rgb(114,114,114);}div#script_cpt_node table>tbody>tr>td>button:hover{color:black;background-color:#ffffff;box-shadow:0 0 10px 3px wheat;}#script_cpt_setting_container{width:95%;min-width:300px;color:var(--fontColor);display:none;box-shadow:0 0 3px 1px rgb(0,0,0,0.5);border-radius:10px;padding:5px;position:fixed;transform:translateX(-50%) translateY(-50%);top:50%;left:50%;background-color:rgb(0,0,0,0.9);z-index:1051;}#script_setting_head{width:100%;margin-bottom:10px;max-height:26px;line-height:26px;height:26px;}#script_setting_head>div>span{position:relative;font-size:21px;left:-10px;display:block;}#script_setting_head>div:nth-child(2){text-align:end;}#script_setting_head>div>button{background-color:red;right:0;position:relative;text-align:center;height:26px;line-height:16px;}#script_setting_body{padding:5px;width:100%;max-height:400px;overflow-y:auto;overflow-x:hidden;}div.setting-container{color:var(--fontColor);}div.setting-container button,div.setting-container input,div.setting-container select{transition:ease-in-out 0.1s;background-color:rgb(76,76,76);color:var(--fontColor);}div.setting-container div.header{background-color:rgb(0,0,0);text-align:center;font-size:20px;font-weight:700;}div.setting-container div.container{width:100%;display:block;margin-top:10px;margin-bottom:10px;}div.setting-container div.container>table,div.setting-container div.container>div>table{border-collapse:separate;border-spacing:10px;text-align:center;width:100%;height:100%;}div.setting-container button.script_opt_submit{width:80%;height:49px;margin:auto;display:block;font-size:20px;transition:ease-in-out 0.1s;}div.setting-container div>table>thead>tr{height:50px;}div.setting-container button:hover{color:black;background-color:#ffffff;box-shadow:0 0 10px 3px wheat;}div#script_cpt_node>div#scriptCPT_mainBody::after{content:"";display:block;height:50px;}div#script_cpt_node table>tbody>tr>td>button.funcExist{background-color:green;}div#script_cpt_node table>tbody>tr>td>button.funcExist:hover{background-color:#ffffff;}div#scriptCPT_mainBody tbody>tr:hover{background-color: rgb(255,255,255,0.1);}#script_cptSearch_input{background:rgb(0,0,0,0.8);color:var(--fontColor);}`
  ];
  // 数据定义
  componentData = {
    settingNodeList: {}, // 设置界面
    buildingInfo: {}, // 建筑数据
    realm: undefined, // 服务器标记
    msgNodeShow: false, // 信息窗口展示标记
    cptSwitchShow: false, // 组件功能展示标记
    cptSettingContainerNode: undefined, // 组件设置的容器元素
    cptSettingBodyNode: undefined, // 组件设置挂载的目标元素
    cptSettingShow: false, // 设置元素展示标记
  }
  indexDBData = {
    building: [[], []], // 建筑数据，0是r1 1是r2
    userInfo: [[], []], // 用户数据，
    warehouse: [[], []], // 仓库数据
    resourcePool: [[], []], // 交易所数据 
    executives: [[], []], // 高管信息
  }
  settingUI = this.uisetting;
  // 组件开关提交按钮
  CPT_switch_button(event) {
    let valueList = [];
    document
      .querySelectorAll("#scriptSetting_CPT_switch input")
      .forEach(item => valueList.push(item.checked));
    let loadCount = 0;
    componentList.forEach(CPT => CPT.enable = valueList[loadCount++]);
    tools.indexDB_updateFeatureConf();
    window.alert("提交设置成功");
  }
  // 插件基础设置提交按钮
  async BaseSet_button(event) {
    let valueList = [];
    document
      .querySelectorAll("#setting-container-2 input, #setting-container-2 select")
      .forEach(node => {
        if (node.tagName == "INPUT" && node.type == "checkbox") { valueList.push(node.checked); }
        else if (node.tagName == "INPUT" || node.tagName == "SELECT") { valueList.push(node.value); }
      });
    feature_config.debug = valueList[0];
    feature_config.net_gap_ms = Math.floor(valueList[1]);
    feature_config.fontColor = valueList[2];
    feature_config.notificationMode = Math.floor(valueList[3]);
    tools.log(feature_config);
    await tools.indexDB_updateFeatureConf();
    window.alert("已提交更改");
    location.reload();
  }
  // 重置插件缓存按钮
  async clearIndexdDB(event) {
    await tools.indexDB_deleteAllData();
    window.alert("清除插件缓存完毕");
    location.reload();
  }
  // 用户信息拦截处理
  userInfo(url, method, resp) {
    resp = JSON.parse(resp);
    this.indexDBData.userInfo[resp.authCompany.realmId] = resp;
    this.componentData.realm = resp.authCompany.realmId;
    tools.log("用户数据获取完毕：", resp);
    tools.indexDB_updateIndexDBData();
  }
  // 建筑信息拦截处理
  buildingInfo(url, method, resp) {
    resp = JSON.parse(resp);
    if (this.componentData.realm == undefined) return;
    this.indexDBData.building[this.componentData.realm] = resp;
    tools.indexDB_updateIndexDBData();
  }
  // 仓库信息拦截处理
  warehouseInfo(url, method, resp) {
    resp = JSON.parse(resp);
    if (this.componentData.realm == undefined) return;
    tools.log("Current Realm: ", this.componentData.realm);
    this.indexDBData.warehouse[this.componentData.realm] = resp;
    tools.indexDB_updateIndexDBData();
  }
  // 市场价格拦截处理
  marketData(url, method, resp) {
    resp = JSON.parse(resp);
    if (!this.componentData.realm == undefined) return;
    let mpData = tools.mpFormat(resp);
    let res_id = Math.floor(url.match(/\d+(?=\D*$)/)[0]);
    let realm = Math.floor(url.match(/\/(\d+)/)[1]);
    tools.log("Realm", realm, "物品名", tools.itemIndex2Name(res_id), "物品ID", res_id, "价格", mpData);
    if (!this.indexDBData.resourcePool[realm]) this.indexDBData.resourcePool[realm] = [];
    this.indexDBData.resourcePool[realm][res_id] = mpData;
    tools.indexDB_updateIndexDBData();
  }
  // 语言包拦截处理
  langData(url, method, resp) {
    resp = JSON.parse(resp);
    for (const key in resp) {
      if (!Object.hasOwnProperty.call(resp, key) && !Object.hasOwnProperty.call(langData, key)) continue;
      langData[key] = resp[key];
    }
    // 删除旧数据
    delete this.indexDBData["langData"];
    tools.indexDB_updateLangData(langData);
  }
  // 高管信息网络请求拦截函数
  async netExecutives(url, method, resp) {
    let data = JSON.parse(resp);
    this.indexDBData.executives[await tools.getRealm()] = data;
  }
  // 自启动用户信息获取
  async startupUserInfo() {
    let netData = await tools.getNetData(tools.baseURL.userBase);
    if (!netData) return;
    this.indexDBData.userInfo[netData.authCompany.realmId] = netData;
    this.componentData.realm = netData.authCompany.realmId;
    tools.log("用户数据获取完毕：", netData);
  }
  // 自启动仓库信息检索
  async startupWarehouseInfo() {
    let netData = await tools.getNetData(tools.baseURL.warehouse);
    if (!netData || this.componentData.realm == undefined) return;
    this.indexDBData.warehouse[this.componentData.realm] = netData;
    tools.log("仓库数据更新完毕：", netData);
  }
  // 侧边栏构建
  async startupSideBarMain() {
    // 创建侧边栏开启用的小窗
    let sideBarSmall = document.createElement("div");
    sideBarSmall.innerHTML = `<div><span title='SimComp-tools By:道洛LTS_Kim' id='script_bar_text'>SCT</span></div><div><button id='script_msg_switch' class="btn form-control">信息</button></div><div><button id='script_cpt_switch' class="btn form-control">组件</button></div>`;
    sideBarSmall.id = "script_hover_node";
    // 创建信息窗口
    let msgMainNode = document.createElement('div');
    msgMainNode.innerHTML = `<div id='scriptMsg_innerHead'><h1>消息</h1></div><div id=scriptMsg_main><table><tbody id=scriptMsg_mainBody><tr><td>时间<td>内容</table></div>`;
    msgMainNode.id = 'script_msg_node';
    msgMainNode.className = 'script_base_container';
    tools.msgBodyNode = msgMainNode.querySelector("tbody#scriptMsg_mainBody");
    // 创建组件窗口
    let cptSwitchNode = this.sideBarSub_componentNode();
    cptSwitchNode.id = 'script_cpt_node';
    cptSwitchNode.className = "script_base_container";
    // 绑定事件
    sideBarSmall.querySelector("button#script_msg_switch").addEventListener('click', event => {
      // 取消背景色改变
      clearInterval(tools.msgShowFlag.timer);
      tools.msgShowFlag.timer = undefined;
      tools.msgShowFlag.flag = false;
      Object.assign(document.querySelector("div#script_hover_node>div>span").style, { backgroundColor: "rgb(0,0,0,0)" });
      // 修改当前目标
      Object.assign(document.querySelector("div#script_msg_node").style, {
        right: this.componentData.msgNodeShow ? "-150%" : "0px"
      });
      this.componentData.msgNodeShow = !this.componentData.msgNodeShow;
      // 重置原目标
      if (this.componentData.cptSwitchShow) {
        Object.assign(document.querySelector("div#script_cpt_node").style, { right: "-150%" });
        this.componentData.cptSwitchShow = !this.componentData.cptSwitchShow;
      }
    });
    sideBarSmall.querySelector('button#script_cpt_switch').addEventListener('click', event => {
      // 修改当前目标
      Object.assign(document.querySelector("div#script_cpt_node").style, {
        right: this.componentData.cptSwitchShow ? "-150%" : "0px"
      });
      this.componentData.cptSwitchShow = !this.componentData.cptSwitchShow;
      // 重置原目标
      if (this.componentData.msgNodeShow) {
        Object.assign(document.querySelector("div#script_msg_node").style, { right: "-150%" });
        this.componentData.msgNodeShow = !this.componentData.msgNodeShow;
      }
    });
    // 挂载元素
    document.body.appendChild(sideBarSmall);
    document.body.appendChild(msgMainNode);
    document.body.appendChild(cptSwitchNode);
  }
  sideBarSub_componentNode() {
    let resultNode = document.createElement("div");
    let htmlText = `<div id="scriptCPT_innerHead"><h1 style="margin-left:10px;">组件</h1><div style="padding:0 10px;"><input type="text" id="script_cptSearch_input" class="form-control" placeholder="搜索组件名..."></div></div><div id="scriptCPT_mainBody"><table><thead><tr><td>前台功能</td><td>设置</td></tr></thead><tbody>`;
    Object.values(componentList).forEach(component => {
      let name = component.constructor.name;
      let frontName = component.name;
      let frontExist = Boolean(component.frontUI) ? "funcExist" : "";
      let settingExist = Boolean(component.settingUI) ? "funcExist" : "";
      htmlText += `<tr id="${name}" class="script_cpt_node"><td><button class="btn CPTOptionLeft ${frontExist}">${frontName}</button></td><td><button class="btn CPTOptionRight ${settingExist}">设置</button></td></tr>`
    });
    htmlText += `</tbody></table></div>`;
    resultNode.innerHTML = htmlText;
    // 挂载交互
    let trList = resultNode.querySelectorAll("tbody > tr.script_cpt_node");
    for (let i = 0; i < trList.length; i++) {
      let element = trList[i];
      let component = componentList[element.id];
      let frontUI = component.frontUI == undefined ? () => this.sideBarSub_noFront() : () => this.sideBarSub_showFront(component);
      let settingUI = component.settingUI == undefined ? () => this.sideBarSub_noSetting() : () => this.sideBarSub_showSetting(component);
      element.querySelector("button.CPTOptionLeft").addEventListener('click', frontUI);
      element.querySelector("button.CPTOptionRight").addEventListener('click', settingUI);
    }
    // 组件搜索
    resultNode
      .querySelector("input#script_cptSearch_input")
      .addEventListener("change", event => this.sideBarSub_cptSearch(event));
    return resultNode;
  }
  sideBarSub_showFront(component) {
    component.frontUI.call(component);
  }
  async sideBarSub_showSetting(component) {
    if (this.componentData.cptSettingShow) return;
    let cptSettingNode = await component.settingUI.call(component);
    // 添加默认class
    if (!cptSettingNode.className.includes("col-sm-12 setting-container")) cptSettingNode.className += " col-sm-12 setting-container";
    this.componentData.cptSettingBodyNode.appendChild(cptSettingNode);
    Object.assign(document.querySelector("div#script_cpt_setting_container").style, { display: "block" });
    this.componentData.cptSettingShow = true;
  }
  sideBarSub_noFront() {
    window.alert("该组件没有前台窗口设计");
  }
  sideBarSub_noSetting() {
    window.alert("该组件没有可以设置的内容");
  }
  sideBarSub_cptSearch(event) {
    let value = event.target.value;
    if (value == "") value = /.+/;
    let nodeList = Object.values(document.querySelectorAll("div#scriptCPT_mainBody tbody>tr"));
    for (let i = 0; i < nodeList.length; i++) {
      Object.assign(nodeList[i].style, {
        display: nodeList[i].innerText.match(value) ? "" : "none"
      });
    }
  }
  // 组件设置界面构建
  async startupSettingContainer() {
    let settingContainerNode = document.createElement("div");
    settingContainerNode.innerHTML = `<div id=script_setting_head><div class="col-sm-10 col-xs-9"><span>组件设置界面</span></div><div class="col-sm-2 col-xs-2"><button class=btn>关闭</button></div></div><div id=script_setting_body></div>`;
    settingContainerNode.id = "script_cpt_setting_container";
    document.body.appendChild(settingContainerNode);
    this.componentData.cptSettingContainerNode = settingContainerNode;
    this.componentData.cptSettingBodyNode = settingContainerNode.querySelector("div#script_setting_body");

    // 关闭按钮绑定事件
    settingContainerNode
      .querySelector("div#script_setting_head button")
      .addEventListener("click", () => {
        this.componentData.cptSettingBodyNode.querySelectorAll("div").forEach(node => node.remove());
        Object.assign(document.querySelector("div#script_cpt_setting_container").style, { display: "none" });
        this.componentData.cptSettingShow = false;
      })
  }
  // 基础组件设置界面
  uisetting() {
    // 组件开关和基础插件的所有设置
    console.log(feature_config);
    let newNode = document.createElement("div");
    newNode.id = "script_setting_basisCPT";
    newNode.className = "col-sm-12 setting-container";
    let htmlText = `<div><div class="header">插件基础功能设置</div><div class="container"><div><div><button class="btn script_opt_submit">保存</button></div></div><div><table><thead><tr><td>组件名</td><td>开关</td></tr></thead><tbody>`;
    let tempCPTList = Object.values(componentList);
    for (let i = 0; i < tempCPTList.length; i++) {
      let component = tempCPTList[i];
      let name = component.name;
      let describe = component.describe;
      let enable = component.enable;
      let canDisable = component.canDisable;
      htmlText += `<tr><td><span title='${describe}'>${name}</span></td><td><input class='form-control' type="checkbox" ${enable ? "checked" : ""} ${canDisable ? "" : "disabled"}></td></tr>`;
    }
    htmlText += `</table></div><div><table><thead><tr><td>功能<td>设置<tbody><tr><td title=打开debug模式会有大量信息输出,可能会影响到性能,如非必要不要打开.>DEBUG模式<td><input class='form-control' type='checkbox' #####><tr><td title="只有插件主动发起的请求会被此项目限制\n官方文档说明低于5分钟就不安全了,用户请酌情设置. \n默认[10000ms]=10s">插件主动网络请求最小间隔<td><input type=number class=form-control value=#####><tr><td title="允许使用hex代码和rgb标号. \n默认 #ffffff">插件通用文字配色<td><input class=form-control value=#####><tr><td title="允许使用hex代码和rgb标号. \n默认 100 ">网页缩放比例<td><input type=number class=form-control value=#####><tr><td title="首要通知模式,默认是 网页内通知">主要通知模式<td><select class=form-control><option value=-1>无<option value=0>网页浏览器原生Notification对象(仅pc浏览器可用)<option value=1>网页内通知</select><tr><td title="次要通知模式,默认是 无">次要通知模式<td><select class=form-control><option value=-1>无<option value=0>网页浏览器原生Notification对象(仅pc浏览器可用)<option value=1>网页内通知</select><tr><td title="无确认,删除插件所有缓存.非必要不用点">清除插件缓存</td><td><button class="btn form-control" id="script_reset">清除</button></td></tr></table></div></div></div>`;
    // 修改input已有参数
    htmlText = htmlText.replace("#####", feature_config.debug ? "checked" : "");
    htmlText = htmlText.replace("#####", feature_config.net_gap_ms.toString());
    htmlText = htmlText.replace("#####", feature_config.fontColor.toString());
    htmlText = htmlText.replace("#####", parseFloat(feature_config.zoomRate));
    newNode.innerHTML = htmlText;
    // 修改select的已有参数
    let selectList = newNode.querySelectorAll("td>select");
    selectList[0].value = feature_config.notificationMode[0];
    selectList[1].value = feature_config.notificationMode[1];
    // 绑定按键
    newNode.querySelector("button#script_reset").addEventListener("click", () => {
      if (!window.confirm("确定清理?")) return;
      tools.indexDB_deleteAllData();
      location.reload();
    });
    newNode.querySelector("button.script_opt_submit").addEventListener('click', event => {
      this.uisettingSub();
    });
    return newNode;
  }
  uisettingSub() {
    let valueList = [];
    let flagCount = 0;
    let cptCount = Object.keys(componentList).length;
    document.querySelectorAll("div#script_setting_basisCPT input, div#script_setting_basisCPT select").forEach(node => {
      if (node.tagName == "INPUT" && node.type == "checkbox") {
        valueList.push(node.checked);
      } else if (node.tagName == "INPUT" && node.type == "number") {
        valueList.push(parseFloat(node.value));
      } else if (node.tagName == "INPUT") {
        valueList.push(node.value);
      } else if (node.tagName == "SELECT") {
        valueList.push(parseInt(node.value));
      }
    });
    // 检测内容
    if (Math.floor(valueList[cptCount + 1]) <= 3000) return window.alert("插件主动网络请求最小间隔 不允许设置小于三秒");
    if (!tools.hexArgbCheck(valueList[cptCount + 2])) return window.alert("只支持HEX格式颜色和RGB格式颜色.");
    if (valueList[cptCount + 3] > 100 || valueList[cptCount + 3] <= 0) return window.alert("网页缩放比例太离谱嗷.\n只允许 (0-100].");
    if (valueList[cptCount + 4] == -1 && valueList[cptCount + 5] != -1) return window.alert("如果仅设置一个通知模式请使用主要通知模式.");
    if (valueList[cptCount + 4] == valueList[cptCount + 5] && valueList[cptCount + 4] != -1) return window.alert("没必要都设置一样的.");
    // 挂载内容
    Object.values(componentList).forEach(component => {
      component.enable = valueList[flagCount++];
    });
    feature_config.debug = valueList[cptCount + 0];
    feature_config.net_gap_ms = Math.floor(valueList[cptCount + 1]);
    feature_config.fontColor = valueList[cptCount + 2];
    feature_config.zoomRate = valueList[cptCount + 3] + "%";
    feature_config.notificationMode = [valueList[cptCount + 4], valueList[cptCount + 5]];
    // 更新内容
    tools.indexDB_updateFeatureConf();
    tools.indexDB_updateIndexDBData();
    // 反馈并刷新
    window.alert("已提交更新,即将刷新.");
    location.reload();
  }
  // 防抖动保存数据库
  async debounceSaveIndexDB() {
    tools.log("触发防抖保存IndexedDB");
    await tools.indexDB_updateFeatureConf();
    await tools.indexDB_updateIndexDBData();
  }
  // 求捐赠函数
  startupForDonation() {
    let msgBody = document.createElement("div");
    let donationSite = document.createElement("a");
    donationSite.href = "https://afdian.net/a/SCT-Editor";
    donationSite.innerText = "点我前往捐赠";
    donationSite.setAttribute("target", "_blank");
    donationSite.style.marginRight = "10px";
    let donationList = document.createElement("a");
    donationList.innerText = "捐赠者名单"
    donationList.addEventListener('click', async (event) => {
      event.preventDefault();
      // let list = await tools.getNetData("https://cdn.jsdelivr.net/gh/ShenHaiSu/SimComp-APIProxy@main/commonData/donors.json?" + await tools.generateUUID());
      let list = await tools.getNetData("https://cdn.jsdelivr.net/gh/ShenHaiSu/SimComp-APIProxy/commonData/donors.json?" + await tools.generateUUID());
      list.sort(() => Math.random() - 0.5);
      let shoMsg = "作为SimCompsTools开发者道洛LTS,我非常感谢每一个用户的支持与帮助,更感谢所有支持者的慷慨捐赠.您的慷慨使我能够继续投入时间和精力来提供更好的功能/修复问题和满足更多用户的需求.非常感谢大家!";
      tools.msg_send("", shoMsg, 1);
      tools.msg_send("", "捐赠者名单(不区分先后):", 1);
      tools.msg_send("", `${list.join(", ")}`, 1);
      tools.msg_send("", `再次由衷的感谢所有支持者和用户!`, 1);
    })
    msgBody.appendChild(donationSite);
    msgBody.appendChild(donationList);
    tools.msg_send("肚肚饿饿", msgBody, 1);
  }
  // 主动获取高管信息
  async startupExecutives() {
    let realm = await tools.getRealm();
    let netData = await tools.getNetData(tools.baseURL.executives);
    if (!netData) {
      await tools.dely(5000);
      return this.startupExecutives();
    }
    this.indexDBData.executives[realm] = netData;
    await tools.indexDB_updateIndexDBData();
  }
}
new basisCPT();

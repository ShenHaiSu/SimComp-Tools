const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");


// 周期经济检测
class economicCycleDetect extends BaseComponent {
  constructor() {
    super();
    this.name = "周期经济状况检测";
    this.describe = "添加前台按钮可以点击之后获取当前最新的经济周期状态,可能会有十几秒的延迟(API的问题);";
    this.enable = true;
  }
  startupFuncList = [
    this.startDetect,
    this.init
  ]
  componentData = {
    timerFlag: undefined, // 定时检测器
    cycleList: ["萧条", "平缓", "景气"], // 经济周期标号对应文字
  }
  indexDBData = {
    // 0萧条 1平缓 2景气
    lastData: [undefined, undefined], // 经济周期的标号
    autoStart: false, // 自启动监控
  }
  // 前台功能
  frontUI = () => this.checkNewData();
  // 设置界面
  settingUI = () => {
    let mainNode = document.createElement("div");
    mainNode.id = "script_economicCycleDetect_setting";
    mainNode.innerHTML = `<div class=header>周期经济状况检测价设置</div><div class=container><div><button class="btn script_opt_submit">保存更改</button></div><table><thead><tr><td>功能<td>设置<tbody><tr><td title=自启动监控在周五晚上二十三点前后会尝试自动获取信息(可能有延迟导致错误,请注意甄别)>自启动监控<td><input class=form-control type=checkbox ${this.indexDBData.autoStart ? "checked" : ""}></table></div>`;
    mainNode.querySelector("click", event => this.settingClickHandle(event));
    return mainNode;
  }
  settingClickHandle(event) {
    if (event.target.className.match("script_opt_submit")) return this.settingSubmit();
  }
  settingSubmit() {
    let valueList = Object.values(document.querySelectorAll("#script_economicCycleDetect_setting input"))
      .map(node => node.type == "checkbox" ? node.checked : node.value);
    // 内容审查
    // 内容挂载
    this.indexDBData.autoStart = valueList[0];
    // 重启
    this.startDetect();
    tools.indexDB_updateIndexDBData();
    window.alert("保存并更新");
  }

  async init() {
    // 检测并初始化空白数据
    let realm = await tools.getRealm();
    if (this.indexDBData.lastData[realm] == undefined) {
      this.indexDBData.lastData[realm] = indexDBData.basisCPT.userInfo[realm].temporals.economyState;
    }
  }
  startDetect() {
    if (this.componentData.timerFlag) clearInterval(this.componentData.timerFlag);
    if (!this.indexDBData.autoStart) return;
    this.componentData.timerFlag = setInterval(() => this.interCheckFunc(), 10 * 1000);
  }
  interCheckFunc() {
    let nowTime = new Date();
    if (nowTime.getDay() != 5) return;
    let targetTime = new Date(nowTime.getFullYear(), nowTime.getMonth(), nowTime.getDate() + 5 - nowTime.getDay(), 23, 0, 0, 0);
    let distance = targetTime.getTime() - nowTime.getTime();
    // 十秒一次检测
    // 周五晚上十一点后三十秒会触发检查周期变动的函数
    if (distance < 0 && distance > -30 * 1000) return this.checkNewData();
  }
  async checkNewData() {
    let newData = await tools.getNetData(`${tools.baseURL.userBase}#${await tools.generateUUID()}`);
    if (!newData) return tools.msg_send("周期检测", "网络请求失败.");
    let realm = newData.authCompany.realmId;
    this.indexDBData.lastData[realm] = newData.temporals.economyState;
    indexDBData.basisCPT.userInfo[realm] = newData;
    let msg = `当前服务器:${realm == 0 ? "R1" : "R2"},经济周期为:${this.componentData.cycleList[this.indexDBData.lastData[realm]]}`;
    tools.msg_send("周期检测", msg);
    tools.indexDB_updateIndexDBData();
  }

}
new economicCycleDetect();
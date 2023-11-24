const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");


// 周期经济检测
class economicCycleDetect extends BaseComponent {
  constructor() {
    super();
    this.name = "周期经济状况检测";
    this.describe = "每周五晚上十一点前后通知当前经济周期;";
    this.enable = true;
  }
  startupFuncList = [
    this.startDetect
  ]
  componentData = {
    timerFlag: undefined, // 定时检测器
  }
  indexDBData = {
    // 0萧条 1平缓 2繁荣
    lastData: [undefined, undefined], // 经济周期的标号
  }
  async startDetect() {
    // 检测并初始化空白数据
    if (runtimeData.basisCPT.realm == undefined) return setTimeout(() => this.startDetect(), 5000);
    let realm = runtimeData.basisCPT.realm;
    if (this.indexDBData.lastData[realm] == undefined) {
      this.indexDBData.lastData[realm] = indexDBData.basisCPT.userInfo[realm].temporals.economyState;
    }
    this.componentData.timerFlag = setInterval(() => this.interCheckFunc(), 10 * 1000);
  }
  interCheckFunc() {
    let nowTime = new Date();
    if (nowTime.getDay() != 5) return;
    let targetTime = new Date(nowTime.getFullYear(), nowTime.getMonth(), nowTime.getDate() + 5 - nowTime.getDay(), 23, 0, 0, 0);
    let distance = targetTime.getTime() - nowTime.getTime();
    // 十秒一次检测
    // 未到周五23点 以及最后10秒钟
    if (distance < 0 && distance > -30 * 1000) return this.checkNewData();
  }
  async checkNewData() {
    let newData = await tools.getNetData(`${tools.baseURL.userBase}#${await tools.generateUUID()}`);
    if (!newData) return tools.msg_send("周期检测", "网络请求失败.");
    let realm = newData.authCompany.realmId;
    this.indexDBData.lastData[realm] = newData.temporals.economyState;
    indexDBData.basisCPT.userInfo[realm] = newData;
    let msg = `当前服务器:${realm == 0 ? "R1" : "R2"},经济周期为:`;
    switch (this.indexDBData.lastData[realm]) {
      case 0:
        msg += "萧条.";
        break;
      case 1:
        msg += "平缓.";
        break;
      case 2:
        msg += "繁荣.";
        break;
    }
    tools.msg_send("周期检测", msg);
    tools.indexDB_updateIndexDBData();
  }
  // 前台功能
  frontUI = () => this.checkNewData();
}
new economicCycleDetect();
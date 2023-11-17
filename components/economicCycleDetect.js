const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 周期经济检测
class economicCycleDetect extends BaseComponent {
  constructor() {
    super();
    this.name = "周期经济状况检测";
    this.describe = "每周五晚上十一点前后会根据电厂数据来计算当前经济周期的变化;";
    this.enable = true;
  }
  startupFuncList = [
    this.startDetect
  ]
  componentData = {
    timerFlag: undefined, // 定时检测器
    baseURL: "https://www.simcompanies.com/api/v4/zh/0/encyclopedia/resources" // /Realm/Resid/
  }
  indexDBData = {
    lastData: [0, 0], // 最近一次的电厂小时产量值
  }
  async startDetect() {
    // 检测并尝试初始化空白数据
    if (this.indexDBData.lastData.includes(0)) {
      let netData = await this.getWholeNetData();
      if (!netData[0] || !netData[1]) {
        tools.msg_send("周期检测", "周期检测初始化失败,未能获取到初始值.请检查网络连接....");
        return setTimeout(() => this.startDetect(), 1000 * 10); // 十秒后重试
      }
      this.indexDBData.lastData[0] = Math.floor(netData[0]);
      this.indexDBData.lastData[1] = Math.floor(netData[1]);
      await tools.indexDB_updateIndexDBData();
    }
    // 每五秒检测一次时间差值,在周五晚上23点前后会反复更新数据
    this.componentData.timerFlag = setInterval(() => this.interCheckFunc(), 5 * 1000);
    // 消息提示
    tools.msg_send("经济周期检测", "已经开始定时检测经济周期变动.", 1);
  }
  interCheckFunc() {
    let nowTime = new Date();
    if (nowTime.getDay() != 5) return;
    let targetTime = new Date(nowTime.getFullYear(), nowTime.getMonth(), nowTime.getDate() + 5 - nowTime.getDay(), 23, 0, 0, 0);
    // let targetTime = new Date(nowTime.getFullYear(), nowTime.getMonth(), nowTime.getDate(), 19, 35, 0, 0);
    let distance = targetTime.getTime() - nowTime.getTime();
    // tools.log(distance);
    // 未到周五23点 以及最后10秒钟
    if (distance >= 0 && distance <= 10 * 1000) return this.updateNowData();
    // 已过周五23点 以及之后的五秒内
    if (distance <= 0 && distance >= -5 * 1000) return this.checkNewData();
  }
  async updateNowData() {
    let netData = await this.getWholeNetData();
    if (!netData[0] || !netData[1])
      return tools.msg_send("周期检测", "周期检测初始化失败,未能获取到初始值.请检查网络连接....", 1);
    this.indexDBData.lastData[0] = Math.floor(netData[0]);
    this.indexDBData.lastData[1] = Math.floor(netData[1]);
    await tools.indexDB_updateIndexDBData();
  }
  async checkNewData() {
    let netData = await this.getWholeNetData();
    if (!netData[0] || !netData[1]) {
      tools.msg_send("周期检测", "周期检测初始化失败,未能获取到初始值.请检查网络连接....", 1);
      return setTimeout(() => this.checkNewData(), 1000 * 10); // 十秒后重试
    }
    let distance = [
      Math.floor((Math.floor(netData[0]) - this.indexDBData.lastData[0]) / 10),
      Math.floor((Math.floor(netData[1]) - this.indexDBData.lastData[1]) / 10)
    ]
    let flag = [ // 正数就是上涨 负数就是下降 相差10以内就是没变
      distance[0] > 10 ? "更萧条" : (distance[0] < -10 ? "更景气" : "不变"),
      distance[1] > 10 ? "更萧条" : (distance[1] < -10 ? "更景气" : "不变")
    ]
    let R1description = `R1周期变动: ${flag[0]}, 产量参考量: ${this.indexDBData.lastData[0]} -> ${Math.floor(netData[0])} 变动量${Math.abs(distance[0])};`;
    let R2description = `R2周期变动: ${flag[1]}, 产量参考量: ${this.indexDBData.lastData[1]} -> ${Math.floor(netData[1])} 变动量${Math.abs(distance[1])};`;

    tools.msg_send("经济周期检测", R1description);
    tools.msg_send("经济周期检测", R2description);

    this.indexDBData.lastData = netData;
    tools.indexDB_updateIndexDBData();
  }
  async getWholeNetData() {
    let realm_0_netData = await tools.getNetData(`${this.componentData.baseURL}/0/1#${await tools.generateUUID()}`);
    let realm_1_netData = await tools.getNetData(`${this.componentData.baseURL}/1/1#${await tools.generateUUID()}`);
    let result = [realm_0_netData?.producedAnHour || false, realm_1_netData?.producedAnHour || false];
    tools.log(result);
    tools.msg_send("经济周期检测", `当前R1电厂小时产量:${result[0].toFixed(0)};当前R2电厂小时产量:${result[1].toFixed(0)}`)
    return result;
  }
}
new economicCycleDetect();
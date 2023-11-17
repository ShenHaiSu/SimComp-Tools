const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 建筑生产完工提示
class buildingEndMsg extends BaseComponent {
  constructor() {
    super();
    this.name = "建筑生产完工提示";
    this.describe = "建筑生产完成或者升级完成后会有消息提示，防止你泡在ChatRoom全给忘了。";
    this.enable = true;
  }
  startupFuncList = [
    this.mainFunc
  ];
  indexDBData = {
    time2gap: 5 * 60 * 1000, // 检查时间间隔，默认5分钟 单位ms
    msg_title: "建筑项目完工",
    msg_body: "您有一个新的建筑完工了，可以续派任务咯~",
  };
  componentData = {
    intervalFlag: undefined, // 循环器标志
  }
  mainFunc(window, mode = "start") {
    tools.log(mode)
    if (!this.enable) return;
    let runtimeData = this.componentData;
    if (mode == "clear") {
      clearInterval(runtimeData.intervalFlag);
      return runtimeData.intervalFlag == undefined;
    } else if (mode == "restart") {
      clearInterval(runtimeData.intervalFlag);
      runtimeData.intervalFlag == undefined;
      return this.mainFunc("start");
    }
    if (runtimeData.intervalFlag) return;
    runtimeData.intervalFlag = setInterval(() => this.innerFunc(), this.indexDBData.time2gap);
    tools.log("开始监听建筑信息");
  }
  async innerFunc() {
    if (!this.enable) return;
    let newMsgFlag = false;
    let realm = runtimeData.basisCPT.realm;
    let lastBuildings = indexDBData.basisCPT.building[realm];
    let netData = await tools.getNetData(tools.baseURL.building);
    if (netData == false) return;
    // 对比新旧建筑信息列表
    let oldMap = {};
    for (let i = 0; i < lastBuildings.length; i++) {
      oldMap[lastBuildings[i].id] = lastBuildings[i];
    }
    for (let i = 0; i < netData.length; i++) {
      if (oldMap[netData[i].id] && oldMap[netData[i].id].busy && !netData[i].hasOwnProperty("busy")) {
        newMsgFlag = true;
        break;
      }
    }
    lastBuildings = netData;
    // 检查标记 发送信息
    if (!newMsgFlag) return;
    tools.msg_send("建筑生产状态变动", "您的建筑中有一部分完成了生产！");
  }
  settingUI = () => {
    let newNode = document.createElement("div");
    let htmlText = `<div><div class='header'>建筑项目完工提醒设置</div><div class='container'><div><div><button class="btn script_opt_submit">保存</button></div></div><table><tr style=height:60px><td>功能<td>设置<tr><td title=单个检查的周期，默认5分钟，单位毫秒>检查时间间隔<td><input class='form-control' value=##### type=number><tr><td title=发送信息的标题>信息标题<td><input class='form-control' value=#####><tr><td title=信息内容>信息内容<td><input class='form-control' value=#####></table></div></div>`;
    htmlText = htmlText.replace("#####", `"${this.indexDBData.time2gap.toString()}"`);
    htmlText = htmlText.replace("#####", `"${this.indexDBData.msg_title}"`);
    htmlText = htmlText.replace("#####", `"${this.indexDBData.msg_body}"`);
    newNode.innerHTML = htmlText;
    newNode.id = "setting-container-6";
    newNode.className = "col-sm-12 setting-container";
    // 绑定事件
    newNode.querySelector("button.script_opt_submit").addEventListener("click", () => this.settingSubmitHandle());
    // 返回标签
    return newNode;
  }
  async settingSubmitHandle() {
    let valueList = [];
    document.querySelectorAll("#setting-container-6 input").forEach((item) => valueList.push(item.value));
    if (valueList[0] < feature_config.net_gap_ms)
      return window.alert("功能是通过发送网络请求来检查建筑状态的\n请求间隔时间不要小于'通用网络请求最小间隔'。");
    if (valueList[1] == "") valueList[1] = "建筑项目完工";
    if (valueList[2] == "") valueList[2] = "您有一个新的建筑完工了，可以续派任务咯~";
    // 保存配置
    this.indexDBData.time2gap = Math.floor(valueList[0]);
    this.indexDBData.msg_title = valueList[1];
    this.indexDBData.msg_body = valueList[2];
    await tools.indexDB_updateIndexDBData();
    // 重启功能
    this.mainFunc(undefined, "restart");
    // 交互提醒
    window.alert("已提交设置并保存。");
  }
}
new buildingEndMsg();
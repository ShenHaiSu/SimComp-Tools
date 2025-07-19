const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config, langData } = require("../tools/tools.js");

/**
 * @class bondTracker
 * @augments BaseComponent
 * @description 用于定时查询当前债券市场是否有符合要求的债券可供购买。
 */
class bondTracker extends BaseComponent {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.name = "债券市场追踪器";
    this.describe = "用于定时查询当前债券市场是否有符合要求的债券可供购买";
    this.enable = true;
    this.tagList = ["债券", "追踪"];
  }

  /**
   * @property {object} indexDBData - 存储在 IndexedDB 中的数据。
   * @property {Array<object>} indexDBData.realmData - 不同服务器（R1/R2）的追踪设置。
   * @property {number} indexDBData.realmData[].minAmount - 最低数量。
   * @property {number} indexDBData.realmData[].minCredit - 最低信用评级。
   * @property {number} indexDBData.realmData[].minInterest - 最低利率。
   * @property {boolean} indexDBData.autoTrack - 是否自动追踪。
   */
  indexDBData = {
    realmData: [
      { // R1
        minAmount: 0, // 最低数量
        minCredit: 0, // 最低信用评级
        minInterest: 0.55, // 最低利率
      }, { // R2
        minAmount: 0, // 最低数量
        minCredit: 0, // 最低信用评级
        minInterest: 0.55, // 最低利率
      }
    ],
    autoTrack: false, // 自动追踪
  }

  /**
   * @property {object} componentData - 组件内部数据。
   * @property {string} componentData.baseURL - 债券市场 API 的基础 URL。
   * @property {Array<string>} componentData.creditRatingList - 信用评级列表。
   * @property {number|undefined} componentData.trackerFlag - 追踪器定时器的标识符。
   */
  componentData = {
    baseURL: "https://www.simcompanies.com/api/bonds/rating/AAA-to-D/",
    creditRatingList: ["AAA", "AA+", "AA", "AA-", "A+", "A", "A-", "BBB+", "BBB", "BBB-", "BB+", "BB", "BB-", "B+", "B", "B-", "C", "D"],
    trackerFlag: undefined, // 追踪器标识
  }

  startupFuncList = [
    this.startTracker
  ]

  /**
   * @function frontUI
   * @description 前端 UI 入口，触发追踪器处理函数。
   * @returns {void}
   */
  frontUI = () => this.trackerHandle("common");

  /**
   * @function settingUI
   * @description 生成设置界面的 HTML 元素。
   * @returns {Promise<HTMLElement>} 设置界面的主 DOM 节点。
   */
  settingUI = async () => {
    let mainNode = document.createElement("div");
    let htmlText = `<div class=header>债券市场追踪器设置</div><div class=container><div><button class="btn script_opt_submit">保存更改</button></div><table><thead><tr><td>功能<td>设置<tbody><tr><td>当前服务器<td>######<tr><td title=勾选就打开定时追踪,会在1-2分钟钟随机一个间隔进行周期性检查>定时追踪<td><input class=form-control type=checkbox ######><tr><td title=如题>最低数量<td><input class=form-control type=number value=######><tr><td title=如题>最低评级<td><select class=form-control><option value=0>AAA<option value=1>AA+<option value=2>AA<option value=3>AA-<option value=4>A+<option value=5>A<option value=6>A-<option value=7>BBB+<option value=8>BBB<option value=9>BBB-<option value=10>BB+<option value=11>BB<option value=12>BB-<option value=13>B+<option value=14>B<option value=15>B-<option value=16>C<option value=17>D</select><tr><td title=如题>最低利息<td><input class=form-control type=number value=######></table></div>`;
    let realm = await tools.getRealm();
    htmlText = htmlText.replace("######", realm == 0 ? "R1 M服" : "R2 E服");
    htmlText = htmlText.replace("######", this.indexDBData.autoTrack ? "checked" : "");
    htmlText = htmlText.replace("######", this.indexDBData.realmData[realm].minAmount);
    htmlText = htmlText.replace("######", this.indexDBData.realmData[realm].minInterest);
    mainNode.innerHTML = htmlText;
    mainNode.id = `script_bondTracker_setting`;
    mainNode.querySelector("select").value = this.indexDBData.realmData[realm].minCredit;
    mainNode.addEventListener('click', event => this.settingClickHandle(event));
    return mainNode;
  }

  /**
   * @function settingClickHandle
   * @description 处理设置界面点击事件。
   * @param {Event} event - 点击事件对象。
   * @returns {void}
   */
  settingClickHandle(event) {
    if (event.target.className.match("script_opt_submit")) return this.settingSubmit();
  }

  /**
   * @function settingSubmit
   * @description 提交设置表单并保存数据。
   * @returns {Promise<void>}
   */
  async settingSubmit() {
    // 优化：将 DOM 查询移到函数外部或只查询一次
    const settingInputs = document.querySelectorAll("div#script_bondTracker_setting input, div#script_bondTracker_setting select");
    let valueList = Object.values(settingInputs)
      .map(node => node.type == "checkbox" ? node.checked : node.value);
    let realm = await tools.getRealm();
    // 初始化审查
    valueList[1] = Math.floor(valueList[1]);
    valueList[2] = Math.floor(valueList[2]);
    valueList[3] = parseFloat(valueList[3]);
    if (valueList[1] < 0) return tools.alert("最低数量不能是负数");
    if (valueList[3] < 0 || valueList[3] > 2) return tools.alert("不会存在超出 0-2 之间的利率");
    // 保存
    this.indexDBData.autoTrack = valueList[0];
    this.indexDBData.realmData[realm].minAmount = valueList[1];
    this.indexDBData.realmData[realm].minCredit = valueList[2];
    this.indexDBData.realmData[realm].minInterest = valueList[3];
    // 重启动
    this.startTracker();
    // 返回
    return tools.alert("保存并重启更新");
  }

  /**
   * @function startTracker
   * @description 启动债券追踪器定时任务。
   * @returns {void}
   */
  startTracker() {
    if (this.componentData.trackerFlag) clearInterval(this.componentData.trackerFlag);
    if (!this.indexDBData.autoTrack) return;
    this.componentData.trackerFlag = setInterval(() => this.trackerHandle("slient"), tools.getRandomNumber(60 * 1000, 120 * 1000, parseInt));
  }

  /**
   * @function trackerHandle
   * @description 处理债券追踪逻辑，获取并筛选债券数据。
   * @param {string} [mode="common"] - 追踪模式，可以是 "common" 或 "slient"。
   * @returns {Promise<void>}
   */
  async trackerHandle(mode = "common") {
    let realm = await tools.getRealm();
    let netData = await tools.getNetData(this.componentData.baseURL);
    if (!netData) return;
    let targetRef = this.indexDBData.realmData[realm];
    let msgList = netData.filter(bond => {
      let creditIndex = this.componentData.creditRatingList.findIndex(value => value == bond.seller.rating);
      let creditCheck = creditIndex == -1 ? false : (creditIndex <= targetRef.minCredit ? true : false);
      let amountCheck = bond.amount >= targetRef.minAmount;
      let interestCheck = bond.interest >= targetRef.minInterest;
      return creditCheck && amountCheck && interestCheck;
    }).map(bond => {
      // 优化：使用模板字符串
      return `${bond.seller.company}发售了${bond.amount}只利率为${bond.interest}的股票,其信用评级为:${bond.seller.rating}`;
    });
    if (msgList.length == 0 && mode != "slient") return tools.msg_send("债券市场追踪器", "未找到符合要求的债券.");
    for (let i = 0; i < msgList.length; i++) {
      tools.msg_send("债券市场追踪器", msgList[i]);
    }
  }
}
new bondTracker();
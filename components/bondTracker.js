const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config, langData } = require("../tools/tools.js");

class bondTracker extends BaseComponent {
  constructor() {
    super();
    this.name = "债券市场追踪器";
    this.describe = "用于定时查询当前债券市场是否有符合要求的债券可供购买";
    this.enable = true;
  }
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
  componentData = {
    baseURL: "https://www.simcompanies.com/api/bonds/rating/AAA-to-D/",
    creditRatingList: ["AAA", "AA+", "AA", "AA-", "A+", "A", "A-", "BBB+", "BBB", "BBB-", "BB+", "BB", "BB-", "B+", "B", "B-", "C", "D"],
    trackerFlag: undefined, // 追踪器标识
  }
  startupFuncList = [
    this.startTracker
  ]
  frontUI = () => this.trackerHandle();
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
  settingClickHandle(event) {
    if (event.target.className.match("script_opt_submit")) return this.settingSubmit();
  }
  async settingSubmit() {
    let valueList = Object.values(document.querySelectorAll("div#script_bondTracker_setting input, div#script_bondTracker_setting select"))
      .map(node => node.type == "checkbox" ? node.checked : node.value);
    let realm = await tools.getRealm();
    // 初始化审查
    valueList[1] = Math.floor(valueList[1]);
    valueList[2] = Math.floor(valueList[2]);
    valueList[3] = parseFloat(valueList[3]);
    if (valueList[1] < 0) return window.alert("最低数量不能是负数");
    if (valueList[3] < 0 || valueList[3] > 2) return window.alert("不会存在超出 0-2 之间的利率");
    // 保存
    this.indexDBData.autoTrack = valueList[0];
    this.indexDBData.realmData[realm].minAmount = valueList[1];
    this.indexDBData.realmData[realm].minCredit = valueList[2];
    this.indexDBData.realmData[realm].minInterest = valueList[3];
    // 重启动
    this.startTracker();
    // 返回
    return window.alert("保存并重启更新");
  }

  startTracker() {
    if (this.componentData.trackerFlag) clearInterval(this.componentData.trackerFlag);
    if (!this.indexDBData.autoTrack) return;
    this.componentData.trackerFlag = setInterval(() => this.trackerHandle(), tools.getRandomNumber(60 * 1000, 120 * 1000, parseInt));
  }
  async trackerHandle() {
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
      return `${bond.seller.company}发售了${bond.amount}只利率为${bond.interest}的股票,其信用评级为:${bond.seller.rating}`;
    });
    if (msgList.length == 0) return tools.msg_send("债券市场追踪器","未找到符合要求的债券.");
    for (let i = 0; i < msgList.length; i++) {
      tools.msg_send("债券市场追踪器", msgList[i]);
    }
  }
}
new bondTracker();
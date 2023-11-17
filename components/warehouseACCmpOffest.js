const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 仓库出售界面显示mp偏移
class warehouseACCmpOffest extends BaseComponent {
  constructor() {
    super();
    this.name = "仓库出售界面显示mp偏移";
    this.describe = "在仓库出售表格中,填写单价的下面会自动根据当前";
    this.enable = true;
  }
  indexDBData = {
    mp_offest: 3, // mp-0 默认是0 就是 市场价-0%
  }
  componentData = {
    onLoad: false, // 正在加载标记
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/warehouse\/(.+)/) && document.querySelectorAll("form").length > 0),
    func: this.mainFunc
  }]
  settingUI = () => {
    let newNode = document.createElement("div");
    newNode.className = "col-sm-12 setting-container";
    newNode.id = "accMPoffsetSetting";
    newNode.innerHTML = `<div class="header">仓库出售界面显示mp偏移</div><div class="container"><div><button class="btn script_opt_submit">保存</button></div><table><thead><tr><td>功能</td><td>设置</td></tr></thead><tbody><tr><td title="MarketPrice Offest 偏移量 填写1 就是 mp-1">mp量</td><td><input type='number' class="form-control" value="#####"></td></tr></tbody></table></div>`;
    newNode.innerHTML = newNode.innerHTML.replace("#####", this.indexDBData.mp_offest);
    // 绑定按钮
    newNode.querySelector("button.script_opt_submit").addEventListener('click', () => this.settingSubmit())
    // 返回元素
    return newNode;
  }
  settingSubmit() {
    let value = parseFloat(document.querySelector("div#accMPoffsetSetting input").value);
    if (value == 0) value == 0;
    if (value < 0 || value >= 100) return window.alert("你要不要看看你填的啥?");
    this.indexDBData.mp_offest = value;
    tools.indexDB_updateIndexDBData();
    window.alert("已提交更改");
  }
  async mainFunc() {
    // 检查配置
    if (this.indexDBData.mp_offest == 0) return;
    // 检查网页标记是否已存在
    if (document.querySelector("span#script_mpoffest_span")) return;
    // 检测是否正在等待加载
    if (this.componentData.onLoad) return;
    this.componentData.onLoad = true;
    try {
      let newNode = document.createElement("span");
      let realm = runtimeData.basisCPT.realm;
      newNode.id = "script_mpoffest_span";
      // let res_name = document.querySelector("form").previousElementSibling.querySelector("b").innerText;
      let res_name = decodeURI(location.href.match(/\/([^\/]+)$/)[1]);
      let res_id = tools.itemName2Index(res_name);
      let quality = this.getQuality(document.querySelector("form"));
      let market_price = await tools.getMarketPrice(res_id, quality, realm);
      if (market_price == 0) market_price = 0;
      let displayText = `MP-${this.indexDBData.mp_offest}：`;
      displayText += `${(market_price * (100 - this.indexDBData.mp_offest) / 100).toFixed(3)}`;
      newNode.innerText = displayText;
      document.querySelector("input[name='price']").parentElement.appendChild(newNode);
    } catch (error) {
      tools.errorLog(error);
    }
    this.componentData.onLoad = false;
  }
  getQuality(formNode) {
    let starsCount = formNode.previousElementSibling.querySelectorAll("span > svg").length;
    if (starsCount == 0) return 0;
    let qualityNumber = parseInt(formNode.previousElementSibling.querySelectorAll("span > svg")[0].parentElement.innerText);
    return isNaN(qualityNumber) ? starsCount : qualityNumber;
  }
}
new warehouseACCmpOffest();
const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 在交易行使用限定金额进行采购
class purchaseByMoney extends BaseComponent {
  constructor() {
    super();
    this.name = "交易所金额限购";
    this.describe = "交易行多出一排信息，输入采购目标（最低品质要求，最高金额限制）\n点击按钮会提示计算结果，点击确定会尝试进行采购\n采购金额误差可能有±1%";
    this.enable = true;
    this.tagList = ['实用','交易所'];
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/market\/resource\/(\d+)\//)),
    func: this.mainFunc
  }];
  componentData = {
    containerNode: undefined, // 按钮元素挂载
  };
  cssText = [`div#script_purchaseByMoney_container{margin:10px;display:flex;justify-content:center;align-items:center;width:auto;height:45px;}div#script_purchaseByMoney_container>input#script_quality_Inp{width:80px;height:34px;}div#script_purchaseByMoney_container>input#script_amount_Inp{margin:10px;width:150px;height:34px;}div#script_purchaseByMoney_container>button#scriptBtn_1{background-color:green;color:var(--fontColor);}`]
  mainFunc() {
    let targetNode = document.querySelector("form").parentElement;
    // 检查按钮是否已经挂载
    if (!this.componentData.containerNode && targetNode.querySelectorAll("div#script_purchaseByMoney_container").length == 0) {
      // 第一次加载
      let htmltext = `
        <input id="script_quality_Inp" placeholder="最低品质" type="number"/>
        <input id="script_amount_Inp" placeholder="全款金额" type="number"/>
        <button class="btn" id="scriptBtn_1" style="">使用金额限购</button>`;
      let tempDiv = document.createElement("div");
      tempDiv.id = "script_purchaseByMoney_container";
      tempDiv.innerHTML = htmltext;
      targetNode.appendChild(tempDiv);
      this.componentData.containerNode = tempDiv;
      document.querySelector("button#scriptBtn_1").addEventListener("click", () => this.purchaseButtonHandle());
    } else if (this.componentData.containerNode && targetNode.querySelectorAll("div#script_purchaseByMoney_container").length == 0) {
      // 创建过 没挂载
      targetNode.appendChild(this.componentData.containerNode);
    }
  }

  async purchaseButtonHandle() {
    let quality = parseInt(document.querySelector("#script_quality_Inp").value) || 0;
    let amount = document.querySelector("#script_amount_Inp").value;
    let res_id = parseInt(location.href.match(/\d+(?=\/$)/)?.[0]);
    let temp_cost = 0.0;
    let quantity = 0;
    let maxPrice = 0.0;
    let realm = runtimeData.basisCPT.realm;
    if (quality == "") quality = 0;
    if (quality < 0 || quality > 12) return tools.alert("品质输入有误");
    if (amount == "" || amount < 0) return tools.alert("金额输入有误");
    let market_data = await tools.getNetData(`${tools.baseURL.market}/${realm}/${res_id}/#${tools.generateUUID()}`);
    if (!market_data) return tools.alert("交易行资源请求失败，请重试或检查网络连接。");
    for (let i = 0; i < market_data.length; i++) {
      let element = market_data[i];
      if (element.quality < quality) continue;
      if (amount > temp_cost + element.price * element.quantity) {
        temp_cost += element.price * element.quantity;
        quantity += element.quantity;
        continue;
      }
      quantity += (amount - temp_cost) / element.price;
      quantity = parseInt(quantity);
      maxPrice = element.price;
      break;
    }
    let userConfirm = await tools.confirm(
      `使用金额限定从交易行购买 - \n    最大价格:${maxPrice}, \n    最低质量:${quality}, \n    物品数量:${quantity - 1
      }, \n    物品ID:${res_id}\n是否确定？`
    );
    if (!userConfirm) return;
    let failFlag = false;
    setTimeout(() => {
      try {
        document.querySelectorAll("form ul[role='menu'] li > a")[quality].click();
      } catch (error) {
        tools.errorLog(error);
        failFlag = true;
      }
    }, 500);

    setTimeout(() => {
      try {
        tools.setInput(document.querySelector("form input[name='quantity']"), quantity - 1);
      } catch (error) {
        tools.errorLog(error);
        failFlag = true;
      }
    }, 1000);

    setTimeout(() => {
      if (failFlag) return tools.alert("执行出错.请尝试打开debug模式,重试后截图控制台信息给开发者.");
      document.querySelector("form button[type=submit]").click();
    }, 1500);
  }
}
new purchaseByMoney();
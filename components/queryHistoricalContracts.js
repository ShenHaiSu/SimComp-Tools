const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config, langData } = require("../tools/tools.js");


class queryHistoricalContracts extends BaseComponent {
  constructor() {
    super();
    this.name = "查询历史合同";
    this.describe = "在仓库物资界面,发送合同给目标公司时,可以点击按钮查询曾经相关往来.了解价格.";
    this.enable = true;
  }
  componentData = {
    buttonNode: undefined, // 按钮对象
    displayFlag: false, // 显示模式
    hisContaracts: [], // 缓存的历史变动 [id:[]]
    blockCataList: ["o", "p", "b"], // 屏蔽的变动类别
  }
  cssText = [
    `#script_hisContracts_mainDiv{color:var(--fontColor);background-color:rgb(0,0,0,0.7);}#script_hisContracts_mainDiv table>thead{text-align:center;}#script_hisContracts_mainDiv table{width:100%;border-collapse:separate;border-spacing:10px;}#script_hisContracts_mainDiv table tr>td:nth-of-type(1)>span{display:block;width:100px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}#script_hisContracts_mainDiv table tr>td:nth-of-type(5){text-align:end;}`
  ]
  commonFuncList = [{
    match: () => Boolean(/headquarters\/warehouse\/.+/.test(location.href) && document.querySelectorAll("button.link-button[type='button']").length != 0),
    func: this.mountButtonFunc
  }]
  netFuncList = [{
    urlMatch: (url) => /resources-transactions\/(\d+)\//.test(url),
    func: this.netGetFunc
  }]

  netGetFunc(url, method, resp) {
    let data = JSON.parse(resp);
    data = data.filter(cont => !this.componentData.blockCataList.includes(cont.category));
    let netItemID = parseInt(url.match(/resources-transactions\/(\d+)\//)[1]);
    let existFlag = parseInt(url.match(/resources-transactions\/\d+\/(\d+)\//)[1]) == 0;
    if (existFlag) {
      this.componentData.hisContaracts[netItemID] = data;
    } else {
      this.componentData.hisContaracts[netItemID] = this.componentData.hisContaracts[netItemID].concat(data);
    }
    // console.log(this.componentData.hisContaracts);
  }

  // 挂载切换按钮
  mountButtonFunc() {
    // 创建并缓存
    if (!this.componentData.buttonNode) {
      let newButton = document.createElement("button");
      newButton.id = "script_queryHisCont_btn";
      newButton.innerText = "相关历史订单";
      newButton.addEventListener('click', (event) => this.buttonClickHandle(event));
      this.componentData.buttonNode = newButton;
    }
    // 检查当前界面有没有按钮
    if (document.getElementById("script_queryHisCont_btn")) return;
    // 找到挂载目标
    let baseTarget = document.querySelector("svg[data-icon='filter']");
    let afterTarget = tools.getParentByIndex(baseTarget, 1);
    let parentTarget = tools.getParentByIndex(baseTarget, 2);
    // 挂载目标
    parentTarget.insertBefore(this.componentData.buttonNode, afterTarget);
    // 初始化显示模式
    this.componentData.displayFlag = false;
  }

  // 按钮功能函数
  buttonClickHandle(event) {
    // 检查当前是否能获取到公司名
    if (!document.querySelector("form>div>b") && !this.componentData.displayFlag) return tools.alert("请在合同界面,先选定一个收货方再点击此按钮来查询.(最多查询一周长度)");
    // 检查当前显示状态
    let nowItemID = tools.itemName2Index(decodeURI(location.href.match(/headquarters\/warehouse\/(.+)/)[1]));
    let scriptNode = document.querySelector("div#script_hisContracts_mainDiv");
    let targetNode = tools.getParentByIndex(event.target, 3);
    let originNode = targetNode.childNodes[1];
    // 取消显示 并返回
    if (this.componentData.displayFlag || !document.querySelector("form>div>b")) {
      scriptNode.style.display = "none";
      originNode.style.display = "";
      this.componentData.displayFlag = false;
      return;
    }
    // 检查缓存数据
    if (this.componentData.hisContaracts[nowItemID] == undefined) return tools.alert("请先点击原网页的'获取库存记录变动'按钮");
    // 创建显示
    if (scriptNode) scriptNode.remove();
    scriptNode = document.createElement("div");
    scriptNode.id = "script_hisContracts_mainDiv";
    let htmlText = `<table><thead><tr><td>目标</td><td>Q</td><td>量</td><td>单价</td><td>时间</td></tr></thead><tbody>`;
    let targetCompanyName = document.querySelector("form>div>b").innerText;
    for (let i = 0; i < this.componentData.hisContaracts[nowItemID].length; i++) {
      let contract = this.componentData.hisContaracts[nowItemID][i];
      if (contract.otherParty.company != targetCompanyName) continue;
      let displayAmount = contract.amount > 0 ? `+${tools.numberAddCommas(contract.amount)}` : tools.numberAddCommas(contract.amount);
      let avgPrice = (Math.abs(contract.cost / contract.amount)).toFixed(3);
      let timeString = new Date(contract.datetime).toLocaleString();
      htmlText += `<tr><td><span>${targetCompanyName}</span></td><td>${contract.quality}</td><td>${displayAmount}</td><td>$${avgPrice}</td><td>${timeString}</td></tr>`
    }
    htmlText += `</tbody></table>`;
    scriptNode.innerHTML = htmlText;
    // 挂载并修改样式
    targetNode.appendChild(scriptNode);
    scriptNode.style.display = "";
    originNode.style.display = "none";
    this.componentData.displayFlag = true;
  }

}
new queryHistoricalContracts();
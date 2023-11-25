const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 零售显示总利润/时利润/建议定价
class retailDisplayProfit extends BaseComponent {
  constructor() {
    super();
    this.name = "零售显示总利润、时利润";
    this.describe = "在零售建筑中尝试上架零售物品的时候，会实时计算零售利润和每小时利润";
    this.enable = true;
    this.canDisable = true;
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/\/b\/\d+\//)) && document.activeElement.name == "price" && document.activeElement.tagName == "INPUT",
    func: this.mainFunc
  }]
  componentData = {
    fadeTimer: undefined, // 自动消失计时器标签
    containerNode: undefined, // 显示容器元素
    lastActiveInputNode: undefined, // 最后一次激活中的input标签
  }
  cssText = [
    `#retail_display_div {color:var(--fontColor);padding:5px;border-radius:5px;background-color:rgba(0, 0, 0, 0.5);position:fixed;top:50%;right:0;transform: translateY(-50%) translateX(-50%);width:270px;z-index:1032;justify-content:center;align-items:center;}#retail_display_div button{background:#6B6B6B;margin-top:5px;}`
  ];

  async mainFunc() {
    // 初始化
    let activeNode = document.activeElement;
    let activeNodeRect = activeNode.getBoundingClientRect();
    let targetNode = tools.getParentByIndex(activeNode, 5).previousElementSibling.querySelector("div > div > h3").parentElement;
    let quantity = tools.getParentByIndex(activeNode, 2).previousElementSibling.querySelector("div > p > input[name='quantity']").value;
    // let quality = this.getQuality(activeNode);
    // let buildingLevel = parseInt(Object.values(document.querySelectorAll("div>span>b")).filter(node => /\d+级/.test(node.innerText))[0].innerText);
    let price = activeNode.value;
    let baseInfo;
    try { baseInfo = this.getInfo(targetNode) } catch (error) { return }

    // 异常处理取消计算
    if (baseInfo.profit <= 0) return; // 利润小于0 不处理
    if (quantity == "" || quantity <= 0) return; // 零售数量小于0 不处理
    if (price == "" || price <= 0) return; // 零售单价小于0 不处理

    // 清除原有计时器
    if (this.componentData.fadeTimer) clearTimeout(this.componentData.fadeTimer);

    // 更新最近input标记
    this.componentData.lastActiveInputNode = document.activeElement;

    // 构建元素并挂载
    if (!this.componentData.containerNode) {
      let newNode = document.createElement("div");
      newNode.id = "retail_display_div";
      Object.assign(newNode.style, { display: "none" });
      this.componentData.containerNode = newNode;
      document.body.appendChild(newNode);
      // 挂载锁定时利润事件委派
      newNode.addEventListener('click', event => this.clickEventHandle(event));
    }

    // 填充内容
    let totalProfit = parseFloat((baseInfo.profit * quantity).toFixed(2));
    let hourProfit = parseFloat((totalProfit / baseInfo.duration_hour).toFixed(2));
    let htmlText = ``;
    htmlText += `<div>预估数据: </div>`
    htmlText += `<div>总利润：${totalProfit}</div>`;
    htmlText += `<div>时利润：${hourProfit}</div>`;
    htmlText += `<div>`;
    htmlText += `  <button class='btn' id='script_reatil_maxHour'>最大时利</button>`;
    htmlText += `  <button class='btn' id='script_reatil_maxUnit'>最大单利</button>`
    htmlText += `  <button class='btn' id='script_reatil_targetHour'>指定时利</button>`;
    htmlText += `</div>`;
    this.componentData.containerNode.innerHTML = htmlText;
    Object.assign(this.componentData.containerNode.style, {
      display: "block",
      top: `${activeNodeRect.top + activeNodeRect.height + 100}px`,
      left: `${activeNodeRect.left + activeNodeRect.width}px`,
    })

    // 创建计时器
    this.componentData.fadeTimer = setTimeout(() => {
      Object.assign(this.componentData.containerNode.style, { display: "none" });
    }, 3000)
  }
  getInfo(node) {
    let textList = node.innerText.split("\n");
    let name = textList[0];
    let profit = parseFloat(textList[3].replaceAll(",", "").match(/\$(-)?\d+\.\d+/)[0].replace("$", ""));
    let matchList = textList[4].match(/(\d+:\d+)|(\(.+\))/g);
    let duration_hour = this.getTimeFormat(matchList[0], matchList[1]);
    return { name, profit, duration_hour };
  }
  getTimeFormat(targetStamp, durationTime) {
    let nowTime = new Date();
    let [targetHour, targetMinutes] = targetStamp.split(":");
    let targetTime = new Date(nowTime.getFullYear(), nowTime.getMonth(), nowTime.getDate(), targetHour, targetMinutes);
    let timeDiff = parseFloat(((targetTime.getTime() - nowTime.getTime()) / (1000 * 60 * 60)).toFixed(3));
    let exactOffect = 0;
    // 获取分钟与秒
    exactOffect += (/(\d+)d/.test(durationTime)) ? parseInt(durationTime.match(/(\d+)d/)[1]) : 0;
    exactOffect += (/(\d+)w/.test(durationTime)) ? parseInt(durationTime.match(/(\d+)w/)[1]) * 7 : 0;
    timeDiff += (timeDiff < 0) ? ((exactOffect + 1) * 24) : exactOffect * 24;
    tools.log(`销售完成时间:${new Date(new Date().getTime() + timeDiff * 60 * 60 * 1000).toLocaleString()}`);
    return timeDiff;
  }
  getQuality(node) {
    let rootNode = tools.getParentByIndex(node, 6);
    let quality = 0;
    quality += rootNode.querySelectorAll("svg[data-icon='star'][role='img']").length;
    quality += (rootNode.querySelectorAll("svg[data-icon='star'][role='img']").length * 0.5);
    return quality;
  }
  getCost(resName, quantity) {
    // 统计未被封锁的物品,直到抵达总量符合
    let nowQuantity = 0;
    let totalCost = 0;
    let realm = runtimeData.basisCPT.realm;
    let newArray = indexDBData.basisCPT.warehouse[realm].filter(item => !item.blocked && item.kind.name == resName);
    newArray = newArray.sort((aItem, bitem) => bitem.quality - aItem.quality);
    for (let i = 0; i < newArray.length; i++) {
      let pCost = Object.values(newArray[i].cost).reduce((a, c) => a + c, 0) / newArray[i].amount;
      pCost = pCost.toFixed(2);
      let distance = quantity - nowQuantity;
      if (distance == 0) break;
      if (distance >= newArray[i].amount) {
        // 累加不满足总量
        nowQuantity += newArray[i].amount;
        totalCost += newArray[i].amount * pCost;
      } else if (distance < newArray[i].amount) {
        // 当前总量累加后超过距离
        nowQuantity += distance;
        totalCost += distance * pCost;
      }
    }
    return (totalCost / nowQuantity).toFixed(2);
  }
  // 按钮事件委派
  clickEventHandle(event) {
    // if (event.target.tagName == "INPUT" && event.target.id == "script_lockProfit") return this.lockHourProfit(event);
    if (event.target.tagName == "BUTTON" && event.target.id == "script_reatil_maxHour") return this.setMaxProfitPrice(event);
    if (event.target.tagName == "BUTTON" && event.target.id == "script_reatil_maxUnit") return this.setMaxUnitProfit(event);
    if (event.target.tagName == "BUTTON" && event.target.id == "script_reatil_targetHour") return this.lockHourProfit(event);
  }
  // 最大单利润
  async setMaxUnitProfit() {
    try {
      // 锁定填写框
      this.componentData.lastActiveInputNode.disabled = true;
      // 前置行为
      let { targetNode, quantity, basePrice, maxPrice, step } = this.preAction();
      // 开始模拟
      let maxUnitProfit = 0.0;
      let baseInfo;
      for (let tampPrice = basePrice; tampPrice < maxPrice; tampPrice += step) {
        await tools.dely(1);
        tools.setInput(this.componentData.lastActiveInputNode, tampPrice);
        baseInfo = this.getInfo(targetNode);
        let tempUnitProfit = parseFloat(baseInfo.profit);
        if (tempUnitProfit <= maxUnitProfit) continue;
        maxUnitProfit = tempUnitProfit;
        basePrice = tampPrice;
      }
      tools.log("价格", basePrice, "单利润", maxUnitProfit);
      tools.setInput(this.componentData.lastActiveInputNode, basePrice);
    } finally {
      // 解锁填写框
      this.componentData.lastActiveInputNode.disabled = false;
    }
  }
  // 指定时利润
  async lockHourProfit(event) {
    let targetHourProfit = window.prompt("输入期望的小时收益", "0.0");
    if (isNaN(parseFloat(targetHourProfit))) return;
    try {
      // 锁定填写框
      this.componentData.lastActiveInputNode.disabled = true;
      // 前置行为
      let { targetNode, quantity, basePrice, maxPrice, step } = this.preAction();
      // 开始模拟
      let maxProfit = parseFloat(targetHourProfit);
      let baseInfo;
      for (let tampPrice = basePrice; tampPrice < maxPrice; tampPrice += step) {
        await tools.dely(1);
        tools.setInput(this.componentData.lastActiveInputNode, tampPrice);
        baseInfo = this.getInfo(targetNode);
        let tempProfit = parseFloat(baseInfo.profit * quantity / baseInfo.duration_hour);
        if (tempProfit <= maxProfit) continue;
        basePrice = tampPrice;
        break;
      }
      tools.log("价格", basePrice, "时利润", maxProfit);
      tools.setInput(this.componentData.lastActiveInputNode, basePrice);
    } finally {
      // 解锁填写框
      this.componentData.lastActiveInputNode.disabled = false;
    }
  }
  // 最大时利润
  async setMaxProfitPrice(event) {
    try {
      // 锁定填写框
      this.componentData.lastActiveInputNode.disabled = true;
      // 前置行为
      let { targetNode, quantity, basePrice, maxPrice, step } = this.preAction();
      // 开始模拟
      let maxProfit = 0.0;
      let baseInfo;
      for (let tampPrice = basePrice; tampPrice < maxPrice; tampPrice += step) {
        await tools.dely(1);
        tools.setInput(this.componentData.lastActiveInputNode, tampPrice);
        baseInfo = this.getInfo(targetNode);
        let tempProfit = parseFloat(baseInfo.profit * quantity / baseInfo.duration_hour);
        if (tempProfit <= maxProfit) continue;
        maxProfit = tempProfit;
        basePrice = tampPrice;
      }
      tools.log("价格", basePrice, "时利润", maxProfit);
      tools.setInput(this.componentData.lastActiveInputNode, basePrice);
    } finally {
      // 解锁填写框
      this.componentData.lastActiveInputNode.disabled = false;
    }
  }
  // 步进模拟前置行为
  preAction() {
    // 获取平均价格
    tools.setInput(this.componentData.lastActiveInputNode, 0);
    let avgPrice = parseFloat(tools.getParentByIndex(this.componentData.lastActiveInputNode, 5).previousElementSibling.innerText.split(/\n/).filter(text => text.match("平均价格"))[0].replace(/平均价格： \$|,/g, ""))
    // 获取数据
    let targetNode = tools.getParentByIndex(this.componentData.lastActiveInputNode, 5).previousElementSibling.querySelector("div > div > h3").parentElement;
    let quantity = tools.getParentByIndex(this.componentData.lastActiveInputNode, 2).previousElementSibling.querySelector("div > p > input[name='quantity']").value;
    let basePrice = parseFloat(avgPrice) * 0.8;
    let maxPrice = parseFloat(avgPrice) * 1.2;
    let step = this.getStep(maxPrice);
    return { targetNode, quantity, basePrice, maxPrice, step };
  }
  // 获取步长
  getStep(basePrice) {
    if (basePrice <= 8) return 0.01;
    if (basePrice <= 500) return 0.1;
    return 1;
  }
}
new retailDisplayProfit();
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
  }];
  componentData = {
    fadeTimer: undefined, // 自动消失计时器标签
    containerNode: undefined, // 显示容器元素
    lastCountTimeStamp: 0, // 最近一次计算的时间戳
    adminRate: 0, // 管理费比率
    retaiInfoList: [], // 零售物品信息库 [{id,name,price,marketSaturation.....}]
    recommendList: [], // 推荐定价列表 [id:121]
    apiDataList: {}, // API的数据列表 {G:{resources:{}}}
    lastNetTime: 0, // 最近一次请求网络
  }
  netFuncList = [{
    urlMatch: (url) => Boolean(url.match(/administration-overhead\/$/)),
    func: this.adminRateGet
  }, {
    urlMatch: (url) => Boolean(url.match(/encyclopedia\/resources\/\d+\/\d+\/$/)),
    func: this.getResourcesRetailInfo
  }]
  cssText = [`#retail_display_div {color:var(--fontColor);border-radius:5px;background-color:rgba(0, 0, 0, 0.5);position:fixed;top:50%;right:0;transform: translateY(-50%);width:150px;z-index:1032;justify-content:center;align-items:center;}`];

  async mainFunc() {
    // 初始化
    let activeNode = document.activeElement;
    let activeNodeRect = activeNode.getBoundingClientRect();
    let targetNode = tools.getParentByIndex(activeNode, 5).previousElementSibling.querySelector("div > div > h3").parentElement;
    let quantity = tools.getParentByIndex(activeNode, 2).previousElementSibling.querySelector("div > p > input[name='quantity']").value;
    let quality = this.getQuality(activeNode);
    let price = activeNode.value;
    let baseInfo;
    try { baseInfo = this.getInfo(targetNode) } catch (error) { return }

    // 异常处理取消计算
    if (baseInfo.profit <= 0) return; // 利润小于0 不处理
    if (quantity == "" || quantity <= 0) return; // 零售数量小于0 不处理
    if (price == "" || price <= 0) return; // 零售单价小于0 不处理

    // 清除原有计时器
    if (this.componentData.fadeTimer) clearTimeout(this.componentData.fadeTimer);

    // 构建元素并挂载
    if (!this.componentData.containerNode) {
      let newNode = document.createElement("div");
      newNode.id = "retail_display_div";
      Object.assign(newNode.style, { display: "none" });
      this.componentData.containerNode = newNode;
      document.body.appendChild(newNode);
    }

    // 计算推荐价格
    let recommendPrice = await this.genRecommendPrice(tools.itemName2Index(baseInfo.name), quality, quantity, price);

    // 填充内容
    let totalProfit = (baseInfo.profit * quantity).toFixed(3);
    let hourProfit = (totalProfit / baseInfo.duration_hour).toFixed(3);
    this.componentData.containerNode.innerText = `预估数据：\n总利润：${totalProfit}\n时利润：${hourProfit}\n参考数据:${recommendPrice}`;
    Object.assign(this.componentData.containerNode.style, {
      display: "flex",
      top: `${activeNodeRect.top + activeNodeRect.height + 64}px`,
      left: `${activeNodeRect.left}px`,
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
    let duration_hour = this.getTimeFormat(textList[4].match(/\(.+\)/)[0].replaceAll(/\(|\)/g, ""));
    return { name, profit, duration_hour };
  }
  getTimeFormat(timeString) {
    let timeRegex = /(\d+)\s*([a-z]+)/gi;
    let timeUnits = { y: 8760, mo: 720, w: 168, d: 24, h: 1, m: 1 / 60, s: 1 / 3600 };
    let totalHours = 0;
    let match;
    while ((match = timeRegex.exec(timeString)) !== null) {
      let unit = match[2].toLowerCase();
      if (timeUnits.hasOwnProperty(unit)) totalHours += parseFloat(match[1]) * timeUnits[unit];
    }
    return parseFloat(totalHours.toFixed(3));
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

  // 拦截保存账号管理费比率
  adminRateGet(url, method, resp) {
    let realm = runtimeData.basisCPT.realm;
    let adminRate = parseFloat(resp) - 1;
    indexDBData.basisCPT.userInfo[realm].adminRate = adminRate;
    this.componentData.adminRate = adminRate;
  }

  // 拦截物品的零售数据
  getResourcesRetailInfo(url, method, resp) {
    let newResp = JSON.parse(resp);
    let resID = parseInt(url.match(/\d+\/$/)[0].replace("/", ""));
    this.componentData.retaiInfoList[resID] = newResp;
  }

  // 生成推荐定价的提前检测与获取
  async genRecommendPrice(resID = 0, quality = 0, quantity = 0, nowPrice = 0) {
    let timeStamp = new Date().getTime();
    if (timeStamp - this.componentData.lastCountTimeStamp < 2000) return this.lastPrice(resID);
    let realm = runtimeData.basisCPT.realm;
    let buildID = parseInt(location.href.match(/\d+\/$/)[0].replace("/", ""));
    let buildKind = tools.getBuildKind(buildID);
    let fileName = `${buildKind}-${realm == 0 ? "R1" : "R2"}.json`;
    let apiData = await this.innerGetNetData(fileName);
    if (!apiData && !this.componentData.apiDataList[buildKind]) return 0.0;
    if (!apiData) apiData = this.componentData.apiDataList[buildKind];
    this.componentData.apiDataList[buildKind] = apiData;
    let saturation = this.componentData.retaiInfoList[resID].marketSaturation;
    let retail_modeling = apiData.resources[resID.toString()].retail_modeling;
    let sellBonus = indexDBData.basisCPT.userInfo[realm].authCompany.salesModifier;
    let building_wages = Object.values(apiData.resources)[0].building_wages;
    let adminRate = this.componentData.adminRate;
    let cost = this.getCost(tools.itemIndex2Name(resID), quantity);
    let maxSellPrice = nowPrice * 0.5;
    let maxHourProfit = 0;
    for (let index = maxSellPrice; index < nowPrice * 1.5; index += 0.01) {
      let newHourProfit = this.countOutHourProfit(index, saturation, retail_modeling, quality, sellBonus, building_wages, adminRate, cost);
      if (newHourProfit - maxHourProfit <= 0) continue;
      maxSellPrice = index;
      maxHourProfit = newHourProfit;
    }

    // 价格格式化
    if (maxSellPrice <= 8) maxSellPrice = maxSellPrice.toFixed(2);
    if (maxSellPrice > 8 && maxSellPrice <= 500) maxSellPrice = maxSellPrice.toFixed(1);
    if (maxSellPrice > 500) maxSellPrice = maxSellPrice.toFixed(0);

    this.componentData.recommendList[resID] = maxSellPrice;
    this.componentData.lastCountTimeStamp = timeStamp;
    return maxSellPrice;
  }
  // 计算时利润
  countOutHourProfit(sellprice, saturation, retail_modeling, quality, sellBonus, building_wages, adminRate, courcCost) {
    let time2sellPerUnit = Math.pow(sellprice * retail_modeling.xMultiplier + (retail_modeling.xOffsetBase + (Math.max(-.38, saturation - .24 * quality) - .5) / retail_modeling.marketSaturationDiv), retail_modeling.power) * retail_modeling.yMultiplier + retail_modeling.yOffset;
    time2sellPerUnit = time2sellPerUnit.toFixed(2);
    let unitsSoldPerHour = 3600 / time2sellPerUnit / (1 - sellBonus / 100);
    unitsSoldPerHour = unitsSoldPerHour.toFixed(2);
    let revenuesPerHour = unitsSoldPerHour * sellprice;
    revenuesPerHour = revenuesPerHour.toFixed(2);
    let cost = courcCost * unitsSoldPerHour + building_wages + (building_wages * adminRate / 100);
    return revenuesPerHour - cost;
  }
  // 获取上一次计算的结果 或者 0.0
  lastPrice(resID) {
    return this.componentData.recommendList[resID] || 0.0;
  }
  innerGetNetData(fileName) {
    let nowTime = new Date().getTime();
    if (nowTime - this.componentData.lastNetTime <= 10000) return false;
    this.componentData.lastNetTime = nowTime;
    return tools.getNetData(`https://cdn.jsdelivr.net/gh/ShenHaiSu/SimComp-APIProxy@main/toolsData/least/${fileName}`);
  }
}
new retailDisplayProfit();
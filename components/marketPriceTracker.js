const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 交易行价格监控提示
class marketPriceTracker extends BaseComponent {
  constructor() {
    super();
    this.name = "交易行价格监控提示";
    this.describe = "交易行低价会有提示，不错过交易行的精彩价格。";
    this.enable = true;
    this.tagList = ['追踪','交易所'];
  };
  indexDBData = {
    max_net_time_gap: 120 * 1000, // 最大查询时间间隔
    min_net_time_gap: 60 * 1000, // 最小查询时间间隔
    trackTargetList: [], // 监控物品列表 [{id:123,quality:0,realm:0,target_price:0.159}]
    trackerHandleMode: 0, // 追踪器运行模式 0 快速判断模式 1 详细判断模式
  };
  componentData = {
    trackerIntervalList: [], // 价格追踪计时器列表
    settingTemplateNode: undefined, // 设置界面模板要素
  };
  cssText = [
    `#setting-container-7{overflow-y:auto;}#setting-container-7 button.script_mpTracker_delete{background-color:rgb(137,37,37);}#setting-container-7 button.script_mpTracker_delete:hover{color: var(--fontColor);}#setting-container-7 tr>td:nth-of-type(1){min-width:70px;}#setting-container-7 tr>td:nth-of-type(2){min-width:64px;}#setting-container-7 tr>td:nth-of-type(3){min-width:96px;}#setting-container-7 tr>td:nth-of-type(4){min-width:110px;}`,
    `#setting-container-7{overflow-y:auto;}#setting-container-7 button.script_mpTracker_delete{background-color:rgb(137,37,37);}#setting-container-7 button.script_mpTracker_delete:hover{color:var(--fontColor);}#setting-container-7 tr>td:nth-of-type(1){min-width:50px;}#setting-container-7 tr>td:nth-of-type(2){min-width:64px;}#setting-container-7 tr>td:nth-of-type(3){min-width:96px;}#setting-container-7 tr>td:nth-of-type(4){min-width:80px;}`
  ];
  startupFuncList = [
    this.mainFunc
  ];
  settingUI = () => {
    // 创建挂载标签
    let newNode = document.createElement("div");
    newNode.innerHTML = `<div class=header>交易所低价提示设置</div><div class=container><div><div><button class="btn script_opt_submit">保存并重启监控</button></div></div><div><table><thead><tr><td>功能<td>设置<tbody><tr><td title="默认值 0;快速判断模式性能更好;\n  快速判断模式仅显示当前符合要求的最低价\n  详细判断模式可以统计出符合要求价格的出售公司和总计销售量">判断模式<td><select class=form-control><option value=0>快速判断模式<option value=1>详细判断模式</select></table><table><thead><tr><td>ID<td>品质<td>服务器<td>价格<td>删除<tbody id=script_itemTargetNode></table></div></div>`;
    newNode.id = `setting-container-7`;
    newNode.className = "col-sm-12 setting-container";
    // 初始化模板对象以及获取挂载目标
    let templateTarget = newNode.querySelector("tbody#script_itemTargetNode");
    if (!this.componentData.settingTemplateNode) {
      this.componentData.settingTemplateNode = document.createElement("tr");
      this.componentData.settingTemplateNode.innerHTML = `<td><input class="form-control script_mpTracker_resid"type=number><td><select class="form-control script_mpTracker_quality"><option value=0>0<option value=1>1<option value=2>2<option value=3>3<option value=4>4<option value=5>5<option value=6>6<option value=7>7<option value=8>8<option value=9>9<option value=10>10<option value=11>11<option value=12>12</select><td><select class="form-control script_mpTracker_realm"><option value=0>R1 M服<option value=1>R2 E服</select><td><input class="form-control script_mpTracker_price"type=number><td><button class="btn script_mpTracker_delete">删除</button>`;
    }
    // 绑定事件分发
    newNode.addEventListener('click', event => this.settingRootClickHandle(event));
    // 绑定数据
    newNode.querySelector("td>select").value = this.indexDBData.trackerHandleMode;
    // 克隆并更新数据后挂载
    for (let i = 0; i < this.indexDBData.trackTargetList.length; i++) {
      let item = this.indexDBData.trackTargetList[i];
      let itemInfoNode = this.componentData.settingTemplateNode.cloneNode(true);
      itemInfoNode.querySelector("input.script_mpTracker_resid").value = item.id;
      itemInfoNode.querySelector("select.script_mpTracker_quality").value = item.quality;
      itemInfoNode.querySelector("select.script_mpTracker_realm").value = item.realm;
      itemInfoNode.querySelector("input.script_mpTracker_price").value = item.target_price;
      templateTarget.appendChild(itemInfoNode);
    }
    let addButtonTr = document.createElement("tr");
    addButtonTr.innerHTML = `<td colspan="5"><button class="col-sm-12 form-control" id="script_mpTracker_addT">添加</button></td>`;
    templateTarget.appendChild(addButtonTr);
    // 返回挂载标签
    return newNode;
  }
  // 设置界面点击事件分发
  settingRootClickHandle(event) {
    if (event.target.tagName != "BUTTON") return;
    if (event.target.className.match("script_opt_submit")) return this.settingSubmitHandle();
    if (event.target.className.match("script_mpTracker_delete")) return this.settingDeleteButtonHandle(event);
    if (event.target.id == "script_mpTracker_addT") return this.settingAddItem(event);
  }
  // 保存并重启监控
  async settingSubmitHandle() {
    // 获取数据
    let valueNodeList = Object.values(document.querySelectorAll("#setting-container-7 tbody>tr>td>input, #setting-container-7 tbody>tr>td>select")).map(node => node.value);
    // 审查并添加数据
    let otherSetting = valueNodeList.splice(0, 1); // 弹出前1位的元素
    let newArray = []; // [{id:123,quality:0,realm:0,target_price:0.159}]
    for (let i = 0; i < valueNodeList.length; i += 4) {
      // 格式化
      let resid = Math.floor(valueNodeList[i]);
      let quality = Math.floor(valueNodeList[i + 1]);
      let realm = Math.floor(valueNodeList[i + 2]);
      let price = parseFloat(valueNodeList[i + 3]);
      // 审查
      if (resid <= 0 || price <= 0) return tools.alert("id和价格不能小于等于0");
      if (tools.itemIndex2Name(resid) == undefined) return tools.alert("有存在无法找到物品名的id,请检查是否有id错误.");
      // 添加
      newArray.push({ id: resid, quality, realm, target_price: price });
    }
    this.indexDBData.trackTargetList = newArray;
    // 保存并重载
    this.indexDBData.trackerHandleMode = Math.floor(otherSetting[0]);
    await tools.indexDB_updateIndexDBData();
    this.mainFunc(undefined, "restart");
    tools.alert("以保存配置并发起功能重启。");
  }
  // 添加一个监控编辑框
  settingAddItem(event) {
    let newNode = this.componentData.settingTemplateNode.cloneNode(true);
    let targetParent = tools.getParentByIndex(event.target, 3);
    let beforeNode = tools.getParentByIndex(event.target, 2);
    targetParent.insertBefore(newNode, beforeNode);
  }
  // 删除当前监控编辑框
  settingDeleteButtonHandle(event) {
    tools.getParentByIndex(event.target, 2).remove();
  }
  mainFunc(window, mode = "start") {
    // mode = start clear restart
    if (!this.enable) return;
    if (mode == "clear") {
      return this.componentData.trackerIntervalList.map((item) => clearInterval(item));
    } else if (mode == "restart") {
      this.mainFunc(undefined, "clear");
      return this.mainFunc(undefined, "start");
    } else if (mode != "start") return;
    // 启动监控
    let itemMap = []; // {id:1, realm:0, price:[0.1,231,12,12,121,21,12]};
    this.indexDBData.trackTargetList.forEach((element) => {
      // {id:123, quality:0 ,realm:0, target_price:0.159}
      let itemI = itemMap.findIndex((item) => item.id == element.id && item.realm == element.realm);
      if (itemI == -1) {
        let priceList = new Array(13);
        priceList[element.quality] = element.target_price;
        itemMap.push({ id: element.id, realm: element.realm, price: priceList });
        return;
      } else {
        itemMap[itemI].price[element.quality] = element.target_price;
      }
    });

    itemMap.forEach((item) => {
      let tampTimeGap = Math.random() * (this.indexDBData.max_net_time_gap - this.indexDBData.min_net_time_gap);
      tampTimeGap += this.indexDBData.min_net_time_gap;
      tampTimeGap = Math.floor(tampTimeGap);
      this.componentData.trackerIntervalList.push(setInterval(() => this.intervalHandle(item), tampTimeGap));
      if (feature_config.debug) tools.msg_send("监控物价", `${tools.itemIndex2Name(item.id)} 间隔时间${tampTimeGap}ms`);
    });

    tools.log("价格追踪已开启");
    if (feature_config.debug) tools.msg_send("交易所低价监控", "价格追踪已开启");
  }

  // 函数处理分发
  modeHandlers = [
    (item) => this.fastModeRequestHandle(item), // 快速处理模式
    (item) => this.detailModeRequestHandle(item), // 详细处理模式
  ]
  intervalHandle = (item) => this.modeHandlers[this.indexDBData.trackerHandleMode](item)

  // 快速模式处理函数
  async fastModeRequestHandle(item) {
    tools.log(`请求交易所价格`, item, tools.itemIndex2Name(item.id));
    let netData = await tools.getNetData(`${tools.baseURL.market}/${item.realm}/${item.id}/#${await tools.generateUUID()}`);
    if (!netData) return;
    // itemMP: [1,1,1,1,1,1,1,1,1,1,1,1,1]
    let itemMP = tools.mpFormat(netData);
    indexDBData.basisCPT.resourcePool[item.realm][item.id] = itemMP;
    // 检查是否全都是0
    if (tools.arrayIsAllZero(itemMP)) return;
    // 检查通知
    item.price.forEach((price, index) => {
      if (!price || itemMP[index] > price) return;
      let msgBody = `服务器${item.realm == 0 ? "R1" : "R2"} ID:${item.id} 物品名:${tools.itemIndex2Name(item.id)} `;
      msgBody += `Q${index} 目标价格:${price} 当前价格:${itemMP[index].toFixed(3)}`;
      tools.msg_send("交易所低价监控", msgBody);
    });
  }

  // 详细判断模式
  async detailModeRequestHandle(item) {
    // item {id:1, realm:0, price:[0.1,231,12,12,121,21,12]}
    tools.log(`请求交易所价格`, item, tools.itemIndex2Name(item.id));
    // 更新缓存数据
    let netData = await tools.getNetData(`${tools.baseURL.market}/${item.realm}/${item.id}/?${await tools.generateUUID()}`);
    if (!netData) return;
    let itemMP = tools.mpFormat(netData);
    indexDBData.basisCPT.resourcePool[item.realm][item.id] = itemMP;
    if (tools.arrayIsAllZero(itemMP)) return;
    let result = []; // [ {price:123, amount:123, seller:[]} ]
    let tempMap = item.price.map((value, index) => { return { quality: index, price: value } });
    for (let i = 0; i < netData.length; i++) {
      let netItem = netData[i];
      let quality = netData[i].quality;
      tempMap.filter(value => Boolean(quality >= value.quality && netItem.price <= value.price))
        .map(value => {
          if (result[value.quality] == undefined) result[value.quality] = { price: itemMP[quality], amount: 0, seller: [] };
          result[value.quality].amount += netItem.quantity;
          result[value.quality].seller.push(netItem.seller.company);
          return undefined;
        })
    }
    for (let i = 0; i < result.length; i++) {
      if (result[i] == undefined) continue;
      let msgBody = item.realm == 0 ? "R1 " : "R2 ";
      msgBody += `${tools.itemIndex2Name(item.id)} Q${i} `;
      msgBody += `目标价: $${tools.numberAddCommas(item.price[i])}; 当前价: $${tools.numberAddCommas(result[i].price)}; `;
      msgBody += `货物量: ${tools.numberAddCommas(result[i].amount)}; `;
      let sellerMsg = `销售公司: ${result[i].seller.join(", ")}`;
      tools.msg_send("交易行监控", msgBody);
      tools.msg_send("交易行监控", sellerMsg, 1);
    }
  }
}
new marketPriceTracker();
const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 交易行价格监控提示
class marketPriceTracker extends BaseComponent {
  constructor() {
    super();
    this.name = "交易行价格监控提示";
    this.describe = "交易行低价会有提示，不错过交易行的精彩价格。";
    this.enable = true;
  };
  indexDBData = {
    max_net_time_gap: 120 * 1000, // 最大查询时间间隔
    min_net_time_gap: 60 * 1000, // 最小查询时间间隔
    trackTargetList: [], // 监控物品列表 [{id:123,quality:0,realm:0,target_price:0.159}]
  };
  componentData = {
    trackerIntervalList: [], // 价格追踪计时器列表
    settingTemplateNode: undefined, // 设置界面模板要素
  };
  cssText = [
    `#setting-container-7 input.script_mpTracker_resid{min-width:70px;}#setting-container-7 input.script_mpTracker_price{min-width:110px;}#setting-container-7 button.script_mpTracker_delete{background-color:rgb(137,37,37);}`
  ];
  startupFuncList = [
    this.mainFunc
  ];
  settingUI = () => {
    // 创建挂载标签
    let newNode = document.createElement("div");
    newNode.innerHTML = `<div class=header>交易所低价提示设置</div><div class=container><div><div><button class="btn script_opt_submit">保存并重启监控</button></div></div><div><table><thead><tr><td>ID<td>品质<td>服务器<td>价格<td>删除<tbody id=script_itemTargetNode></table><button class="col-sm-12 form-control"id=script_mpTracker_addT>添加</button></div></div>`;
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
    // 返回挂载标签
    return newNode;
  }
  // 设置界面点击事件分发
  settingRootClickHandle(event) {
    if (event.target.tagName != "BUTTON") return;
    if (event.target.className.match("script_opt_submit")) return this.settingSubmitHandle();
    if (event.target.className.match("script_mpTracker_delete")) return this.settingDeleteButtonHandle(event);
    if (event.target.id == "script_mpTracker_addT") return this.settingAddItem();
  }
  // 保存并重启监控
  async settingSubmitHandle() {
    // 获取数据
    let valueNodeList = Object.values(document.querySelectorAll("tbody#script_itemTargetNode>tr>td>input, tbody#script_itemTargetNode>tr>td>select"));
    // 审查并添加数据
    let newArray = []; // [{id:123,quality:0,realm:0,target_price:0.159}]
    for (let i = 0; i < valueNodeList.length; i += 4) {
      // 格式化
      let resid = Math.floor(valueNodeList[i].value);
      let quality = Math.floor(valueNodeList[i + 1].value);
      let realm = Math.floor(valueNodeList[i + 2].value);
      let price = parseFloat(valueNodeList[i + 3].value);
      // 审查
      if (resid <= 0 || price <= 0) return window.alert("id和价格不能小于等于0");
      if (tools.itemIndex2Name(resid) == undefined) return window.alert("有存在无法找到物品名的id,请检查是否有id错误.");
      // 添加
      newArray.push({ id: resid, quality, realm, target_price: price });
    }
    this.indexDBData.trackTargetList = newArray;
    // 保存并重载
    await tools.indexDB_updateIndexDBData();
    this.mainFunc(undefined, "restart");
    window.alert("以保存配置并发起功能重启。");
  }
  // 添加一个监控编辑框
  settingAddItem() {
    document.querySelector("tbody#script_itemTargetNode").appendChild(this.componentData.settingTemplateNode.cloneNode(true));
  }
  // 删除当前监控编辑框
  settingDeleteButtonHandle(event) {
    console.log(tools.getParentByIndex(event.target, 2));
    tools.getParentByIndex(event.target, 2).remove();
  }
  async showAllConf() {
    // 罗列
    let runtimeData = this.indexDBData.trackTargetList;
    if (runtimeData.length == 0) return window.alert("当前没有正在监控的任何物品。");
    let outputMsg = `当前已经监控了的资源有：`;
    runtimeData.forEach((item) => {
      // {id:123, quality:0 ,realm:0, target_price:0.159, now_price:123}
      outputMsg += `\n\tID:${item.id} 名称:${tools.itemIndex2Name(item.id) || "内容有误请删除"} `;
      outputMsg += `品质:${item.quality} 服务器:${item.realm == 0 ? "R1-M服" : "R2-E服"} 目标价格:${item.target_price}`;
    });
    window.alert(outputMsg);
  }
  async addData() {
    // 添加
    // {id:123, quality:0 ,realm:0, target_price:0.159, now_price:123}
    let valueList = [];
    let exist = false;
    document.querySelectorAll("#setting-container-7 td > input, #setting-container-7 td > select").forEach((item) => valueList.push(item.value));
    valueList = valueList.map((value, index) => (index <= 2 ? Math.floor(value) : value));
    tools.log(valueList);
    if (valueList[0] <= 0) return window.alert("资源id不能小于1");
    if (valueList[1] < 0 || valueList[1] > 12) return window.alert("资源品质不合法，只允许0-12整数");
    if (valueList[2] < 0 || valueList[2] > 1) return window.alert("服务器标号不能是0或者1以外的内容");
    if (valueList[3] <= 0) return window.alert("关注一个不可能达到的价格是不可行的");
    // if (runtime_data.market_price_tracker_list.length >= 10) return window.alert("不允许监听十个以上的物品，防止海量的请求");
    this.indexDBData.trackTargetList.forEach((item) => {
      if (item.id == valueList[0] && item.realm == valueList[2] && item.quality == valueList[1]) exist = true;
    });
    if (exist) return window.alert("该品质的物品在该服务器已经监控了，不要重复添加。");
    this.indexDBData.trackTargetList.push({
      id: valueList[0],
      quality: valueList[1],
      realm: valueList[2],
      target_price: valueList[3],
    });
    window.alert(`已将数据提交。请点击保存并重启按钮应用设置。`);
  }
  async deleteData() {
    // 删除
    let valueList = [];
    document.querySelectorAll("#setting-container-7 td > input, #setting-container-7 td > select").forEach((item) => valueList.push(item.value));
    valueList = valueList.map((value, index) => (index <= 2 ? Math.floor(value) : value));
    tools.log(valueList);
    if (valueList[0] <= 0) return window.alert("资源id不能小于1");
    if (valueList[1] < 0 || valueList[1] > 12) return window.alert("资源品质不合法，只允许0-12整数");
    if (valueList[2] < 0 || valueList[2] > 1) return window.alert("服务器标号不能是0或者1以外的内容");
    let itemIndex = this.indexDBData.trackTargetList.findIndex((item) => {
      return item.id == valueList[0] && item.quality == valueList[1] && item.realm == valueList[2];
    });
    if (itemIndex == -1) return window.alert("没有找到该监控对象");
    this.indexDBData.trackTargetList.splice(itemIndex, 1);
    window.alert("已经删除对该目标的监控，请点击保存并重启按钮应用设置。");
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
      tools.log(tampTimeGap);
      if (feature_config.debug) tools.msg_send("监控物价", `${tools.itemIndex2Name(item.id)}`);
    });

    tools.log("价格追踪已开启");
    if (feature_config.debug) tools.msg_send("交易所低价监控", "价格追踪已开启");
  }
  async intervalHandle(item) {
    tools.log(`请求交易所价格`, item);
    let netData = await tools.getNetData(`${tools.baseURL.market}/${item.realm}/${item.id}/#${await tools.generateUUID()}`);
    let msgTitle = "交易所低价监控";

    if (!netData) return;
    let itemMP = tools.mpFormat(netData);
    indexDBData.basisCPT.resourcePool[item.realm][item.id] = itemMP;
    item.price.forEach((price, index) => {
      if (!price || itemMP[index] > price) return;
      let msgBody = `服务器${item.realm == 0 ? "R1" : "R2"} ID:${item.id} 物品名:${tools.itemIndex2Name(item.id)} `;
      msgBody += `Q${index} 目标价格:${price} 当前价格:${itemMP[index].toFixed(3)}`;
      tools.msg_send(msgTitle, msgBody);
    });
  }
}
new marketPriceTracker();
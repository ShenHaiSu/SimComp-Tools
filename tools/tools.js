let componentList = {}; // 子组件列表
let runtimeData = {};
let indexDBData = {};
let feature_config = {
  debug: false, // debug模式
  version: 2, // 配置的版本，当前配置
  net_gap_ms: 10000, // 网络请求最小间隔 默认10s 10000ms
  notificationMode: [1, 0], // 通知模式，0 原生Notification对象 1 网页内信息 -1 是无
  fontColor: "#ffffff", // 插件通用文本颜色 默认#ffffff  ##FONTCOLOR##
  zoomRate: "100%", // 主界面缩放比例
  componentSwitchList: {}, // 组件开关列表
};
let langData = {}; // 中文语言包数据

// 工具类
class tools {
  static scriptLoadAcc = false; // 插件加载完毕标记
  static browserKind = ""; // 浏览器类型
  static netFetchPool = []; // 网络请求缓存池
  static eventCount = 0; // 事件触发计次
  static lastURL = ""; // 最近记录的URL
  static clientHorV = 0; // 窗口横纵 0 横 1 纵
  static dbOpenFlag = false; // 数据库的开启标志
  static dbObj = undefined; // 数据库操作对象
  static dbStoreName = "main"; // 数据库StoreName
  static uuid = undefined; // 用户uuid
  static publicCSS = ""; // 所有组件使用的css
  static msgBodyNode = undefined; // 网页内消息使用的元素
  static lastMutation = undefined; // 最近一次元素变动记录
  static windowMask = undefined; // 网页遮罩页面
  static msgShowFlag = {  // SCT底色改变
    timer: undefined,
    flag: false,
  };

  static baseURL = {
    // 用户基础信息 GET
    userBase: "https://www.simcompanies.com/api/v2/companies/me/",
    // 建筑信息 GET
    building: "https://www.simcompanies.com/api/v2/companies/me/buildings/",
    // 仓库数据 GET
    warehouse: "https://www.simcompanies.com/api/v2/resources/",
    // 交易所 /realm/resid
    market: "https://www.simcompanies.com/api/v3/market/all",
    // 高管信息
    executives: "https://www.simcompanies.com/api/v2/companies/me/executives/"
  }
  static log() {
    if (!feature_config.debug) return;
    console.log.call(this, ...arguments);
  }
  static errorLog() {
    if (!feature_config.debug) return;
    console.error.call(this, ...arguments);
  }
  static getParentByIndex(node, index) {
    return index ? this.getParentByIndex(node.parentElement, --index) : node;
  }
  static async dely(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  static formatFeatureConfigComponentList() {
    Object.values(componentList).forEach(item => feature_config.componentSwitchList[item.constructor.name] = item.enable);
  }
  static CSSMount(mode = "add", cssText = "") {
    if (mode == "add") {
      this.publicCSS += cssText.replaceAll("}", "}\n");
    } else if (mode == "mount") {
      this.CSSMount("clearRepeat");
      // ##FONTCOLOR##
      tools.log(this.publicCSS);
      this.publicCSS = this.publicCSS.replaceAll("##FONTCOLOR##", feature_config.fontColor + ";");
      let styleElement = document.createElement("style");
      styleElement.setAttribute("type", "text/css");
      styleElement.textContent = this.publicCSS;
      document.head.appendChild(styleElement);
    } else if (mode == "clearRepeat") {
      let CSSList = this.publicCSS.split("\n");
      let newCSSTextList = [];
      for (let i = 0; i < CSSList.length; i++) {
        if (newCSSTextList.findIndex(j => CSSList[i] == j) != -1) continue;
        newCSSTextList.push(CSSList[i]);
      }
      this.publicCSS = newCSSTextList.join("\n");
    }
  }
  static checkWindowHorV() {
    // 0 横屏 1 竖屏  
    this.log(`height:`, window.innerHeight);
    this.log(`width:`, window.innerWidth);
    this.clientHorV = window.innerHeight > window.innerWidth ? 1 : 0;
  }
  static checkBrowser() {
    let userAgent = navigator.userAgent;
    // 判断是否为 Chrome 浏览器
    if (userAgent.includes('Chrome')) return this.browserKind = "Chrome";
    // 判断是否为 Firefox 浏览器
    if (userAgent.includes('Firefox')) return this.browserKind = "Firefox";
    // 判断是否为 Safari 浏览器
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return this.browserKind = "Safari";
    // 判断是否为 Edge 浏览器
    if (userAgent.includes('Edge')) return this.browserKind = "Edge";
    // 判断是否为 IE 浏览器
    if (userAgent.includes('Trident') || userAgent.includes('MSIE')) return this.browserKind = "IE";
    return this.browserKind = "Unknown";
  }
  static mpFormat(mpData = []) {
    let result = [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity];
    for (let i = 0; i < mpData.length; i++) {
      if (result[mpData[i].quality] != Infinity) continue;
      result[mpData[i].quality] = mpData[i].price;
    }
    for (let i = 0; i < result.length; i++) {
      result[i] = Math.min(result[i], ...result.slice(i + 1));
    }
    result = result.map(item => item == Infinity ? 0 : item);
    return result;
  }
  static zoomRateApply() {
    if (this.browserKind != "Firefox") return document.body.style.zoom = feature_config.zoomRate;
    // document.body.style.setProperty("-moz-transform", `scale(${feature_config.zoomRate})`);
  }
  static hexArgbCheck(input) {
    if (input == "" || input == undefined) return false;
    return /^#[0-9a-fA-F]{6}$/.test(input) || /^rgba?\((\s*\d+\s*,){2}\s*\d+(\.\d+)?(\s*,\s*\d+(\.\d+)?)?\s*\)$/.test(input);
  }
  static setInput(inputNode, value) {
    let lastValue = inputNode.value;
    inputNode.value = value;
    let event = new Event("input", { bubbles: true });
    event.simulated = true; // hack React15
    if (inputNode._valueTracker) inputNode._valueTracker.setValue(lastValue); // hack React16 内部定义了descriptor拦截value，此处重置状态
    inputNode.dispatchEvent(event);
  }
  static createWindowMask() {
    if (Boolean(tools.windowMask)) return;
    // 构建css标签
    let styleElement = document.createElement("style");
    let windowMaskNode = document.createElement("div");
    styleElement.setAttribute("type", "text/css");
    styleElement.textContent = `div#script_tools_windowMask{height:100%;width:100%;position:absolute;top:0;left:0;z-index:5000;background-color:rgb(0,0,0,0.5);}div#script_tools_windowMask>div>svg{width:30%;height:30%;display:block;position:absolute;top:35%;left:50%;transform:translateX(-50%) translateY(-50%);}div#script_tools_windowMask>div:nth-of-type(2){color:var(--fontColor);align-items:center;text-align:center;display:block;width:fit-content;height:fit-content;transform:translateX(-50%) translateY(-50%);position:absolute;top:65%;left:50%;}div#script_tools_windowMask>div:nth-of-type(2)>div{padding:20px;font-size:30px;width:fit-content;height:fit-content;border:solid 5px black;border-radius:10px;box-shadow:0 0 10px 10px white;background-color:rgb(0,0,0,0.5);}div#script_tools_windowMask>div:nth-of-type(2)>button{background-color:rgb(0,0,0,0.8);margin-top:20px;width:160px;height:40px;}`;
    windowMaskNode.id = "script_tools_windowMask";
    windowMaskNode.innerHTML = `<div><svg viewBox="0 0 24 24" xmlns=http://www.w3.org/2000/svg><path d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z"fill=currentColor opacity=.5></path><path d="M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z"fill=currentColor><animateTransform attributeName=transform dur=1s from="0 12 12"repeatCount=indefinite to="360 12 12"type=rotate></animateTransform></path></svg></div><div><div><span>操作进行中</span></div><button class=btn>取消操作</button></div>`;
    windowMaskNode.querySelector("button").addEventListener('click', () => window.confirm("确定终止操作并刷新网页吗?") ? location.reload() : null);
    Object.assign(windowMaskNode.style, { display: "none" });
    tools.windowMask = windowMaskNode;
    // 挂载标签
    document.head.appendChild(styleElement);
    document.body.appendChild(windowMaskNode);
  }
  static setWindowMask(flag = false) {
    if (typeof flag !== "boolean") return;
    if (!tools.windowMask) tools.createWindowMask();
    Object.assign(tools.windowMask.style, { display: flag ? "block" : "none" });
  }
  static async getRealm() {
    let realm = runtimeData.basisCPT.realm;
    while (realm == undefined) {
      await tools.dely(1000);
      realm = runtimeData.basisCPT.realm;
    }
    return realm;
  }
  static getRandomNumber(min = 0, max = 1, parseFunc = parseFloat) {
    return parseFunc(Math.random() * (max - min)) + min;
  }
  static checkAllZero(arrayInput) {
    for (let i = 0; i < arrayInput.length; i++) {
      if (arrayInput[i] != 0.0) return false;
    }
    return true;
  }
  static itemName2Index(name) {
    for (const key in langData) {
      if (!Object.hasOwnProperty.call(langData, key)) continue;
      if (!/^be-re-/.test(key)) continue;
      if (langData[key] != name) continue;
      let result = Math.floor(key.replace("be-re-", ""));
      return result;
    }
    return undefined;
  }
  static itemIndex2Name(index) {
    return langData["be-re-" + index];
  }
  static async getMarketPrice(resid, quality, realm) {
    let netData = await tools.getNetData(`${tools.baseURL.market}/${realm}/${resid}/`);
    let resultList;
    if (!netData) {
      if (!indexDBData.basisCPT.resourcePool[realm][resid]) return 0;
      resultList = indexDBData.basisCPT.resourcePool[realm][resid];
    } else {
      resultList = tools.mpFormat(netData);
      indexDBData.basisCPT.resourcePool[realm][resid] = resultList;
    }
    if (resultList[quality] == 0) {
      for (let i = quality; i <= 12; i++) {
        if (resultList[i] == 0) continue;
        return resultList[i];
      }
    }
    return resultList[quality];
  }
  static async netRequest(target, method = "GET", body = undefined, header = []) {
    let fetch_name = method + target;
    tools.log(fetch_name);
    let time_stamp = new Date().getTime();
    let gap_index = this.netFetchPool.findIndex((item) => item.url == fetch_name);
    if (gap_index == -1) {
      this.netFetchPool.push({ url: fetch_name, time: time_stamp });
    } else if (time_stamp - this.netFetchPool[gap_index].time >= feature_config.net_gap_ms) {
      this.netFetchPool[gap_index].time = time_stamp;
    } else return false;

    if (method == "GET") {
      return await fetch(target);
    } else {
      return await fetch(target, { method, body, headers: header });
    }
  }
  static async getNetData(target, method = "GET", body = undefined, header = []) {
    let netResp = await this.netRequest(target, method, body, header);
    if (!netResp) return false;
    return await netResp.json();
  }
  static async getNetText(target, method = "GET", body = undefined) {
    let netResp = await this.netRequest(target, method, body, header);
    if (!netResp) return false;
    return await netResp.text();
  }
  static async generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  static convert12To24Hr(timeString) {
    try {
      let [time, period] = timeString.split(" ");
      let [hours, minutes] = time.split(":");
      hours = (parseInt(hours, 10) % 12) + (period.toLowerCase() === "pm" ? 12 : 0);
      return `${hours.toString().padStart(2, "0")}:${minutes}`;
    } catch {
      return false;
    }
  }
  static async indexDB_openDB() {
    return new Promise((resolve, reject) => {
      let request = window.indexedDB.open("SimCompsScriptDB1", 1);
      request.onupgradeneeded = (event) => {
        indexedDB.dbObj = event.target.result;
        if (!indexedDB.dbObj.objectStoreNames.contains(this.dbStoreName)) {
          indexedDB.storeObj = indexedDB.dbObj.createObjectStore(this.dbStoreName, { keyPath: "id" });
        }
      }
      request.onerror = () => reject("数据库的打开失败");
      request.onsuccess = (event) => {
        this.dbObj = event.target.result;
        this.dbOpenFlag = true;
        resolve("数据库连接完毕");
      }
    })
  }
  static async indexDB_addData(data, id) {
    return new Promise((resolve, reject) => {
      if (!this.dbOpenFlag) return reject("数据库未打开");
      if (!data.id && !id) return reject("缺少主键");
      if (id) data = { id, ...data };
      let request = this.dbObj
        .transaction(this.dbStoreName, "readwrite")
        .objectStore(this.dbStoreName)
        .add(data);
      request.onsuccess = () => resolve("数据添加成功");
      request.onerror = () => reject("数据添加失败");
    })
  }
  static async indexDB_deleteData(id) {
    return new Promise((resolve, reject) => {
      if (!this.dbOpenFlag) reject("数据库未打开");
      if (!id) reject("缺少id主键");
      let request = this.dbObj
        .transaction(this.dbStoreName, "readwrite")
        .objectStore(this.dbStoreName)
        .delete(id);
      request.onsuccess = () => resolve("数据删除成功");
      request.onerror = () => reject("数据删除失败");
    });
  }
  static getBuildKind(id = 0) {
    if (id == 0) return undefined;
    let realm = runtimeData.basisCPT.realm;
    if (indexDBData.basisCPT.building[realm].length == 0) return undefined;
    let building = indexDBData.basisCPT.building[realm].find(building => building.id == id);
    return building == undefined ? undefined : building.kind;
    // for (let i = 0; i < indexDBData.basisCPT.building[realm].length; i++) {
    //   let build = indexDBData.basisCPT.building[realm][i];
    //   if (build.id != id) continue;
    //   return build.kind;
    // }
    // return undefined;
  }
  static numberAddCommas(input = 0) {
    let str = parseInt(input).toString();
    let result = '';
    let count = 0;
    for (let i = str.length - 1; i >= 0; i--) {
      result = str[i] + result;
      count++;
      if (count % 3 === 0 && i !== 0) {
        result = ',' + result;
      }
    }
    return result.replace("-,", "-");
  }
  /**
   * 更新/创建数据
   * @param {Object} data 数据
   * @param {String} id 主键名
   * @returns 
   */
  static async indexDB_updateData(data, id) {
    return new Promise((resolve, reject) => {
      if (!this.dbOpenFlag) return reject("数据库未打开");
      if (!data.id && !id) return reject("缺少主键");
      if (id) data = { id, ...data };
      let request = this.dbObj
        .transaction(this.dbStoreName, "readwrite")
        .objectStore(this.dbStoreName)
        .put(data);
      request.onsuccess = () => resolve("数据添加成功");
      request.onerror = () => reject("数据添加失败");
    })
  }
  /**
   * 通过主键名获取数据库数据
   * @param {String} id 数据库主键名
   * @returns {Object | null} 数据库数据或者null
   */
  static async indexDB_getData(id) {
    return new Promise((resolve, reject) => {
      if (!this.dbOpenFlag) reject("数据库未打开");
      if (!id) reject("缺少id主键");
      let request = this.dbObj
        .transaction(this.dbStoreName, "readonly")
        .objectStore(this.dbStoreName)
        .get(id);
      request.onsuccess = () => resolve(Boolean(request.result) ? request.result : null);
      request.onerror = () => reject("数据查询失败");
    });
  }
  /**
   * 更新/创建脚本内存uuid
   * @returns 
   */
  static async indexDB_updateUUID() {
    let dbData = await this.indexDB_getData("uuid");
    if (dbData) return this.uuid = dbData.uuid;
    this.uuid = await this.generateUUID();
    await this.indexDB_updateData({ id: "uuid", uuid: this.uuid });
  }
  /**
   * 加载数据库的插件通用基础配置
   * @returns 
   */
  static async indexDB_loadFeatureConf() {
    let dbData = await this.indexDB_getData("feature_conf");
    if (!dbData) return this.indexDB_addData(feature_config, "feature_conf");
    let dbComponentSwitchList = dbData.componentSwitchList;
    delete dbData.id;
    delete dbData.componentSwitchList;
    // 字面量赋值
    for (const key in feature_config) {
      if (!Object.hasOwnProperty.call(feature_config, key) || dbData[key] == undefined) continue; // 跳过
      if (typeof feature_config[key] !== "object") {
        // 字面量赋值
        feature_config[key] = dbData[key];
      } else if (Array.isArray(feature_config[key])) {
        // 数组赋值
        feature_config[key] = feature_config[key].map((value, index) => dbData[key][index] == undefined ? value : dbData[key][index]);
      } else {
        // 对象赋值
        for (const key2 in feature_config[key]) {
          if (!Object.hasOwnProperty.call(feature_config[key], key)) continue;
          if (dbData[key] == undefined || dbData[key][key2] == undefined) continue;
          feature_config[key][key2].enable = Boolean(dbData[key][key2]);
        }
      }
    }
    // feature_config = { ...feature_config, ...dbData };
    // // 功能开关赋值
    for (const key in dbComponentSwitchList) {
      if (!Object.hasOwnProperty.call(dbComponentSwitchList, key) || !componentList[key]) continue;
      componentList[key].enable = Boolean(dbComponentSwitchList[key]);
    }
    tools.log(feature_config);
    tools.indexDB_updateFeatureConf();
  }
  /**
   * 加载数据库的插件子组件数据
   * @returns 
   */
  static async indexDB_loadIndexDBData() {
    let dbData = await this.indexDB_getData("indexDBData");
    if (!dbData) return this.indexDB_addData(indexDBData, "indexDBData");
    delete dbData.id;
    for (const key in dbData) {
      if (!Object.hasOwnProperty.call(dbData, key) || !componentList[key]) continue;
      for (const key2 in dbData[key]) {
        if (!Object.hasOwnProperty.call(dbData[key], key2)) continue;
        componentList[key].indexDBData[key2] = dbData[key][key2];
      }
    }
  }
  /**
   * 更新/创建数据库组件通用基础配置
   * @returns 
   */
  static async indexDB_updateFeatureConf() {
    this.formatFeatureConfigComponentList();
    return await tools.indexDB_updateData(feature_config, "feature_conf");
  }
  /**
   * 更新/创建数据库子组件私有数据
   * @returns 
   */
  static async indexDB_updateIndexDBData() {
    return await tools.indexDB_updateData(indexDBData, "indexDBData");
  }
  /**
   * 更新/创建启动计数
   * @returns 
   */
  static async indexDB_updateLoadCount() {
    let dbData = await this.indexDB_getData("loadCount");
    if (!dbData) return this.indexDB_addData({ id: "loadCount", count: 1 });
    this.indexDB_updateData({ id: "loadCount", count: ++dbData.count });
  }
  /**
   * 删除所有的数据库缓存
   */
  static async indexDB_deleteAllData() {
    let dataNameList = ["feature_conf", "indexDBData", "uuid", "loadCount", "langData"];
    dataNameList.forEach(async item => await this.indexDB_deleteData("feature_conf"));
  }
  /**
   * 加载IndexedDB中的语言包文件
   */
  static async indexDB_loadLangData() {
    let dbData = await this.indexDB_getData("langData");
    if (!dbData) return;
    delete dbData.id
    langData = dbData;
  }
  /**
   * 更新/创建语言包数据
   * @param {Object} langData 语言包数据
   */
  static async indexDB_updateLangData(langData) {
    if (langData.id != "langData") langData.id = "langData";
    await this.indexDB_updateData(langData);
  }
  static async msg_check(payload, update = false) {
    // 原生对象检测
    if (feature_config.notificationMode.includes(0)) {
      if (!window.Notification || Notification.permission == "denied" || (!!payload && payload === "denied")) {
        if (update) window.alert(`浏览器通知接口获取失败，可能是以下原因：\n  1.浏览器不支持\n  2.权限未同意`);
      } else if (Notification.permission == "granted" || payload == "granted") {
        tools.log("Notification对象权限已授权");
      } else if (Notification.permission == "default") {
        return await tools.msg_check(await Notification.requestPermission(), true);
      }
    }
    // 网页内对象检测
    if (feature_config.notificationMode.includes(1) && this.msgBodyNode == undefined) {
      tools.log("网页内消息插件未检测到容器元素,无法正常执行.");
    }
  }
  /**
   * @param {String} title 信息标题
   * @param {string|Node} body 信息内容,可以是文字或者html节点
   * @param {number} channel 通知通道 0原生 1网页内
   */
  static msg_send(title, body = "", channel = undefined) {
    // 通知模式，0 原生Notification对象 1 网页内信息 -1 是无
    let actimeChannel = [];
    if (channel == undefined) {
      actimeChannel = feature_config.notificationMode;
    } else if (feature_config.notificationMode.includes(channel)) {
      actimeChannel.push(channel);
    }

    // 判断是否有通道0
    if (actimeChannel.includes(0)) new Notification(title, { body });
    // 判断是否有通道1
    if (actimeChannel.includes(1)) {
      let newNode = document.createElement("tr");
      let time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      if (body.tagName == undefined) {
        newNode.innerHTML = `<td>${time}</td><td>${title}\n${body}</td>`;
      } else {
        newNode.innerHTML = `<td>${time}</td><td>${title}\n</td>`;
        newNode.querySelector("td:nth-of-type(2)").appendChild(body);
      }
      this.msgBodyNode.appendChild(newNode);
      // 底色改变通知
      if (this.msgShowFlag.timer) clearInterval(this.msgShowFlag.timer);
      this.msgShowFlag.timer = setInterval(() => {
        Object.assign(document.querySelector("div#script_hover_node>div>span").style, { backgroundColor: this.msgShowFlag.flag ? "rgb(0,0,0,0)" : "#792c2c" });
        this.msgShowFlag.flag = !this.msgShowFlag.flag;
      }, 10 * 1000);
    }

  }
  static msg_clear() {

  }
  static eventBus(event) {
    if (!this.scriptLoadAcc) return;
    if (event) this.eventCount++;
    for (const key in componentList) {
      if (!Object.hasOwnProperty.call(componentList, key)) continue;
      let component = componentList[key];
      // 检测组件是否被启动
      if (!component.enable && component.canDisable) continue;

      // 常规函数事件分发
      for (let j = 0; j < component.commonFuncList.length; j++) {
        let funcObj = component.commonFuncList[j];
        try {
          if (!funcObj.match.call(component, event)) continue;
          setTimeout(function () {
            try { funcObj.func.call(component, event) } catch (error) { tools.errorLog(error) }
          }, 1);
        } catch (error) {
          tools.errorLog(error);
          continue;
        }
      }

      // 防抖函数事件分发
      for (let j = 0; j < component.debounceFuncList.length; j++) {
        let funcObj = component.debounceFuncList[j];
        try {
          if (this.eventCount % funcObj.bounce != 0) continue;
          setTimeout(function () {
            try { funcObj.func.call(component, event) } catch (error) { tools.errorLog(error) }
          }, 1);
        } catch (error) {
          tools.errorLog(error);
          continue;
        }
      }

    }
  }
  static intervalEventBus() {
    if (location.href == this.lastURL) return;
    this.lastURL = location.href;
    this.eventBus(undefined);
  }
  static netEventBus(url, method, resp) {
    tools.log(method, url);
    for (const key in componentList) {
      if (!Object.hasOwnProperty.call(componentList, key) || componentList[key].netFuncList.length == 0) continue;
      if (!componentList[key].enable && componentList[key].canDisable) continue;
      let component = componentList[key];
      let netFuncList = component.netFuncList;
      for (let i = 0; i < netFuncList.length; i++) {
        if (!netFuncList[i].urlMatch(url)) continue;
        try {
          netFuncList[i].func.call(component, url, method, resp);
        } catch (error) {
          tools.errorLog(error);
        }
      }
    }
  }
  static mutationHandle(mutation) {
    try {
      if (mutation[0].target.className.match("chat-notifications")) return;
      if (mutation.length == 2 && mutation[0].target == mutation[1].target) return;
      if (tools.getParentByIndex(mutation[0].target, 5).tagName == "TBODY") return;
      if (
        this.lastMutation != undefined &&
        mutation[0].type == "childList" &&
        mutation[0].type == this.lastMutation.type &&
        mutation[0].target == this.lastMutation.target &&
        mutation[0].addedNodes && this.lastMutation.addedNodes &&
        mutation[0].addedNodes[0].data == this.lastMutation.addedNodes[0].data
      ) return;
      this.log("检测到DOM变动,Mutation: ", mutation[0]);
      this.lastMutation = mutation[0];
      this.eventBus(undefined);
    } catch (error) {
      tools.log(mutation);
      tools.errorLog(error);
      this.eventBus(undefined);
    }
  }
}

module.exports = { tools, componentList, runtimeData, indexDBData, feature_config, langData }
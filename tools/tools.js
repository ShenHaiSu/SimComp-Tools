// 库引入
const md5 = require("md5");

// 全局变量
let componentList = {}; // 子组件列表 {name:{cpt}}
let runtimeData = {};
let indexDBData = {};
let feature_config = {
  debug: false, // debug模式
  version: 2, // 配置的版本，当前配置
  net_gap_ms: 60000, // 网络请求最小间隔 默认60s 60000ms
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
  static dbOpenTime = 0; // 数据库打开时间戳
  static uuid = undefined; // 用户uuid
  static msgBodyNode = undefined; // 网页内消息使用的元素
  static lastMutation = undefined; // 最近一次元素变动记录
  static lastMutationTime = 0; // 最近一次元素变动的时间
  static windowMask = undefined; // 网页遮罩页面
  static msgShowFlag = { timer: undefined, flag: false }; // SCT底色改变
  static mutationUrlTemp = ""; // Mutation监控使用的url缓存
  static dialogNode = undefined; // 消息显示对象
  static dialogMain = undefined; // 消息挂载对象
  static userArea = undefined; // 用户IP所在地 用来判断使用哪个API地址的
  static confirmNode = {
    mainNode: undefined, // 主节点
    msgNode: undefined, // 信息挂载节点
    resolveFunc: null, // 存储间接函数
  };
  static noSaveClose = false; // 不保存数据进行关闭

  static baseURL = {
    // 用户基础信息 GET
    userBase: "https://www.simcompanies.com/api/v2/players/me/companies/",
    // AuthData信息 Get
    authData: "https://www.simcompanies.com/api/v3/companies/auth-data/",
    // 建筑信息 GET
    building: "https://www.simcompanies.com/api/v2/companies/me/buildings/",
    // 仓库数据 GET
    warehouse: "https://www.simcompanies.com/api/v3/resources/", // 后面需要拼接userid/
    // 交易所 /realm/resid
    market: "https://www.simcompanies.com/api/v3/market/all",
    // 高管信息
    executives: "https://www.simcompanies.com/api/v2/companies/me/executives/",
  };
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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  static formatFeatureConfigComponentList() {
    Object.values(componentList).forEach((item) => (feature_config.componentSwitchList[item.constructor.name] = item.enable));
  }
  static CSSMount(cptName = "", cssText = "") {
    let newNode = document.createElement("style");
    newNode.setAttribute("type", "text/css");
    newNode.setAttribute("sct_id", cptName);
    newNode.setAttribute("sct_length", cssText.length);
    newNode.textContent = cssText;
    document.head.appendChild(newNode);
  }
  static addCSSNode(node, eleID) {
    if (!eleID && !node.getAttribute("sct_id")) return false;
    let nodeName = eleID || node.getAttribute("sct_id");
    if (eleID) node.setAttribute("sct_id", eleID);
    if (document.querySelector(`style[sct_id="${nodeName}"]`)) return false;
    document.head.appendChild(node);
    return true;
  }
  static checkWindowHorV() {
    // 0 横屏 1 竖屏
    this.log(`height:`, window.innerHeight);
    this.log(`width:`, window.innerWidth);
    this.clientHorV = window.innerHeight > window.innerWidth ? 1 : 0;
  }
  static checkBrowser() {
    let userAgent = navigator.userAgent;
    // 判断是Electron
    if (userAgent.includes("Electron")) return (this.browserKind = "Electron");
    // 判断是否为 Chrome 浏览器
    if (userAgent.includes("Chrome")) return (this.browserKind = "Chrome");
    // 判断是否为 Firefox 浏览器
    if (userAgent.includes("Firefox")) return (this.browserKind = "Firefox");
    // 判断是否为 Safari 浏览器
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return (this.browserKind = "Safari");
    // 判断是否为 Edge 浏览器
    if (userAgent.includes("Edge")) return (this.browserKind = "Edge");
    // 判断是否为 IE 浏览器
    if (userAgent.includes("Trident") || userAgent.includes("MSIE")) return (this.browserKind = "IE");
    return (this.browserKind = "Unknown");
  }
  /**
   * 获取运行时的IP国别，以此来确定访问缓存服务器使用的地址
   */
  static checkIPArea() {}
  /**
   * 生成与自建服务器通信使用的token
   */
  static genToken(t = "", e = 30) {
    const n = t + Math.floor(Date.now() / (60 * 60 * 1e3)).toString();
    let o = 0;
    for (let t = 0; t < n.length; t++) {
      (o = (o << 5) - o + n.charCodeAt(t)), (o &= o);
    }
    let l = Math.abs(o).toString(36);
    if (l.length < e) {
      l += this.genToken(l + t, e - l.length);
    }
    return l.slice(0, e);
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
    result = result.map((item) => (item == Infinity ? 0 : item));
    return result;
  }

  static zoomRateApply() {
    if (this.browserKind !== "Firefox") {
      //非Firefox浏览器使用 zoom
      document.body.style.zoom = feature_config.zoomRate;
    } else {
      // Firefox 浏览器使用 transform
      let scaleRatio = parseFloat(feature_config.zoomRate) / 100; // 将百分比转换为浮点数
      let viewportWidth = window.innerWidth;
      let viewportHeight = window.innerHeight;

      document.body.style.transform = `scale(${scaleRatio})`;
      document.body.style.transformOrigin = "0 0";

      // 调整页面宽度和高度，使其在缩放后铺满屏幕
      document.body.style.width = `${viewportWidth / scaleRatio}px`;
      document.body.style.height = `${viewportHeight / scaleRatio}px`;

      // 移除可能导致滚动的样式
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";

      // 监听窗口尺寸变化，自动调整缩放
      window.addEventListener("resize", function () {
        document.body.style.width = `${window.innerWidth / scaleRatio}px`;
        document.body.style.height = `${window.innerHeight / scaleRatio}px`;
      });
    }
  }

  static hexArgbCheck(input) {
    if (input == "" || input == undefined) return false;
    return /^#[0-9a-fA-F]{6}$/.test(input) || /^rgba?\((\s*\d+\s*,){2}\s*\d+(\.\d+)?(\s*,\s*\d+(\.\d+)?)?\s*\)$/.test(input);
  }
  static setInput(inputNode, value, count = 3) {
    let lastValue = inputNode.value;
    inputNode.value = value;
    let event = new Event("input", { bubbles: true });
    event.simulated = true; // hack React15
    if (inputNode._valueTracker) inputNode._valueTracker.setValue(lastValue); // hack React16 内部定义了descriptor拦截value，此处重置状态
    inputNode.dispatchEvent(event);
    if (count >= 0) return this.setInput(inputNode, value, --count);
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
    windowMaskNode.querySelector("button").addEventListener("click", () => (window.confirm("确定终止操作并刷新网页吗?") ? location.reload() : null));
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
      await tools.dely(500);
      realm = runtimeData.basisCPT.realm;
    }
    return realm;
  }
  static getRandomNumber(min = 0, max = 1, parseFunc = parseFloat) {
    return parseFunc(Math.random() * (max - min)) + min;
  }
  static arrayIsAllZero(arrayInput) {
    return arrayInput.filter((value) => value != 0 || value != 0.0).length == 0;
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
    if (netData.message && netData.message.startsWith("Ratelimited")) netData = false;
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
  static arrayCompareByProp(arr, property) {
    if (arr.length === 0 || arr.length === 1) return true; // 空数组默认为完全相同
    const firstValue = arr[0][property];
    return arr.every((item) => item[property] === firstValue);
  }
  static arrayCompareByFunc(arr, compareFn) {
    if (arr.length === 0 || arr.length === 1) return true; // 空数组默认为完全相同
    const firstValue = compareFn(arr[0]);
    return arr.every((item) => compareFn(item) === firstValue);
  }
  static async generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  static regStringCheck(input = "") {
    try {
      if (input == "" || typeof input !== "string") return false;
      if (!input.startsWith("/") || !/\/[img]*$/.test(input)) return false;
      return new RegExp(input.replace(/^\//, "").replace(/\/[img]*$/, ""), input.match(/\/([img])*$/)[1]);
    } catch (e) {
      tools.errorLog(e);
      return false;
    }
  }
  static convertPropertiesToRegex(input) {
    for (let key in input) {
      if (!input.hasOwnProperty(key)) continue;
      if (typeof input[key] === "object" && input[key] !== null) {
        this.convertPropertiesToRegex(input[key]); // 递归遍历子对象
      } else if (typeof input[key] === "string" && this.regStringCheck(input[key])) {
        try {
          input[key] = this.regStringCheck(input[key]); // 将属性值转换为正则表达式
        } catch (error) {
          // 属性值不符合正则表达式语法，忽略错误或者进行其他处理
          console.error(error);
        }
      }
    }
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
  static getBuildKind(id = 0) {
    if (id == 0) return undefined;
    let realm = runtimeData.basisCPT.realm;
    if (indexDBData.basisCPT.building[realm].length == 0) return undefined;
    let building = indexDBData.basisCPT.building[realm].find((building) => building.id == id);
    return building == undefined ? undefined : building.kind;
  }
  static numberAddCommas(number = 0) {
    let parts = number.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
  static downloadTextFile(filename, text) {
    let blob = new Blob([text], { type: "text/plain" });
    let url = URL.createObjectURL(blob);
    let downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  }
  static deepCloneObj(input) {
    if (input === null) return input;
    if (input === Infinity) return `Infinity`;
    if (input instanceof RegExp) return `/${input.source}/${input.flags}`;
    if (typeof input !== "object") return input;
    let clone = Array.isArray(input) ? [] : {};
    for (let key in input) {
      if (!input.hasOwnProperty(key)) continue;
      clone[key] = this.deepCloneObj(input[key]);
    }
    return clone;
  }
  /**
   * 生成MD5值
   * @param {String} str 字符串入参
   * @returns {String} 转换后的字符串
   */
  static md5 = (str) => md5(str);
  /**
   * 生成X-Prot请求头参数
   * @param {String} url 请求路径字符串
   * @returns `Prot` 请求头参数 字符串
   */
  static getProtHeader = (url = "") => {
    if (url.length == 0) return "";
    const timeStamp = new Date().getTime();
    const apiUrl = url.replace("http://", "").replace("www.simcompanies.com", "");
    return {
      url: apiUrl,
      timestamp: timeStamp,
      prot: md5(apiUrl + timeStamp),
    };
  };
  static async indexDB_openDB() {
    return new Promise((resolve, reject) => {
      let request = window.indexedDB.open("SimCompsScriptDB1", 1);
      request.onupgradeneeded = (event) => {
        indexedDB.dbObj = event.target.result;
        if (!indexedDB.dbObj.objectStoreNames.contains(this.dbStoreName))
          indexedDB.storeObj = indexedDB.dbObj.createObjectStore(this.dbStoreName, { keyPath: "id" });
      };
      request.onerror = () => reject("数据库的打开失败");
      request.onsuccess = (event) => {
        this.dbOpenTime = new Date().getTime();
        this.dbObj = event.target.result;
        this.dbOpenFlag = true;
        resolve("数据库连接完毕");
      };
    });
  }
  static async indexDB_getData(id) {
    return new Promise((resolve, reject) => {
      if (!this.dbOpenFlag) return reject("数据库未连接");
      let request = this.dbObj.transaction([this.dbStoreName]).objectStore(this.dbStoreName).get(id);
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject("获取数据失败");
    });
  }

  static async indexDB_addData(data, id) {
    return new Promise((resolve, reject) => {
      if (!this.dbOpenFlag) return reject("数据库未连接");
      if (this.dbOpenTime == 0) return;
      if (data.id != "langData" && id != "langData" && new Date().getTime() - this.dbOpenTime <= 5 * 1000) return resolve("请等待");
      if (!data.id && !id) return reject("缺少主键");
      id = data.id || id;
      data.id = id;
      let request = this.dbObj.transaction([this.dbStoreName], "readwrite").objectStore(this.dbStoreName).add(data);
      request.onsuccess = () => resolve("数据添加成功");
      request.onerror = () => reject("添加数据失败");
    });
  }

  static async indexDB_updateData(data, id) {
    return new Promise((resolve, reject) => {
      // console.log(data, id);
      if (!this.dbOpenFlag) return reject("数据库未连接");
      if (this.dbOpenTime == 0) return;
      if (data.id != "langData" && id != "langData" && new Date().getTime() - this.dbOpenTime <= 5 * 1000) return resolve("请等待");
      if (!data.id && !id) return reject("缺少主键");
      id = data.id || id;
      data.id = id;
      let objectStore = this.dbObj.transaction([this.dbStoreName], "readwrite").objectStore(this.dbStoreName);
      let getRequest = objectStore.get(id);
      getRequest.onsuccess = () => {
        let existingData = getRequest.result || {};
        Object.assign(existingData, data);
        let updateRequest = objectStore.put(existingData);
        updateRequest.onsuccess = () => resolve("数据更新成功");
        updateRequest.onerror = () => reject("更新数据失败");
      };
      getRequest.onerror = () => this.indexDB_addData(data, id);
    });
  }

  static async indexDB_deleteData(id) {
    return new Promise((resolve, reject) => {
      if (!this.dbOpenFlag) return reject("数据库未连接");
      if (!id) return reject("缺少主键");
      let request = this.dbObj.transaction([this.dbStoreName], "readwrite").objectStore(this.dbStoreName).delete(id);
      request.onsuccess = () => resolve("数据删除成功");
      request.onerror = () => reject("删除数据失败");
    });
  }
  /**
   * 更新/创建脚本内存uuid
   * @returns
   */
  static async indexDB_updateUUID() {
    let dbData = await this.indexDB_getData("uuid");
    if (dbData) return (this.uuid = dbData.uuid);
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
        feature_config[key] = feature_config[key].map((value, index) => (dbData[key][index] == undefined ? value : dbData[key][index]));
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
    tools.indexDB_updateTabCount();
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
    let dataNameList = ["tapCount", "feature_conf", "indexDBData", "uuid", "loadCount", "langData"];
    // dataNameList.forEach(async item => await this.indexDB_deleteData(item));
    this.noSaveClose = true;
    for (let i = 0; i < dataNameList.length; i++) {
      console.log(dataNameList[i]);
      await this.indexDB_deleteData(dataNameList[i]);
    }
  }
  /**
   * 加载IndexedDB中的语言包文件
   */
  static async indexDB_loadLangData() {
    let dbData = await this.indexDB_getData("langData");
    if (!dbData) return;
    delete dbData.id;
    langData = dbData;
  }
  /**
   * 更新/创建语言包数据
   * @param {Object} langData 语言包数据
   */
  static async indexDB_updateLangData(langData) {
    if (langData.id !== "langData") langData.id = "langData";
    await this.indexDB_updateData(langData);
  }
  /**
   * 加载数据库中的点击次数
   */
  static async indexDB_loadTapCount() {
    // 数据库主键为:"tapCount" {id:"tapCount",basisCPT:1234}
    let dbData = await this.indexDB_getData("tapCount");
    if (!dbData) {
      // 新建数据
      let nowList = this.genComponentTapCount();
      this.indexDB_updateTabCount(nowList);
      return;
    }
    delete dbData.id;
    // 更新挂载数据
    for (const key in dbData) {
      if (!Object.hasOwnProperty.call(dbData, key) || !Object.hasOwnProperty.call(componentList, key)) continue;
      componentList[key].tapCount = dbData[key] == Infinity ? Infinity : Number(dbData[key]);
    }
  }
  /**
   * 更新数据库中的点击次数
   */
  static async indexDB_updateTabCount(input = undefined) {
    let nwoList = input ? input : this.genComponentTapCount();
    nwoList.id = "tapCount";
    await this.indexDB_updateData(nwoList);
  }
  static async indexDB_genAllData2String() {
    let output = { feature_conf: null, indexDBData: null, tapCount: null };
    output.feature_conf = this.deepCloneObj(feature_config);
    output.indexDBData = this.deepCloneObj(indexDBData);
    output.tapCount = this.deepCloneObj(this.genComponentTapCount());
    return JSON.stringify(output);
  }
  static async indexDB_loadUserConf(in_feature_conf, in_indexDBData, in_tapCount) {
    feature_config = in_feature_conf;
    await tools.indexDB_updateFeatureConf();
    this.convertPropertiesToRegex(in_indexDBData);
    indexDBData = in_indexDBData;
    await tools.indexDB_updateIndexDBData();
    await tools.indexDB_updateTabCount(in_tapCount);
  }
  static genComponentTapCount() {
    let output = {};
    for (const key in componentList) {
      if (!Object.hasOwnProperty.call(componentList, key)) continue;
      output[key] = componentList[key].tapCount;
    }
    return output;
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
   * @param {number} channel 通知通道 0原生 1网页内 2安卓通道
   */
  static msg_send(title, body = "", channel = undefined) {
    // 通知模式:
    // -1 是无
    //  0 原生Notification对象
    //  1 网页内信息
    //  2 安卓通知通道
    let actimeChannel = channel ? (feature_config.notificationMode.includes(channel) ? [channel] : []) : feature_config.notificationMode;

    // 判断是否有通道0
    try {
      if (actimeChannel.includes(0) && body.tagName == undefined) new Notification(title, { body });
    } catch (error) {
      tools.errorLog("渠道0 原生Notification通知报错", error);
    }

    // 判断是否有通道1
    try {
      if (actimeChannel.includes(1)) {
        let newNode = document.createElement("tr");
        let time = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
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
          Object.assign(document.querySelector("div#script_hover_node>div>span").style, {
            backgroundColor: this.msgShowFlag.flag ? "rgb(0,0,0,0)" : "#792c2c",
          });
          this.msgShowFlag.flag = !this.msgShowFlag.flag;
        }, 10 * 1000);
      }
    } catch (error) {
      tools.errorLog("渠道1 网页内通知通道报错", error);
    }

    // 判断是否有通道2
    try {
      if (actimeChannel.includes(2) && body.tagName == undefined) AndroidInterface.sendNotification(title, body);
    } catch (error) {
      tools.errorLog("渠道2 安卓通知通道报错", error);
    }
  }
  /**
   * 数组去重
   * @param {Array} arr 输入数组
   * @param {String} pro 输入属性 使用属性进行对比
   */
  static arrayUnique(arr, pro = undefined) {
    if (arr.length == 0 || (pro !== undefined && arr[0][pro] == undefined)) return [];
    let output = [];
    for (let outIndex = 0; outIndex < arr.length; outIndex++) {
      let isExist = output.some((item) => (pro === undefined ? arr[outIndex] === item : arr[outIndex][pro] === item[pro]));
      if (!isExist) output.push(arr[outIndex]);
    }
    return output;
  }
  static msg_clear() {
    let itemList = Object.values(this.msgBodyNode.childNodes);
    for (let i = 0; i < itemList.length; i++) {
      itemList[i].remove();
    }
  }
  // 构建替代window的alert
  static buildAlert() {
    let newNode = document.createElement("div");
    newNode.id = "script_dialog_overlay";
    newNode.style.display = "none";
    newNode.innerHTML = `<div id="script_dialog_main"><h2>通知</h2><div id='script_dialog_container'></div><button sct_id='dialog_close'>关闭</button></div>`;
    this.dialogMain = newNode.querySelector("#script_dialog_container");
    this.dialogNode = newNode;
    document.body.appendChild(newNode);
    newNode.addEventListener("click", (event) => {
      if (event.target.id == "script_dialog_overlay") return this.alertFade();
      if (event.target.getAttribute("sct_id") == "dialog_close") return this.alertFade();
    });
    this.CSSMount(
      "main_alert",
      `#script_dialog_overlay{background-color:rgba(0,0,0,0.25);transition:ease-in-out 0.15s;position:fixed;top:0;left:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;z-index:10000;backdrop-filter:blur(10px)}#script_dialog_overlay>#script_dialog_main{color:var(--fontColor);padding:20px;border-radius:5px;box-shadow:0 0 10px 10px rgba(0,0,0,0.3);max-width:400px;min-width:200px;max-height:80%;overflow-y:auto;background-color:rgb(0,0,0,0.9);border:2px white dashed;}#script_dialog_overlay #script_dialog_main h2{margin-top:0;margin-bottom:20px;}#script_dialog_overlay #script_dialog_main p{margin-bottom:20px;}#script_dialog_overlay #script_dialog_main button{padding:10px 20px;border:none;background-color:#4C4C4C;color:var(--fontColor);border-radius:5px;cursor:pointer;transition:ease-in-out 0.25s;}#script_dialog_overlay #script_dialog_main button:hover{box-shadow:0 0 5px 5px white;}`
    );
  }
  // alert的dialog窗口消失
  static alertFade() {
    this.dialogMain.innerHTML = "";
    Object.assign(this.dialogNode.style, { display: "none" });
  }
  // alert的dialog窗口出现
  static alert(message, cssNode) {
    if (typeof message == "string") {
      this.dialogMain.innerHTML = `<p>${message}</p>`;
    } else if (message.tagName) {
      this.dialogMain.appendChild(cssNode);
      this.dialogMain.appendChild(message);
    }
    Object.assign(this.dialogNode.style, { display: "flex" });
  }
  // 构建替代window的Confirm函数
  static buildConfirm() {
    let newNode = document.createElement("div");
    newNode.id = "script_confirm_overlay";
    newNode.style.display = "none";
    newNode.innerHTML = `<div id="script_confirm_main"><h2>请确认</h2><p></p><button>取消</button>\n<button>确认</button></div>`;
    this.confirmNode.msgNode = newNode.querySelector("p");
    this.confirmNode.mainNode = newNode;
    document.body.appendChild(newNode);
    newNode.addEventListener("click", (event) => {
      if (event.target.id == "script_confirm_overlay") this.hideConfirm(false);
      if (event.target.tagName == "BUTTON" && /取消/.test(event.target.innerText)) this.hideConfirm(false);
      if (event.target.tagName == "BUTTON" && /确认/.test(event.target.innerText)) this.hideConfirm(true);
    });
    this.CSSMount(
      "main_confirm",
      `#script_confirm_overlay{background-color:rgba(0,0,0,0.25);transition:ease-in-out 0.15s;position:fixed;top:0;left:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;z-index:10000;backdrop-filter:blur(10px)}#script_confirm_overlay>#script_confirm_main{color:var(--fontColor);padding:20px;border-radius:5px;box-shadow:0 0 10px 10px rgba(0,0,0,0.3);max-width:400px;min-width:200px;background-color:rgb(0,0,0,0.9);border:2px white dashed;}#script_confirm_overlay #script_confirm_main h2{margin-top:0;margin-bottom:20px;}#script_confirm_overlay #script_confirm_main p{margin-bottom:20px;}#script_confirm_overlay #script_confirm_main button{padding:10px 20px;border:none;background-color:#4C4C4C;color:var(--fontColor);border-radius:5px;cursor:pointer;transition:ease-in-out 0.25s;}#script_confirm_overlay #script_confirm_main button:hover{box-shadow:0 0 5px 5px white;}`
    );
  }
  // Confirm窗口隐藏
  static hideConfirm(input = false) {
    this.confirmNode.mainNode.style.display = "none";
    this.confirmNode.msgNode.innerHTML = "";
    this.confirmNode.resolveFunc(input);
  }
  // Confirm窗口显示
  static confirm(message = "") {
    this.confirmNode.mainNode.style.display = "flex";
    if (message.tagName) {
      this.confirmNode.msgNode.appendChild(message);
    } else {
      this.confirmNode.msgNode.innerText = message;
    }
    return new Promise((resolve, reject) => (this.confirmNode.resolveFunc = resolve));
  }
  // 组件依赖检查
  static async dependenceCheck() {
    let componentArray = Object.values(componentList).filter((component) => component.enable || !component.canDisable);
    let urlDepLoad = []; // ["name"]
    for (let i = 0; i < componentArray.length; i++) {
      let component = componentArray[i];
      let name = component.constructor.name;
      // [{name:"asd",url:"asd"}]
      let innerDep = component.dependence.cpt || [];
      let outterDep = component.dependence.url || [];
      // 排除无依赖的组件
      if (innerDep.length == 0 && outterDep.length == 0) continue;
      // 检查内部组件依赖
      if (innerDep.some((dep) => componentArray.findIndex((cpt) => cpt.constructor.name == dep) == -1))
        return console.log(`${name} ${component.name} 组件的依赖未被开启`);
      // 检查并挂载外部依赖
      outterDep
        .filter((dep) => !urlDepLoad.includes(dep.name))
        .forEach((dep) => {
          urlDepLoad.push(dep.name);
          let newNode = document.createElement("script");
          newNode.src = dep.url;
          document.head.appendChild(newNode);
        });
    }
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
            try {
              funcObj.func.call(component, event);
            } catch (error) {
              tools.errorLog(error);
            }
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
            try {
              funcObj.func.call(component, event);
            } catch (error) {
              tools.errorLog(error);
            }
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
  static mutationHandle(mutations) {
    try {
      let resolveFlag = false;
      let refMutaion = Array.from(mutations).filter(this.mutationHandle_chatMsgNodeCheck);

      if (/messages\/.+\/$/.test(location.href) && refMutaion.length) {
        for (let i = 0; i < refMutaion.length; i++) this.chatMsgEventHandle(refMutaion[i]);
        resolveFlag = true;
      }

      if (/messages\/$/.test(this.mutationUrlTemp) && /messages\/.+\/$/.test(location.href)) {
        let tempList = Array.from(mutations).filter(this.mutationHandle_chatMsgNodeCheck2);
        let nodeList = Array.from(tempList[0].addedNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes).map(
          (node) => {
            return { addedNodes: [node] };
          }
        );
        for (let i = 0; i < nodeList.length; i++) this.chatMsgEventHandle(nodeList[i]);
        resolveFlag = true;
      }

      if (!resolveFlag) {
        let nowTime = new Date().getTime();
        if (nowTime - this.lastMutationTime <= 0.5 * 1000) {
          if (mutations[0].target.className.match("chat-notifications")) return;
          if (mutations.length >= 2 && mutations[0].target == mutations[1].target) return;
          if (this.getParentByIndex(mutations[0].target, 5).tagName == "TBODY") return;
        }
        // 常规DOM更新处理
        this.lastMutationTime = nowTime;
        this.log("检测到DOM变动,Mutation: ", mutations);
        this.lastMutation = mutations[0];
        this.eventBus(undefined);
      }
    } catch (error) {
      this.log(mutations);
      this.errorLog(error);
      this.eventBus(undefined);
    } finally {
      this.mutationUrlTemp = location.href;
    }
  }
  // 聊天信息节点筛审
  static mutationHandle_chatMsgNodeCheck(muta) {
    try {
      let typeCheck = muta.type && muta.type === "childList";
      let addedNodesCheck = muta.addedNodes && muta.addedNodes.length === 1;
      let tagNameCheck = muta.addedNodes[0].tagName === "DIV";
      let firstChild = muta.addedNodes[0].firstElementChild;
      let firstChildIsAnchorTag = firstChild && firstChild.tagName === "A";
      let firstChildHasHref = firstChild && firstChild.hasAttribute("href");
      let hrefCheck = firstChildHasHref && /\/company\/\d+\/.+\/$/.test(firstChild.getAttribute("href"));
      // console.log("result", typeCheck, addedNodesCheck, tagNameCheck, firstChildIsAnchorTag, hrefCheck);
      let result = typeCheck && addedNodesCheck && tagNameCheck && firstChildIsAnchorTag && hrefCheck;
      return result;
    } catch {
      return false;
    }
  }
  static mutationHandle_chatMsgNodeCheck2(mutation) {
    try {
      let flag1 = mutation.addedNodes[0].tagName == "DIV";
      let falg2 = /well-header text-uppercase/.test(mutation.addedNodes[0].childNodes[0].childNodes[0].childNodes[0].className);
      return flag1 && falg2;
    } catch {
      return false;
    }
  }
  // 聊天信息处理事件
  static chatMsgEventHandle(mutation) {
    try {
      for (const key in componentList) {
        if (!Object.hasOwnProperty.call(componentList, key)) continue;
        let component = componentList[key];
        if (!component.enable && component.canDisable) continue;
        let chatMsgFuncList = component.chatMsgFuncList;
        for (let i = 0; i < chatMsgFuncList.length; i++) {
          try {
            let textList = Object.values(mutation.addedNodes[0].childNodes[2].childNodes).map((node) => this.formatMsgText(node));
            chatMsgFuncList[i].call(component, mutation.addedNodes[0], textList);
          } catch (error) {
            tools.errorLog(error);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
  // chat - 格式化信息文本
  static formatMsgText(node) {
    // 默认情况下
    // node.childNodes[0]包裹着span列表
    // 当在群组聊天时,自己发的消息 这个node.childNodes[0]会指向到一个i标签
    try {
      let result = "";
      let targetNode = node.childNodes[0];
      if (targetNode.tagName == "I") targetNode = node.childNodes[1];
      let nodeList = Object.values(targetNode.children).filter((node) => node.tagName == "SPAN");
      for (let i = 0; i < nodeList.length; i++) {
        let spanNode = nodeList[i];
        result += nodeList[i].children.length == 0 ? spanNode.innerText : this.getSpanText(spanNode);
      }
      return result;
    } catch (error) {
      console.error(error);
    }
  }
  // chat - 单span节点处理
  static getSpanText(node) {
    let tempArray = Array.from(node.children);
    let length = tempArray.length;
    if (length == 1 && tempArray[0].tagName == "SPAN" && tempArray[0].children.length == 1 && tempArray[0].children[0].tagName == "IMG") {
      // 游戏图标适配
      return tempArray[0].children[0].alt;
    } else if (length == 1 && tempArray[0].tagName == "IMG" && tempArray[0].className == "emoji") {
      // emoji适配
      return tempArray[0].alt;
    } else if (length == 1 && tempArray[0].tagName == "A" && /^@/.test(tempArray[0].innerText)) {
      // AT别的公司
      return tempArray[0].innerText;
    } else if (length == 1 && tempArray[0].tagName == "A" && !/^@/.test(tempArray[0].innerText)) {
      // 普通跳转链接
      return tempArray[0].href;
    } else if (length > 1 && tools.arrayCompareByProp(tempArray, "className")) {
      // 多emoji适配
      return tempArray.map((node) => node.alt).join("");
    }
    return "";
  }
}

module.exports = { tools, componentList, runtimeData, indexDBData, feature_config, langData };

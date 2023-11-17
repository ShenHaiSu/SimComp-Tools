const { tools, componentList, runtimeData, indexDBData, feature_config } = require("./tools/tools.js");
require("./tools/baseComponent.js");

// 导入components文件夹下的所有JavaScript文件
const components = require.context('./components', true, /\.js$/);
components.keys().forEach(components);

// 初始化代码
async function scriptMainInit() {
  // 获取窗口横纵
  tools.checkWindowHorV();
  // 获取浏览器类型
  tools.checkBrowser();
  // 格式化组件信息，形成函数列表
  for (const key in componentList) {
    let component = componentList[key];
    runtimeData[key] = component.componentData;
    indexDBData[key] = component.indexDBData;
    feature_config.componentSwitchList[key] = component.enable;
    if (component.cssText) tools.CSSMount("add", component.cssText[tools.clientHorV] || component.cssText[0]);
  }
  // 数据库操作
  await tools.indexDB_openDB();
  await tools.indexDB_updateUUID();
  await tools.indexDB_updateLoadCount();
  await tools.indexDB_loadFeatureConf();
  await tools.indexDB_loadIndexDBData();
  // 挂载css
  tools.CSSMount("mount");
  // 执行缩放比例
  tools.zoomRateApply();
  // 执行自启动函数
  for (const key in componentList) {
    if (!Object.hasOwnProperty.call(componentList, key) || (!componentList[key].enable && componentList[key].canDisable)) continue;
    await componentList[key].startupFuncList.forEach(async func => await func.call(componentList[key], this));
  }
  // 检查通知模式
  tools.msg_check();
  // 更新标记
  tools.scriptLoadAcc = true;
}

// 事件监控
document.addEventListener("click", (event) => tools.eventBus(event));
document.addEventListener("keydown", (event) => tools.eventBus(event));
let rootObserveServer = new MutationObserver((mutation) => tools.mutationHandle(mutation));
rootObserveServer.observe(document.querySelector("div#root"), { childList: true, subtree: true });
setInterval(tools.intervalEventBus.apply(tools), 100);
const originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function () {
  let xhr = new originalXHR();
  let originalOpen = xhr.open;
  xhr.open = function (method, url, async) {
    // tools.log(`XHR request ${method} ${url}`);
    let originalOnLoad = xhr.onload;
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          let responseJson = JSON.parse(xhr.responseText);
          // tools.log("XHR拦截器拦截到json响应体：", responseJson);
          tools.netEventBus(url, method, responseJson);
        } catch (error) {
          tools.errorLog(error);
        }
      }
      if (originalOnLoad) originalOnLoad.apply(this, arguments);
    };
    originalOpen.apply(this, arguments);
  };
  return xhr;
};

scriptMainInit();

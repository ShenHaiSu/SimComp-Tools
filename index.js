const { tools, componentList, runtimeData, indexDBData, feature_config } = require("./tools/tools.js");
require("./tools/baseComponent.js");
require("./components/basisCPT.js");

// 导入components文件夹下的所有JavaScript文件
const components = require.context('./components', true, /\.js$/);
components.keys().forEach(components);

// 初始化代码
async function scriptMainInit() {
  // 标记插件已加载
  if (window.SCTLoadFlag || document.querySelector("div#script_hover_node")) return;
  window.SCTLoadFlag = true;
  try {
    scriptEventStart();
  } catch {
    tools.dely(5000);
    window.SCTLoadFlag = false;
    return scriptMainInit();
  }
  // 获取基础信息
  tools.checkWindowHorV(); // 窗口横纵
  tools.checkBrowser(); // 浏览器类型
  // 格式化组件信息，形成函数列表
  for (const key in componentList) {
    let component = componentList[key];
    runtimeData[key] = component.componentData;
    indexDBData[key] = component.indexDBData;
    feature_config.componentSwitchList[key] = component.enable;
  }
  // 数据库操作
  await tools.indexDB_openDB();
  await tools.indexDB_updateUUID();
  await tools.indexDB_updateLoadCount();
  await tools.indexDB_loadFeatureConf();
  await tools.indexDB_loadIndexDBData();
  await tools.indexDB_loadLangData();
  await tools.indexDB_loadTapCount();
  // 组建依赖检查
  await tools.dependenceCheck();
  // 构建消息提示强显示
  tools.buildAlert();
  tools.buildConfirm();
  // 执行缩放比例
  tools.zoomRateApply();
  // 检查通知模式
  tools.msg_check();
  // 执行自启动函数 以及 挂载css
  for (const key in componentList) {
    if (!Object.hasOwnProperty.call(componentList, key) || (!componentList[key].enable && componentList[key].canDisable)) continue;
    let component = componentList[key];
    await component.startupFuncList.forEach(async func => await func.call(component, this));
    if (component.cssText) tools.CSSMount(component.constructor.name, component.cssText[tools.clientHorV] || component.cssText[0]);
  }
  // 更新标记
  tools.scriptLoadAcc = true;
}


// 事件监控
function scriptEventStart() {
  window.addEventListener("beforeunload", () => tools.indexDB_updateIndexDBData());
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
      let originalOnLoad = xhr.onload;
      xhr.onload = function () {
        if (xhr.status !== 200) return;
        try { tools.netEventBus(url, method, xhr.responseText) } catch (error) { tools.errorLog(error) }
        if (originalOnLoad) originalOnLoad.apply(this, arguments);
      };
      originalOpen.apply(this, arguments);
    };
    return xhr;
  };
}

scriptMainInit();

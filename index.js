// #region 依赖导入
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("./tools/tools.js");
require("./tools/baseComponent.js");
require("./components/basisCPT.js");

// 导入components文件夹下的所有JavaScript文件
const components = require.context("./components", true, /\.js$/);
components.keys().forEach(components);
// #endregion

// #region 初始化代码

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

  // 版本显示
  console.log(sctData.version ? `当前Sim Companies little Tools插件版本：${sctData.version.join(".")}` : "未获取到版本号。");

  // 获取基础信息
  tools.checkWindowHorV(); // 窗口横纵
  tools.checkBrowser(); // 浏览器类型
  tools.checkIPArea(); // 获取用户网络地区

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
    for (let i = 0; i < component.startupFuncList.length; i++) {
      const func = component.startupFuncList[i];
      try {
        await func.call(component, this);
      } catch (err) {
        tools.errorLog(`组件 ${key} 的自启动函数执行失败: ${err}`);
      }
    }
    if (component.cssText) tools.CSSMount(component.constructor.name, component.cssText[tools.clientHorV] || component.cssText[0]);
  }

  // 更新标记
  tools.scriptLoadAcc = true;
}
// #endregion

// #region 事件监控
// 事件监控
/**
 * 注册各类全局事件监听器
 * 1. 页面卸载前自动保存数据
 * 2. 全局点击/键盘事件分发
 * 3. DOM 变化监听（#root 子树）
 * 4. 100ms 定时器触发轮询任务
 * 5. 拦截 XMLHttpRequest，网络请求完成后统一上报
 */
function scriptEventStart() {
  // 页面关闭前：若非强制关闭，则把内存数据写回 IndexedDB
  window.addEventListener("beforeunload", () => {
    if (!tools.noSaveClose) tools.indexDB_updateIndexDBData();
  });

  // 全局用户交互事件 -> 统一事件总线
  document.addEventListener("click", (event) => {
    tools.eventBus(event);
  });
  document.addEventListener("keydown", (event) => {
    tools.eventBus(event);
  });

  // 监听 React 根节点(#root) 子树变化，统一交给 mutationHandle 处理
  const rootObserveServer = new MutationObserver((mutation) => tools.mutationHandle(mutation));
  rootObserveServer.observe(document.querySelector("div#root"), {
    childList: true,
    subtree: true,
  });

  // 每 100ms 触发一次定时任务（如心跳、轮询）
  setInterval(() => tools.intervalEventBus.call(tools), 100);

  // 重写 XMLHttpRequest，用于捕获所有网络请求返回
  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function () {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;

    xhr.open = function (method, url, async) {
      const originalOnLoad = xhr.onload;

      xhr.onload = function () {
        // 仅处理成功响应
        if (xhr.status === 200) {
          try {
            tools.netEventBus(url, method, xhr.responseText);
          } catch (err) {
            tools.errorLog(err);
          }
        }
        // 保证原生 onload 继续执行
        if (originalOnLoad) originalOnLoad.apply(this, arguments);
      };

      originalOpen.apply(this, arguments);
    };

    return xhr;
  };
}
// #endregion

// #region 程序入口
scriptMainInit();
// #endregion

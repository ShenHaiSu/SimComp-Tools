const { componentList } = require("./tools.js")


// 基础组件
class BaseComponent {
  // 组件名称
  name = "";
  // 组件描述
  describe = "";
  // 组件开关
  enable = false;
  // 允许关闭
  canDisable = true;
  // 通用处理函数列表
  // [{match, func}, {match, func}]
  commonFuncList = [];
  // 网络请求拦截处理函数列表
  // [{urlMatch,func}, {urlMatch,func}]
  netFuncList = [];
  // 防抖通用处理函数列表
  // [{bounce:20, func}]
  debounceFuncList = [];
  // 自启动函数列表
  // [func]
  startupFuncList = [];
  // UI设置界面
  // func
  settingUI = undefined;
  // 前台界面
  frontUI = undefined;
  // 组件内部数据
  componentData;
  // 数据库数据
  indexDBData;
  // css追加
  // ["", ""]
  cssText;
  constructor() {
    componentList[this.constructor.name] = this;
  }
}

module.exports = BaseComponent
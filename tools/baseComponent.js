const { componentList } = require("./tools.js")

/**
 * @typedef {Object} CommonFunc
 * @property {RegExp|string} match - 匹配规则
 * @property {Function} func - 处理函数
 */

/**
 * @typedef {Object} NetFunc
 * @property {RegExp|string} urlMatch - URL匹配规则
 * @property {Function} func - 处理函数
 */

/**
 * @typedef {Object} DebounceFunc
 * @property {number} bounce - 防抖延迟时间(ms)
 * @property {Function} func - 处理函数
 */

/**
 * @typedef {Object} Dependency
 * @property {string} name - 依赖名称
 * @property {string} url - 依赖地址
 */

/**
 * 基础组件类
 * @class BaseComponent
 */
class BaseComponent {
  /** @type {string} 组件名称 */
  name = "";
  
  /** @type {string} 组件描述 */
  describe = "";
  
  /** @type {boolean} 组件开关 */
  enable = false;
  
  /** @type {boolean} 允许关闭 */
  canDisable = true;
  
  /** @type {CommonFunc[]} 通用处理函数列表 */
  commonFuncList = [];
  
  /** @type {NetFunc[]} 网络请求拦截处理函数列表 */
  netFuncList = [];
  
  /** @type {DebounceFunc[]} 防抖通用处理函数列表 */
  debounceFuncList = [];
  
  /** @type {Function[]} 自启动函数列表 */
  startupFuncList = [];
  
  /** @type {Function[]} 聊天室信息处理函数列表 */
  chatMsgFuncList = [];
  
  /** @type {Function|undefined} UI设置界面 */
  settingUI = undefined;
  
  /** @type {Function|undefined} 前台界面 */
  frontUI = undefined;
  
  /** @type {any} 组件内部数据 */
  componentData;
  
  /** @type {any} 数据库数据 */
  indexDBData;
  
  /** @type {string[]} css追加 */
  cssText;
  
  /** 
   * @type {{
   *   cpt: Dependency[], // 内部依赖
   *   url: Dependency[]  // 外部库依赖
   * }} 
   */
  dependence = {
    cpt: [],
    url: [],
  }
  
  /** @type {number} 点击次数 */
  tapCount = 0
  
  /** @type {string[]} tag列表 */
  tagList = []

  constructor() {
    componentList[this.constructor.name] = this;
  }
}

module.exports = BaseComponent
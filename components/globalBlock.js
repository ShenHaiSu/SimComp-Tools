const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class globalBlock extends BaseComponent {
  constructor() {
    super();
    this.name = "全局屏蔽";
    this.describe = "在交易所界面和聊天室界面屏蔽掉指定人的信息";
    this.enable = true;
    this.tagList = ['样式', '聊天', '交易所', '过滤'];
  }
  commonFuncList = [{
    // 交易所屏蔽
    match: () => Boolean(location.href.match(/market\/resource\/\d+\/$/)),
    func: this.marketBlockFunc,
  }]
  startupFuncList = [
    this.genTempList
  ]
  chatMsgFuncList = [
    this.chatBlockFunc
  ]
  indexDBData = {
    blockList: [], // 屏蔽列表 ["asdas"]  需要全小写,空格转-
    maskImgUrl: undefined, // 遮罩img图像地址
    blockZone: 0, // 屏蔽范围 0全屏蔽 1交易所 2聊天室
    chatBlockType: 0, // 聊天室遮蔽模式 0全遮蔽 1仅遮蔽头像
  }
  componentData = {
    lastMsgList: [], // 缓存消息列表
    lastMarketTag: "", // 最近一个交易所记录
    lastTimeStamp: 0, // 最近一次检查
    iconMaskNode: undefined, // 头像遮罩节点缓存
    tempBlockList: [], // 匹配用的列表
  }
  cssText = [
    `div#script_globalBlock_main button.script_globalBlock_delete {background-color:rgb(137, 37, 37);}`
  ]

  // 设置界面
  settingUI = () => {
    let newNode = document.createElement("div");
    let htmlText = `<div class="header">全局屏蔽设置界面</div><div class="container"><div><div><button class="btn script_opt_submit">保存</button></div></div><div><table><thead><tr><td>功能</td><td>设置</td></tr></thead><tbody><tr><td title="选定在哪些区域启用屏蔽功能">屏蔽范围</td><td><select id="script_blockZone" class="form-control"><option value="0">两者都</option><option value="1">交易所</option><option value="2">聊天室</option></select></td></tr><tr><td title="聊天室遮蔽模式 默认全遮蔽 全遮蔽完全看不到此人发言">聊天室遮蔽模式</td><td><select id="script_chatBlockType" class="form-control"><option value="0">全遮蔽</option><option value="1">仅头像</option></select></td></tr><tr><td>遮罩图片<td><input class="form-control" id=script_imgUrl></tbody></table><table><thead><tr><td>屏蔽的公司名</td><td>删除</td></tr></thead><tbody>`;
    for (let i = 0; i < this.indexDBData.blockList.length; i++) {
      let name = this.indexDBData.blockList[i];
      htmlText += `<tr><td><input class="form-control" value='${name}'></td><td><button class="btn script_globalBlock_delete">删除</button></td></tr>`;
    }
    htmlText += `</tbody></table><button class="btn" style="width: 100%;" id="script_globalBlock_add">添加</button></div></div>`;
    newNode.innerHTML = htmlText;
    newNode.id = "script_globalBlock_main";
    newNode.querySelector("#script_blockZone").value = this.indexDBData.blockZone;
    newNode.querySelector("#script_chatBlockType").value = this.indexDBData.chatBlockType;
    newNode.querySelector("#script_imgUrl").value = this.indexDBData.maskImgUrl || "";
    newNode.addEventListener('click', event => this.settingClickHandle(event));
    return newNode;
  }
  // 设置界面按键事件分发
  settingClickHandle(event) {
    if (event.target.id == "script_globalBlock_add") return this.settingAddNode(event);
    if (/script_opt_submit/.test(event.target.className)) return this.settingSubmit(event);
    if (/script_globalBlock_delete/.test(event.target.className)) return this.settingDeleteOne(event);
  }
  // 设置提交按钮
  settingSubmit(event) {
    let root = tools.getParentByIndex(event.target, 3);
    let valueList = Object.values(root.querySelectorAll("select, input")).map(node => node.value);
    // 审查
    if (valueList[2] != "" && !/^https:\/\/[^\s/$.?#].[^\s]*$/.test(valueList[2])) return tools.alert("遮罩url必须是https协议的合法url");
    // 保存
    this.indexDBData.blockZone = Math.floor(valueList[0]);
    this.indexDBData.chatBlockType = Math.floor(valueList[1]);
    this.indexDBData.maskImgUrl = valueList[2] == "" ? undefined : valueList[2];
    valueList = valueList.slice(3);
    this.indexDBData.blockList = valueList;
    this.genTempList();
    tools.indexDB_updateIndexDBData();
    this.componentData.iconMaskNode = undefined;
    tools.alert("已提交更改.");
  }
  // 设置界面添加节点
  settingAddNode(event) {
    let targetNode = event.target.previousElementSibling.querySelector("tbody");
    let newNode = document.createElement("tr");
    newNode.innerHTML = `<td><input class="form-control"></td><td><button class="btn script_globalBlock_delete">删除</button></td>`;
    targetNode.appendChild(newNode);
  }
  // 设置界面删除节点
  settingDeleteOne(event) {
    tools.getParentByIndex(event.target, 2).remove();
  }

  // 交易所屏蔽
  marketBlockFunc(event) {
    // 屏蔽键盘事件
    if (event != undefined && event.type == "keydown") return;
    if (this.indexDBData.blockZone == 2) return;
    // 检查交易所列表以及上次执行时间差
    let infoList = Object.values(document.querySelectorAll("tr>td>div>div>span")).map(node => tools.getParentByIndex(node, 4));
    let nowHeadInfo = `${infoList[0].childNodes[2].innerText} - ${infoList[0].childNodes[3].innerText}`;
    let headDiff = nowHeadInfo == this.componentData.lastMarketTag;
    let nowTime = new Date().getTime();
    let timePass = (nowTime - this.componentData.lastTimeStamp) < 2000;
    if (timePass && headDiff) return;
    this.componentData.lastMarketTag = nowHeadInfo;
    this.componentData.lastTimeStamp = nowTime;
    // 构建遮罩图片
    let maskNode = this.getIconMask().cloneNode(true);
    Object.assign(maskNode.style, { width: "30px", height: "30ox" });
    // 检查是否符合
    for (let i = 0; i < infoList.length; i++) {
      let div = infoList[i];
      let companyName = div.querySelector("div>div>span").innerText;
      // console.log(companyName);
      if (!this.indexDBData.blockList.includes(companyName)) continue;
      // 遮盖原头像
      div.querySelector("a>img").style.display = "none";
      // 添加svg
      div.querySelector("a").prepend(maskNode.cloneNode(true));
      // 修改公司名
      div.querySelector("div>div>span").innerText = " ";
    }
  }

  // 聊天室屏蔽
  chatBlockFunc(mainNode) {
    let companyName = mainNode.childNodes[0].href.match(/\/company\/\d+\/(.+)\/$/)[1].toLowerCase().replace(/ /g, "-");
    if (!this.componentData.tempBlockList.includes(companyName)) return;
    if (mainNode.querySelector("div#script_globalBlock_mask")) return;
    if (this.indexDBData.chatBlockType == 0) {
      Object.assign(mainNode.style, { display: "none" });
    } else {
      setTimeout(() => this.chatIconMaskHandle(mainNode), 20);
    }
  }

  // 生成匹配用的名单
  genTempList() {
    this.componentData.tempBlockList = this.indexDBData.blockList.map(item => item.toLowerCase().replace(/ /g, "-"));
  }

  // 聊天室头像屏蔽
  chatIconMaskHandle(node = undefined) {
    if (!node) return;
    let targetNode = node.querySelector("a>div>img.logo");
    let maskNode = this.getIconMask().cloneNode(true);
    try {
      maskNode.id = "script_globalBlock_mask";
      Object.assign(maskNode.style, { width: "100%" });
      targetNode.style.display = "none";
      tools.getParentByIndex(targetNode, 1).prepend(maskNode);
    } catch (e) {
      console.error(e);
    }
  }

  // 头像屏蔽替换函数
  getIconMask() {
    if (!this.componentData.iconMaskNode) {
      if (this.indexDBData.maskImgUrl) {
        this.componentData.iconMaskNode = document.createElement("div");
        this.componentData.iconMaskNode.innerHTML = `<img style='width:100%' src="${this.indexDBData.maskImgUrl}">`;
      } else {
        this.componentData.iconMaskNode = document.createElement("div");
        this.componentData.iconMaskNode.innerHTML = `<svg style='width:100%' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;
      }
    }
    return this.componentData.iconMaskNode;
  }
}
new globalBlock();
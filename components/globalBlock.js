const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class globalBlock extends BaseComponent {
  constructor() {
    super();
    this.name = "全局屏蔽";
    this.describe = "在交易所界面和聊天室界面屏蔽掉指定人的信息";
    this.enable = true;
  }
  commonFuncList = [{
    // 交易所屏蔽
    match: () => Boolean(location.href.match(/market\/resource\/\d+\/$/)),
    func: this.marketBlockFunc,
  }, {
    // 聊天室屏蔽
    match: () => Boolean(location.href.match(/\/messages\/.*\/$/)),
    func: this.chatBlockFunc
  }]
  indexDBData = {
    blockList: [], // 屏蔽列表 ["asdas"]  需要全小写,空格转-
    maskImgUrl: undefined, // 遮罩img图像地址
    blockZone: 0, // 屏蔽范围 0全屏蔽 1交易所 2聊天室
  }
  componentData = {
    lastMsgList: [], // 缓存消息列表
    lastMarketTag: "", // 最近一个交易所记录
    lastTimeStamp: 0, // 最近一次检查
  }

  // 设置界面
  settingUI = () => {
    let newNode = document.createElement("div");
    newNode.id = "script_globalBlock_setting";
    newNode.className = "col-sm-12 setting-container";
    newNode.innerHTML = `<div class=header>全局屏蔽设置界面</div><div class=container><div><div><button class="btn script_opt_submit">保存并刷新</button></div></div><div style=text-align:center;width:100%;height:100%><div class="buttonContainer row"style=margin-top:10px><button class="btn col-sm-4 dbButton"id=script_globalBlock_show>罗列</button> <button class="btn col-sm-4 dbButton"id=script_globalBlock_add>增添</button> <button class="btn col-sm-4 dbButton"id=script_globalBlock_delete>删除</button></div><table><tr><td>公司名<td><input class=form-control><tr><td>交易所头像遮蔽图<td><input class=form-control value=######><tr><td>屏蔽范围<td><select id="script_blockZone" class="form-control"><option value=0>两者都<option value=1>交易所<option value=2>聊天室</select></table></div></div>`;
    // 挂载数据
    newNode.innerHTML = newNode.innerHTML.replace("######", this.indexDBData.maskImgUrl || "");
    newNode.querySelector("select#script_blockZone").value = this.indexDBData.blockZone;
    // 绑定按钮
    newNode.querySelector("button.script_opt_submit").addEventListener('click', () => this.settingSubmit());
    newNode.querySelector("button#script_globalBlock_show").addEventListener("click", () => this.settingShow());
    newNode.querySelector("button#script_globalBlock_add").addEventListener("click", () => this.settingAdd());
    newNode.querySelector("button#script_globalBlock_delete").addEventListener("click", () => this.settingDetele());
    // 返回元素
    return newNode;
  }
  settingSubmit() {
    let valueList = [];
    document
      .querySelectorAll("div#script_globalBlock_setting input, div#script_globalBlock_setting select")
      .forEach(node => valueList.push(node.value));
    if (valueList[1] != "" && !/^https:\/\/[\w.-]+\.[a-zA-Z]{2,}/.test(valueList[1])) return window.alert("当前的遮罩使用的图片网址不符合规范");
    if (valueList[1] == "") valueList[1] = undefined;
    this.indexDBData.maskImgUrl = valueList[1];
    this.indexDBData.blockZone = valueList[2];
    tools.indexDB_updateIndexDBData();
    window.alert("已提交更改");
  }
  settingShow() {
    let text = "当前已屏蔽: ";
    if (this.indexDBData.blockList.length == 0) return window.alert("当前没有已屏蔽的公司");
    window.prompt(text, this.indexDBData.blockList.join(", "));
  }
  settingAdd() {
    let value = document.querySelector("div#script_globalBlock_setting input").value;
    if (value == "") return window.alert("空的怎么添加?");
    let isExist = this.indexDBData.blockList.findIndex(item => item == value) != -1;
    if (isExist) return window.alert("已经被屏蔽过了,不必再添加了.");
    this.indexDBData.blockList.push(value);
    window.alert("完成了添加,记得点击上方保存.");
  }
  settingDetele() {
    let value = document.querySelector("div#script_globalBlock_setting input").value;
    if (value == "") {
      if (window.confirm("删除全部?")) {
        this.indexDBData.blockList = [];
      } else {
        return window.alert("那你输入一个空的干啥..");
      }
    } else {
      let isExist = this.indexDBData.blockList.findIndex(item => item == value);
      if (isExist == -1) return window.alert("没找到这个屏蔽目标");
      this.indexDBData.blockList.splice(isExist, 1);
    }
    window.alert("已完成删除,记得点击上方保存.");
  }

  // 交易所屏蔽
  marketBlockFunc(event) {
    // 屏蔽键盘事件
    if (event.type == "keydown") return;
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
    // 构建遮罩节点
    let maskNode;
    if (this.indexDBData.maskImgUrl) {
      maskNode = document.createElement("div");
      maskNode.innerHTML = `<img src="${this.indexDBData.maskImgUrl}" height="30px" width='30px'>`;
      Object.assign(maskNode.style, { width: "30px", height: "30x" });
    } else {
      maskNode = document.createElement("div");
      maskNode.innerHTML = `<svg  xmlns="http://www.w3.org/2000/svg" height="30px" width='30px' viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;
      Object.assign(maskNode.style, { width: "30px", height: "30px" });
    }
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
  chatBlockFunc(event) {
    // 屏蔽键盘事件
    if (event.type == "keydown") return;
    if (this.indexDBData.blockZone == 1) return;
    // 检查消息长度
    let msgDivList = Object.values(document.querySelectorAll("div>a>div>img.logo")).map(node => tools.getParentByIndex(node, 3));
    if (msgDivList.length == this.componentData.lastMsgList.length) return;
    // 获取消息列表差异
    let diffList = [];
    for (let i = 0; i < msgDivList.length; i++) {
      if (this.componentData.lastMsgList[i] == undefined || this.componentData.lastMsgList[i] != msgDivList[i]) {
        diffList.push(msgDivList[i]);
        continue;
      }
    }
    // 更新缓存并修改样式
    this.componentData.lastMsgList = msgDivList;
    let tampList = this.indexDBData.blockList.map(item => item.toLowerCase().replace(/ /g, "-"));
    for (let i = 0; i < msgDivList.length; i++) {
      let companyName = msgDivList[i].childNodes[0].href.match(/\/company\/\d+\/(.+)\/$/)[1];
      companyName = companyName.toLowerCase().replace(/ /g, "-");
      if (!tampList.includes(companyName)) continue;
      Object.assign(msgDivList[i].style, { display: "none" });
    }
  }
}
new globalBlock();
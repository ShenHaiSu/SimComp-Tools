const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class chatQuickMsg extends BaseComponent {
  constructor() {
    super();
    this.name = "聊天室快捷信息";
    this.describe = "在发送信息的右边新增一个按钮,可以快捷填充信息快捷发送";
    this.enable = false;
  }
  indexDBData = {
    autoSend: false, // 直接发送?
    quickList: [], // 快捷信息 [{alias:"别名",msg:"信息内容",stamp:1234567}]
    // 发送间隔默认60s
  }
  componentData = {
    templateNode: undefined, // 模板元素
    menuNode: undefined, // 菜单元素
    lastTextarea: undefined, // 最近一次点击的按钮旁的输入框
    isShow: false, // 当前是否展示
    fadeTimer: undefined, // 消失计时器
  }
  commonFuncList = [{
    match: this.checkMatch,
    func: this.mountFunc
  }]
  cssText = [`div.script_quickMsg_container{position:absolute;top:0;right:37px;height:55px;width:37px;}div.script_quickMsg_container>a>svg{display:block;width:100%;height:55px;}div.script_chatQuickMsg_menuContainer{position:fixed;background-color:rgba(0,0,0,0.5);color:var(--fontColor);padding:5px;transform:translate(-100%,-100%);border-radius:10px;}div.script_chatQuickMsg_menuContainer>table{text-align:center;height:100%;width:100%;border-collapse:separate;border-spacing:1px;}div.script_chatQuickMsg_menuContainer>table>tbody>tr>td>button{border-radius:5px;height:30px;line-height:30px;padding:0 10px;}div.script_chatQuickMsg_menuContainer>table>tbody>tr>td>button:hover{background-color:rgba(252,252,252,0.85);color:black;cursor:pointer;}`]

  settingUI = () => {
    let newNode = document.createElement("div");
    let htmlText = `<div class="header">聊天室快捷信息设置界面</div><div class="container"><div><div><button class="btn script_opt_submit">保存</button></div></div><div><table><thead><tr><td>功能</td><td>设置</td></tr></thead><tbody><tr><td title="勾选之后点击别名会直接将内容输入进去,并直接发送到聊天目标中.">直接发送</td><td><input class="form-control" type="checkbox" #####></td></tr></tbody></table><table><thead><tr><td>别名</td><td>内容</td><td>删除</td></tr></thead><tbody>`;
    htmlText = htmlText.replace("#####", this.indexDBData.autoSend ? "checked" : "");
    for (let i = 0; i < this.indexDBData.quickList.length; i++) {
      let item = this.indexDBData.quickList[i];
      htmlText += `<tr><td><input class="form-control" value="${item.alias}"></td><td><input class="form-control" value="${item.msg}"></td><td><button class="btn script_chatQuickMsgSetting_delete">删除</button></td></tr>`
    }
    htmlText += `</tbody></table><button class="btn" style="width: 100%;" id="script_chatQuickMsgSetting_add">添加</button></div></div>`;
    newNode.innerHTML = htmlText;
    newNode.id = "script_chatQuickMsg_setting";
    newNode.addEventListener("click", e => this.settingClickHandle(e));
    return newNode;
  }
  // 设定点击事件
  settingClickHandle(event) {
    if (event.target.className.match("script_opt_submit")) return this.settingSubmit();
    if (event.target.id == "script_chatQuickMsgSetting_add") return this.addItem(event);
    if (event.target.className.match("script_chatQuickMsgSetting_delete")) return this.deleteOne(event);
  }
  // 设置界面提交更改
  settingSubmit() {
    let valueList = Object.values(document.querySelectorAll("#script_chatQuickMsg_setting input"))
      .map(node => node.type == "checkbox" ? node.checked : node.value);
    // 检查数据
    let autoSend = valueList[0];
    valueList = valueList.slice(1);
    if (valueList.some(value => value == "")) return tools.alert("不能为空");
    // 保存数据
    this.indexDBData.autoSend = autoSend;
    let result = [];
    for (let i = 0; i < valueList.length; i += 2) {
      result.push({ alias: valueList[i], msg: valueList[i + 1], stamp: 0 });
    }
    this.indexDBData.quickList = result;
    tools.indexDB_updateIndexDBData();
    tools.alert("已提交更改");
  }
  // 添加一个
  addItem(event) {
    let newNode = document.createElement("tr");
    newNode.innerHTML = `<td><input class="form-control"></td><td><input class="form-control"></td><td><button class="btn script_chatQuickMsgSetting_delete">删除</button></td>`;
    event.target.previousElementSibling.querySelector("tbody").appendChild(newNode);
  }
  // 删除一个
  deleteOne(event) {
    tools.getParentByIndex(event.target, 2).remove();
  }

  // 挂载快捷信息窗口的前置判断函数
  checkMatch(event) {
    if (!event || !/messages\/(.+)/.test(location.href)) return false;
    let textareaLength = document.querySelectorAll("div.input-group textarea").length;
    let quickButtonLength = document.querySelectorAll("div.input-group button.script_chatQuickMsg_button").length;
    return textareaLength != quickButtonLength;
  }
  // 挂载快捷信息窗口
  mountFunc() {
    // 获取操作元素列表
    let textDivList = Object.values(document.querySelectorAll("div.input-group textarea"))
      .map(node => tools.getParentByIndex(node, 2))
      .filter(node => node.style.right != "77px");
    // 查询与构建模板元素
    if (!this.componentData.templateNode) {
      let newNode = document.createElement("div");
      newNode.className = "script_quickMsg_container";
      newNode.innerHTML = `<a><svg style=display:block;width:100%;height:55px viewBox="0 0 24 24"xmlns=http://www.w3.org/2000/svg><path d="M8 22.5v-5.525q-2.525-.2-4.262-2.05T2 10.5q0-2.725 1.888-4.612T8.5 4h.675L7.6 2.4L9 1l4 4l-4 4l-1.4-1.4L9.175 6H8.5Q6.625 6 5.313 7.313T4 10.5q0 1.875 1.313 3.188T8.5 15H10v2.675L12.675 15H15.5q1.875 0 3.188-1.312T20 10.5q0-1.875-1.312-3.187T15.5 6H15V4h.5q2.725 0 4.613 1.888T22 10.5q0 2.725-1.888 4.613T15.5 17h-2z"fill=currentColor></path></svg></a>`;
      this.componentData.templateNode = newNode;
    }
    // 修改样式
    for (let i = 0; i < textDivList.length; i++) {
      textDivList[i].style.right = "77px";
      let newNode = this.componentData.templateNode.cloneNode(true);
      newNode.addEventListener("click", (event) => this.quickButtonClick(event));
      tools.getParentByIndex(textDivList[i], 1).insertBefore(newNode, textDivList[i].nextElementSibling);
    }
  }
  // 按钮响应函数
  quickButtonClick(event) {
    event.preventDefault(); // 阻止默认事件
    event.stopPropagation(); // 阻止事件冒泡
    // 查询或构建菜单
    if (!this.componentData.menuNode) {
      let menuNpde = document.createElement("div");
      menuNpde.className = "script_chatQuickMsg_menuContainer";
      menuNpde.addEventListener("click", event => this.menuClickHandle(event));
      this.componentData.menuNode = menuNpde;
    }
    // 重构内部html
    let htmlText = `<table>`;
    let nowTime = new Date().getTime();
    for (let i = 0; i < this.indexDBData.quickList.length; i++) {
      if (nowTime - this.indexDBData.quickList[i].stamp <= 1000 * 60) continue;
      htmlText += `<tr><td><button>${this.indexDBData.quickList[i].alias}</button></td></tr>`;
    }
    this.componentData.menuNode.innerHTML = htmlText;
    Object.assign(this.componentData.menuNode.style, { display: "block", top: `${event.clientY - 20}px`, left: `${event.clientX - 20}px` });
    document.body.appendChild(this.componentData.menuNode);
    clearInterval(this.componentData.fadeTimer);
    // 捕获textArea
    let deepLength = 1;
    let nowTextarea = null;
    do {
      nowTextarea = tools.getParentByIndex(event.target, deepLength++).querySelector("textarea");
    } while (!Boolean(nowTextarea));
    // 对比取消显示
    if (this.componentData.lastTextarea == nowTextarea && this.componentData.isShow) {
      Object.assign(this.componentData.menuNode.style, { display: "none" });
      this.componentData.isShow = false;
    } else {
      this.componentData.lastTextarea = nowTextarea;
      this.componentData.isShow = true;
      this.componentData.fadeTimer = setTimeout(() => {
        Object.assign(this.componentData.menuNode.style, { display: "none" });
        this.componentData.isShow = false;
      }, 10 * 1000);
    }
  }
  // 菜单被点击
  async menuClickHandle(event) {
    if (event.target.tagName != "BUTTON") return;
    let objIndex = this.indexDBData.quickList.findIndex(obj => obj.alias == event.target.innerText);
    let nowtime = new Date().getTime();
    if (objIndex == -1 || (nowtime - this.indexDBData.quickList[objIndex].stamp < 60 * 1000)) return;
    this.indexDBData.quickList[objIndex].stamp = nowtime;
    this.componentData.lastTextarea.click();
    tools.setInput(this.componentData.lastTextarea, this.indexDBData.quickList[objIndex].msg);
    await tools.dely(200);
    if (this.indexDBData.autoSend) this.msgAutoSend();
    // 关闭菜单
    Object.assign(this.componentData.menuNode.style, { display: "none" });
    this.componentData.isShow = false;
    clearInterval(this.componentData.fadeTimer);
  }
  // 自动发送信息
  msgAutoSend() {
    let sendButton = tools.getParentByIndex(this.componentData.lastTextarea, 3).querySelector(".input-group-btn button");
    sendButton.click();
  }
}

new chatQuickMsg();
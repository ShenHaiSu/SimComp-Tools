const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class chatHelper extends BaseComponent {
  constructor() {
    super();
    this.name = "聊天辅助";
    this.describe = "包括聊天室图片解析/聊天室快捷消息/emoji选择器/自定义表情发送等功能";
    this.enable = false;
    this.tagList = ["聊天", "样式"];
  }
  indexDBData = {
    quickMsgAutoSend: false, // 快捷消息自动发送?
    quickMsgList: [], // 快捷信息 [{alias:"别名",msg:"信息内容"}]
    // 发送间隔60*1000ms
    emojiFavList: [], // favEmoji列表 [{text:"",count:0}]
    customEmoteList: [], // 收藏的表情包 [""]
  }
  componentData = {
    emoteReg: /https:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/g, // 表情包正则匹配
    templateNode: undefined, // 模板元素
    menuNode: undefined, // 菜单元素
    lastTextarea: undefined, // 最近一次点击的按钮旁的输入框
    isShow: false, // 当前是否展示
    showTimer: undefined, // 取消显示倒计时
    emojiSelectAllNode: null, // emoji选择框所有emoji标签
    emojiSelectFavNode: null, // emoji选择框常用emoji标签
  }
  cssText = [
    `div.script_chatHelper_chatEmote_container{display:flex;width:100%;flex-wrap:wrap;}div.script_chatHelper_chatEmote_container img{flex:1 0 calc(20% - 10px);margin:5px;max-width:15%;max-height:15%;}div.script_chatHelper_chatEmote_container img.showBig{position:fixed;top:50%;left:50%;z-index:5000;transform:translate(-50%,-50%);max-width:95%;max-height:95%;}div.script_chatHelper_quickMsg_container{position:absolute;top:0;right:37px;height:55px;width:37px;}div.script_chatHelper_quickMsg_container>a>svg{display:block;width:100%;height:55px;}div[sct_cpt='chatHelper'][sct_id="baseContainer"]{height:200px;width:400px;position:absolute;transform:translate(-100%,-100%);background-color:#0000009f;border-radius:5px;padding:5px;}div[sct_cpt='chatHelper'][sct_id="baseContainer"]>[sct_id="menu"]{width:100%;height:150px;background-color:#ffffff30;overflow-y:auto;}div[sct_cpt='chatHelper']>[sct_id="menu"]>[sct_name="emoji"]{font-size:25px;}div[sct_cpt='chatHelper']>[sct_id="menu"]>[sct_name="emoji"]>[sct_name='allEmoji'],div[sct_cpt='chatHelper']>[sct_id="menu"]>[sct_name="emoji"]>[sct_name='favEmoji']{display:flex;flex-wrap:wrap;flex-direction:row;justify-content:flex-start;align-items:stretch;}div[sct_cpt='chatHelper']>[sct_id="menu"]>[sct_name="emoji"]>[sct_name='favEmoji']{margin-bottom:30px;}div[sct_cpt='chatHelper']>[sct_id="menu"]>[sct_name="emoji"]>[sct_name='allEmoji']>div,div[sct_cpt='chatHelper']>[sct_id="menu"]>[sct_name="emoji"]>[sct_name='favEmoji']>div{flex:1;min-width:40px;text-align:center;}div[sct_cpt='chatHelper']>[sct_id="menu"]>[sct_name="emoji"]>[sct_name='allEmoji']>div:hover,div[sct_cpt='chatHelper']>[sct_id="menu"]>[sct_name="emoji"]>[sct_name='favEmoji']>div:hover{cursor:pointer;}div[sct_cpt='chatHelper'][sct_id="baseContainer"]>[sct_id="tabBar"]{width:100%;height:38px;}div[sct_cpt='chatHelper'][sct_id="baseContainer"]>[sct_id="tabBar"]>[sct_id="tab"]{line-height:40px;font-size:25px;width:40px;height:100%;text-align:center;vertical-align:middle;transition:ease-in-out 0.2s;display:inline-block;}div[sct_cpt='chatHelper'][sct_id="baseContainer"]>[sct_id="tabBar"]>[sct_id="tab"].active{background-color:#ffffff30;}div[sct_cpt='chatHelper'][sct_id="baseContainer"]>[sct_id="tabBar"]>[sct_id="tab"]:hover{background-color:#ffffff70 !important;cursor:pointer;}div[sct_cpt='chatHelper'][sct_id="baseContainer"]>[sct_id="tabBar"]>[sct_id="tab"]>span>svg{width:100%;height:100%;}div[sct_cpt="chatHelper"][sct_id="submenu"][sct_name="customEmote"]>div[sct_name='addEmote']{background-color:#00000050;width:100%;height:0;display:flex;padding:0px;align-items:center;vertical-align:middle;text-align:left;transition:ease-in-out 0.2s;overflow:hidden;}div[sct_cpt="chatHelper"][sct_id="submenu"][sct_name="customEmote"]>div[sct_name='addEmote'].showBig{height:60px;padding:5px;}div[sct_cpt="chatHelper"][sct_id="submenu"][sct_name="customEmote"]>div[sct_name='addEmote']>input{flex:6;height:35px;margin-right:5px;}div[sct_cpt="chatHelper"][sct_id="submenu"][sct_name="customEmote"]>div[sct_name='addEmote']>button{display:inline-block;width:60px;flex:1;color:var(--fontColor);background-color:black;}div[sct_cpt="chatHelper"][sct_id="submenu"][sct_name="customEmote"]>div[sct_name='customEmoteAll']{display:flex;flex-direction:row;align-items:stretch;justify-content:flex-start;flex-wrap:wrap;}div[sct_cpt="chatHelper"][sct_id="submenu"][sct_name="customEmote"]>div[sct_name='customEmoteAll']>div{flex:1;width:20%;max-height:50px;min-width:15%;text-align:center;margin:10px 0;}div[sct_cpt="chatHelper"][sct_id="submenu"][sct_name="customEmote"]>div[sct_name='customEmoteAll']>div:nth-child(1)>span{display:block;width:100%;height:100%;}div[sct_cpt="chatHelper"][sct_id="submenu"][sct_name="customEmote"]>div[sct_name='customEmoteAll']>div>img{max-width:100%;max-height:100%;}div[sct_cpt='chatHelper'][sct_id='submenu'][sct_name="quickMsg"] button,div[sct_cpt='chatHelper'][sct_id='submenu'][sct_name="quickMsg"] input{color:var(--fontColor);background-color:#0000008e;}div[sct_cpt='chatHelper'][sct_id='submenu'][sct_name="quickMsg"]>div[sct_name='addQuickMsg']{margin:10px 5px;padding:5px;display:flex;flex-wrap:nowrap;justify-content:center;color:var(--fontColor);}div[sct_cpt='chatHelper'][sct_id='submenu'][sct_name="quickMsg"]>div[sct_name='addQuickMsg']>input{margin-right:10px;}div[sct_cpt='chatHelper'][sct_id='submenu'][sct_name="quickMsg"]>div[sct_name='quickMsgBase']{padding:5px;}div[sct_cpt='chatHelper'][sct_id='submenu'][sct_name="quickMsg"]>div[sct_name='quickMsgBase'] table{width:100%;border-collapse:separate;border-spacing:10px;}div[sct_cpt='chatHelper'][sct_id='submenu'][sct_name="quickMsg"]>div[sct_name='quickMsgBase'] table>tbody>tr>td:nth-child(1){width:75%;}div[sct_cpt='chatHelper'][sct_id='submenu'][sct_name="quickMsg"]>div[sct_name='quickMsgBase'] table>tbody>tr>td:nth-child(2){width:20%;}`,
  ]
  chatMsgFuncList = [this.chatEmoteCheck]
  startupFuncList = [this.addChatEmoteClick]
  commonFuncList = [{
    match: this.mountCheck,
    func: this.mountFunc
  }]

  // 添加聊天室表情包被点击的事件委派
  addChatEmoteClick() {
    document.body.addEventListener('click', event => {
      if (event.target.tagName !== "IMG") return;
      if (event.target.parentElement.tagName !== "DIV") return;
      if (!/script_chatHelper_chatEmote_container/.test(event.target.parentElement.className)) return;
      event.target.classList.toggle("showBig");
    })
  }
  // 挂载表情包图片预览
  chatEmoteCheck(mainNode, textList) {
    if (mainNode.querySelector("div.script_chatHelper_chatEmote_container")) return;
    if (mainNode.childNodes[0].tagName == "DIV") return;
    // console.log(mainNode.childNodes[0]);
    for (let i = 0; i < mainNode.childNodes[2].childNodes.length; i++) {
      let node = mainNode.childNodes[2].childNodes[i].childNodes[0];
      if (node.tagName == "I") node = mainNode.childNodes[2].childNodes[i].childNodes[1];
      let text = textList[i];
      let urlList = text.match(this.componentData.emoteReg);
      if (urlList === null) continue;
      let newNode = document.createElement("div");
      let htmlText = ``;
      for (let i = 0; i < urlList.length; i++) htmlText += `<img src='${urlList[i]}' />`
      newNode.className = "script_chatHelper_chatEmote_container";
      newNode.innerHTML = htmlText;
      node.appendChild(newNode);
    }
  }
  // 聊天辅助按钮挂载判断
  mountCheck(event) {
    if (!event || !/messages\/(.+)/.test(location.href)) return false;
    let textareaLength = document.querySelectorAll("div.input-group textarea").length;
    let quickButtonLength = document.querySelectorAll("div.input-group button.script_chatHelper_chatQuickMsg_button").length;
    return textareaLength != quickButtonLength;
  }
  // 聊天辅助按钮挂载
  mountFunc() {
    // 获取操作元素列表
    let textDivList = Object.values(document.querySelectorAll("div.input-group textarea"))
      .map(node => tools.getParentByIndex(node, 2))
      .filter(node => node.style.right != "77px");
    // 查询与构建模板元素
    if (!this.componentData.templateNode) {
      let newNode = document.createElement("div");
      newNode.className = "script_chatHelper_quickMsg_container";
      newNode.innerHTML = `<a><svg style=display:block;width:100%;height:55px viewBox="0 0 24 24"xmlns=http://www.w3.org/2000/svg><path d="M8 22.5v-5.525q-2.525-.2-4.262-2.05T2 10.5q0-2.725 1.888-4.612T8.5 4h.675L7.6 2.4L9 1l4 4l-4 4l-1.4-1.4L9.175 6H8.5Q6.625 6 5.313 7.313T4 10.5q0 1.875 1.313 3.188T8.5 15H10v2.675L12.675 15H15.5q1.875 0 3.188-1.312T20 10.5q0-1.875-1.312-3.187T15.5 6H15V4h.5q2.725 0 4.613 1.888T22 10.5q0 2.725-1.888 4.613T15.5 17h-2z"fill=currentColor></path></svg></a>`;
      this.componentData.templateNode = newNode;
    }
    // 修改样式
    for (let i = 0; i < textDivList.length; i++) {
      textDivList[i].style.right = "77px";
      let newNode = this.componentData.templateNode.cloneNode(true);
      newNode.addEventListener("click", (event) => this.helperButtonClick(event));
      tools.getParentByIndex(textDivList[i], 1).insertBefore(newNode, textDivList[i].nextElementSibling);
    }
  }
  // 辅助菜单按钮被点击
  helperButtonClick(event) {
    event.preventDefault(); // 阻止默认事件
    event.stopPropagation(); // 阻止事件冒泡
    // 查询和构建基础菜单
    if (!this.componentData.menuNode) this.buildBaseNode();
    if (this.componentData.showTimer) clearTimeout(this.componentData.showTimer);
    // 捕获textArea
    let deepLength = 1;
    let nowTextarea = null;
    while (!Boolean(nowTextarea)) nowTextarea = tools.getParentByIndex(event.target, deepLength++).querySelector("textarea");
    // 对比取消显示
    if (tools.clientHorV == 0) Object.assign(this.componentData.menuNode.style, { display: "block", top: `${event.clientY - 10}px`, left: `${event.clientX - 10}px` });
    if (tools.clientHorV == 1) Object.assign(this.componentData.menuNode.style, { display: "block", top: `${event.clientY - 10}px`, right: "10px", width: "360px", zIndex: 2000, transform: "translate(0,-100%)" });
    if (this.componentData.lastTextarea == nowTextarea && this.componentData.isShow) {
      Object.assign(this.componentData.menuNode.style, { display: "none" });
      this.componentData.isShow = false;
    } else {
      this.componentData.lastTextarea = nowTextarea;
      this.componentData.isShow = true;
      this.componentData.showTimer = setTimeout(() => this.closeContainer(), 10 * 1000);
    }
  }
  // html构建 - 基础菜单框
  buildBaseNode() {
    let newNode = document.createElement("div");
    newNode.setAttribute("sct_cpt", "chatHelper");
    newNode.setAttribute("sct_id", "baseContainer");
    let htmlText = `<div sct_cpt=chatHelper sct_id=menu><div sct_cpt=chatHelper sct_id=submenu sct_name=emoji></div><div sct_cpt=chatHelper sct_id=submenu sct_name=customEmote></div><div sct_cpt=chatHelper sct_id=submenu sct_name=quickMsg></div></div><div sct_cpt=chatHelper sct_id=tabBar><div sct_cpt=chatHelper sct_id=tab sct_name=emoji><span>😊</span></div><div sct_cpt=chatHelper sct_id=tab sct_name=customEmote><span><svg viewBox="0 0 24 24"xmlns=http://www.w3.org/2000/svg><path d="M19.071 13.142L13.414 18.8a2 2 0 0 1-2.828 0l-5.657-5.657A5 5 0 1 1 12 6.072a5 5 0 0 1 7.071 7.07"fill=none stroke=#EF3939 stroke-linecap=round stroke-linejoin=round stroke-width=2.5 /></svg></span></div><div sct_cpt=chatHelper sct_id=tab sct_name=quickMsg><span><svg viewBox="0 0 12 12"xmlns=http://www.w3.org/2000/svg><path d="M4 5.5a.5.5 0 0 1 .5-.5h3a.5.5 0 1 1 0 1h-3a.5.5 0 0 1-.5-.5M4.5 7a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1zM1 6a5 5 0 1 1 2.59 4.382l-1.944.592a.5.5 0 0 1-.624-.624l.592-1.947A4.98 4.98 0 0 1 1 6m5-4a4 4 0 0 0-3.417 6.08a.5.5 0 0 1 .051.406l-.383 1.259l1.257-.383a.5.5 0 0 1 .407.052A4 4 0 1 0 6 2"fill=#58A8CF /></svg></span></div></div>`;
    newNode.innerHTML = htmlText;
    newNode.addEventListener('click', event => this.mainMenuClick(event));
    this.componentData.menuNode = newNode;
    document.body.appendChild(newNode);
    // 子菜单构建
    this.buildEmojiSelectorNode();
    this.buildCustomEmoteNode();
    this.buildQuickMsgNode();
    // 初始化点击
    newNode.querySelector("div[sct_name='emoji'][sct_id='tab']").firstChild.click();
  }
  // html构建 - emoji选择框 分为常用和所有两部分
  buildEmojiSelectorNode() {
    let target = this.componentData.menuNode.querySelector(`div[sct_id="submenu"][sct_name="emoji"]`);
    target.innerHTML = "";
    target.style.display = "none";
    target.appendChild(this.buildFavEmojiSelectorAllNode());
    target.appendChild(this.buildEmojiSelectorAllNode());
    target.addEventListener('click', e => {
      if (e.target.innerText.length > 2 || e.target.innerText.length == 0) return;
      // console.log(e.target.innerText);
      this.textareaAdd(e.target.innerText);
      let index = this.indexDBData.emojiFavList.findIndex(item => item.text == e.target.innerText);
      if (index == -1) {
        this.indexDBData.emojiFavList.push({ text: e.target.innerText, count: 1 });
      } else {
        this.indexDBData.emojiFavList[index].count++;
      }
      this.componentData.menuNode.querySelector(`div[sct_name="favEmoji"]`)?.remove();
      target.prepend(this.buildFavEmojiSelectorAllNode());
      tools.indexDB_updateIndexDBData();
    });
  }
  // html构建 - 收藏表情包 分为添加和展示两部分
  buildCustomEmoteNode() {
    let target = this.componentData.menuNode.querySelector(`div[sct_id="submenu"][sct_name="customEmote"]`);
    // 添加新表情
    let addNode = document.createElement("div");
    addNode.setAttribute("sct_cpt", "chatHelper");
    addNode.setAttribute("sct_name", "addEmote");
    addNode.innerHTML = `<input><button class="btn form-control">添加</button>`;
    target.appendChild(addNode);
    // 展示所有表情
    target.appendChild(this.buildCustomEmoteAllNode());
    target.addEventListener('click', e => this.customEmoteClick(e));
    target.addEventListener("contextmenu", e => this.deleteCustomEmote(e));
  }
  // html构建 - 快捷消息 分为点击应用和添加两部分
  buildQuickMsgNode() {
    let target = this.componentData.menuNode.querySelector(`div[sct_id="submenu"][sct_name="quickMsg"]`);
    // 添加节点
    let addNode = document.createElement("div");
    addNode.setAttribute("sct_cpt", "chatHelper");
    addNode.setAttribute("sct_name", "addQuickMsg");
    addNode.innerHTML = `<input style='text-align: left;' type="text" placeholder="别名" class='form-control' sct_name="alias" ><input style='text-align: left;' type="text" placeholder="内容" class='form-control' sct_name="content"><button sct_name="submit" class='form-control'>添加</button>`;
    target.appendChild(addNode);
    addNode.addEventListener('click', event => this.addQuickMsg(event));
    // 展示节点
    target.appendChild(this.buildQuickMsgAllNode());
  }
  // html构建 - favEmoji选择框 
  buildFavEmojiSelectorAllNode() {
    let newNode = document.createElement("div");
    let htmlText = ``;
    this.indexDBData.emojiFavList.sort((o1, o2) => o2.count - o1.count);
    for (let i = 0; i < this.indexDBData.emojiFavList.length; i++) {
      let emojiObj = this.indexDBData.emojiFavList[i];
      htmlText += `<div><span>${emojiObj.text}</span></div>`
    }
    newNode.setAttribute("sct_name", "favEmoji");
    newNode.innerHTML = htmlText;
    return newNode;
  }
  // html构建 - emoji所有选择框
  buildEmojiSelectorAllNode() {
    if (this.componentData.emojiSelectAllNode) return this.componentData.emojiSelectAllNode;
    let newNode = document.createElement("div");
    let htmltext = "";
    for (let codePoint = 0x1F300; codePoint <= 0x1F9EF; codePoint++) {
      let spanContent = String.fromCodePoint(codePoint);
      htmltext += `<div><span>${spanContent}</span></div>`;
    }
    newNode.innerHTML = htmltext;
    newNode.setAttribute("sct_name", "allEmoji");
    this.componentData.emojiSelectAllNode = newNode;
    return this.componentData.emojiSelectAllNode;
  }
  // html构建 - 展示自定义收藏表情
  buildCustomEmoteAllNode() {
    let newNode = document.createElement("div");
    let htmlText = `<div><span><svg height=50 viewBox="0 0 24 24" xmlns=http://www.w3.org/2000/svg><path clip-rule=evenodd d="M7.345 4.017a42.253 42.253 0 0 1 9.31 0c1.713.192 3.095 1.541 3.296 3.26a40.66 40.66 0 0 1 0 9.446c-.201 1.719-1.583 3.068-3.296 3.26a42.245 42.245 0 0 1-9.31 0c-1.713-.192-3.095-1.541-3.296-3.26a40.652 40.652 0 0 1 0-9.445a3.734 3.734 0 0 1 3.295-3.26M12 7.007a.75.75 0 0 1 .75.75v3.493h3.493a.75.75 0 1 1 0 1.5H12.75v3.493a.75.75 0 0 1-1.5 0V12.75H7.757a.75.75 0 0 1 0-1.5h3.493V7.757a.75.75 0 0 1 .75-.75"fill=currentColor fill-rule=evenodd /></svg></span></div>`;
    newNode.setAttribute("sct_cpt", "chatHelper");
    newNode.setAttribute("sct_name", "customEmoteAll");
    for (let i = 0; i < this.indexDBData.customEmoteList.length; i++) {
      let imgUrl = this.indexDBData.customEmoteList[i];
      htmlText += `<div sct_index='${i}'><img src='${imgUrl}'/></div>`;
    }
    newNode.innerHTML = htmlText;
    return newNode;
  }
  // html构建 - 展示所有快捷消息
  buildQuickMsgAllNode() {
    let newNode = document.createElement("div");
    let htmlText = `<table><tbody>`;
    newNode.setAttribute("sct_cpt", "chatHelper");
    newNode.setAttribute("sct_name", "quickMsgBase");
    for (let i = 0; i < this.indexDBData.quickMsgList.length; i++) {
      let element = this.indexDBData.quickMsgList[i];
      htmlText += `<tr><td><button class='form-control' sct_index='${i}'>${element.alias}</button></td><td><button class='form-control'>删除</button></td></tr>`
    }
    htmlText += `</tbody></table>`;
    newNode.innerHTML = htmlText;
    // 绑定事件
    newNode.addEventListener("click", e => this.quickMsgClick(e));
    return newNode;
  }
  // 基础菜单被点击
  mainMenuClick(event) {
    // 更新显示时间
    if (this.componentData.showTimer) clearTimeout(this.componentData.showTimer);
    this.componentData.showTimer = setTimeout(() => this.closeContainer(), 10 * 1000);
    // 获取点击元素
    let deepCount = 1;
    let target = null;
    try {
      while (deepCount <= 3 && !Boolean(target)) {
        target = tools.getParentByIndex(event.target, deepCount++);
        if (target && target.getAttribute("sct_id") == "tab") break;
        target = null;
      }
    } catch { target = null }
    if (!Boolean(target)) return;
    let clickName = target.getAttribute("sct_name");
    // 更新上方选择框
    document
      .querySelectorAll("div[sct_cpt='chatHelper'][sct_id='menu']>div")
      .forEach(node => node.style.display = "none");
    document
      .querySelector(`div[sct_cpt='chatHelper'][sct_id='menu']>div[sct_name='${clickName}']`)
      .style.display = "";
    // 更新兄弟元素与自己的class
    target.parentElement
      .querySelectorAll("div[sct_id='tab']")
      .forEach(node => node.className = "");
    target.className = "active";
  }
  // 收藏表情包被点击
  customEmoteClick(event) {
    let target = event.target;
    if (/path|svg|span/i.test(target.tagName)) return document.querySelector("div[sct_cpt='chatHelper'][sct_name='addEmote']").classList.toggle("showBig");
    if (/button/i.test(target.tagName)) return this.addCustomEmote(event);
    if (target.tagName == "IMG" && target.parentElement.getAttribute("sct_index")) {
      this.textareaAdd(" " + this.indexDBData.customEmoteList[target.parentElement.getAttribute("sct_index")] + " ");
      this.closeContainer();
    } else if (target.tagName == "DIV" && target.getAttribute("sct_index")) {
      this.textareaAdd(" " + this.indexDBData.customEmoteList[target.getAttribute("sct_index")] + " ");
      this.closeContainer();
    }
  }
  // 删除表情包 
  deleteCustomEmote(event) {
    event.preventDefault();
    let target = event.target;
    let index = -1;
    if (target.tagName == "IMG" && target.parentElement.getAttribute("sct_index")) {
      index = target.parentElement.getAttribute("sct_index");
    } else if (target.tagName == "DIV" && target.getAttribute("sct_index")) {
      index = target.getAttribute("sct_index");
    }
    if (index == -1 || index == null) return;
    this.indexDBData.customEmoteList.splice(index, 1);
    tools.indexDB_updateIndexDBData();
    document.querySelector(`div[sct_cpt="chatHelper"][sct_name="customEmoteAll"]`)?.remove();
    this.componentData.menuNode.querySelector(`div[sct_id="submenu"][sct_name="customEmote"]`).appendChild(this.buildCustomEmoteAllNode());
  }
  // 添加收藏表情包
  addCustomEmote(event) {
    let value = event.target.previousElementSibling.value;
    // console.log(value);
    // 审查
    if (!this.componentData.emoteReg.test(value)) return tools.alert("输入的网址不符合https,或者不符合网络图片后缀名结尾,请修改.");
    if (this.indexDBData.customEmoteList.some(item => item == value)) return tools.alert("这个表情包已有");
    // 添加并刷新构建
    this.indexDBData.customEmoteList.push(value);
    document.querySelector(`div[sct_cpt="chatHelper"][sct_name="customEmoteAll"]`)?.remove();
    this.componentData.menuNode.querySelector(`div[sct_id="submenu"][sct_name="customEmote"]`).appendChild(this.buildCustomEmoteAllNode());
    tools.indexDB_updateIndexDBData();
    // 关闭显示
    event.target.previousElementSibling.value = "";
    event.target.parentElement.classList.toggle("showBig");
    return;
  }
  // 添加新的快捷消息
  addQuickMsg(event) {
    // 筛选事件
    if (event.target.tagName != "BUTTON") return;
    // 获取参数
    let valueList = Object.values(event.target.parentElement.querySelectorAll("input")).map(node => node.value);
    // 审查
    if (valueList.some(value => value == "")) return tools.alert("不能为空");
    if (this.indexDBData.quickMsgList.some(obj => obj.alias == valueList[0])) return tools.alert("别名被占用");
    // 添加并刷新
    this.indexDBData.quickMsgList.push({ alias: valueList[0], msg: valueList[1] });
    tools.indexDB_updateIndexDBData();
    this.freshQuickMsgBuild();
    // 重置內容
    event.target.parentElement.querySelectorAll("input").forEach(node => node.value = "");
  }
  // 删除以及使用快捷消息
  quickMsgClick(event) {
    if (event.target.tagName !== "BUTTON") return;
    let index = event.target.getAttribute("sct_index");
    if (index == null) {
      // 删除这条消息
      index = tools.getParentByIndex(event.target, 2).querySelector("button[sct_index]").getAttribute("sct_index");
      this.indexDBData.quickMsgList.splice(index, 1);
      this.freshQuickMsgBuild();
      tools.indexDB_updateIndexDBData();
    } else {
      // 使用快捷消息
      this.textareaAdd(this.indexDBData.quickMsgList[index].msg.replace("\\n", "\n"));
      this.closeContainer();
    }
  }

  // 工具函数
  textareaAdd(text) {
    if (!this.componentData.lastTextarea) return;
    this.componentData.lastTextarea.click();
    let nowValue = this.componentData.lastTextarea.value;
    // console.log(`${nowValue}${text}`);
    tools.setInput(this.componentData.lastTextarea, `${nowValue}${text}`);
  }
  closeContainer() {
    this.componentData.isShow = false;
    this.componentData.menuNode.style.display = "none";
  }
  freshQuickMsgBuild() {
    let target = this.componentData.menuNode.querySelector(`div[sct_id="submenu"][sct_name="quickMsg"]`);
    target.querySelector(`[sct_name="quickMsgBase"]`).remove();
    target.appendChild(this.buildQuickMsgAllNode());
  }
}
new chatHelper();
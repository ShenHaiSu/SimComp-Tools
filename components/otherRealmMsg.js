const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 待处理信息显示
class otherRealmMsg extends BaseComponent {
  constructor() {
    super();
    this.name = "待处理信息显示";
    this.describe = "用于修复手机上不显示别的服务器的待处理信息量,默认不启动"
    this.enable = false;
    this.tagList = ['样式','信息'];
  }
  componentData = {
    baseURL: "https://www.simcompanies.com/api/v3/contracts-incoming",
    baseWS: "wss://www.simcompanies.com/ws",
    containerNode: undefined, // 容器对象
  }
  startupFuncList = [
    this.startupMsgCheck
  ]
  cssText = [`div#script_unreadMsg {display:none;position:relative;left:5px;top:4px;}`]
  async startupMsgCheck(window, count = 0) {
    if (location.href.match(/zh\/$/) || runtimeData.basisCPT.realm == undefined) return setTimeout(() => { this.startupMsgCheck(undefined, 0) }, 5000);
    if (count == 0) return setTimeout(() => { this.startupMsgCheck(undefined, ++count) }, 5000);
    let realm = runtimeData.basisCPT.realm;
    // 隐藏原有图标
    try {
      let tampNode = document.querySelector(".navbar-container svg.fa-message>path");
      if (!tampNode) tampNode = document.querySelector(".navbar-container svg.fa-file-signature>path");
      tools.getParentByIndex(tampNode, 4).style.display = "none";
    } catch (error) {
      if (count < 3) {
        tools.errorLog(error);
        return setTimeout(() => { this.startupMsgCheck(undefined, ++count) }, 5000);
      }
      tools.msg_send("待处理信息显示", "组件已连续两次次无法捕获官方原有的信息提示,尝试强制添加.", 1);
    }
    // 构建图标
    let containerNode = document.createElement("div");
    containerNode.id = "script_unreadMsg";
    containerNode.innerHTML = `<div><svg aria-hidden=true class="css-0 svg-inline--fa fa-file-signature"data-icon=file-signature data-prefix=fas focusable=false role=img viewBox="0 0 576 512"xmlns=http://www.w3.org/2000/svg><path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V428.7c-2.7 1.1-5.4 2-8.2 2.7l-60.1 15c-3 .7-6 1.2-9 1.4c-.9 .1-1.8 .2-2.7 .2H240c-6.1 0-11.6-3.4-14.3-8.8l-8.8-17.7c-1.7-3.4-5.1-5.5-8.8-5.5s-7.2 2.1-8.8 5.5l-8.8 17.7c-2.9 5.9-9.2 9.4-15.7 8.8s-12.1-5.1-13.9-11.3L144 381l-9.8 32.8c-6.1 20.3-24.8 34.2-46 34.2H80c-8.8 0-16-7.2-16-16s7.2-16 16-16h8.2c7.1 0 13.3-4.6 15.3-11.4l14.9-49.5c3.4-11.3 13.8-19.1 25.6-19.1s22.2 7.8 25.6 19.1l11.6 38.6c7.4-6.2 16.8-9.7 26.8-9.7c15.9 0 30.4 9 37.5 23.2l4.4 8.8h8.9c-3.1-8.8-3.7-18.4-1.4-27.8l15-60.1c2.8-11.3 8.6-21.5 16.8-29.7L384 203.6V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM549.8 139.7c-15.6-15.6-40.9-15.6-56.6 0l-29.4 29.4 71 71 29.4-29.4c15.6-15.6 15.6-40.9 0-56.6l-14.4-14.4zM311.9 321c-4.1 4.1-7 9.2-8.4 14.9l-15 60.1c-1.4 5.5 .2 11.2 4.2 15.2s9.7 5.6 15.2 4.2l60.1-15c5.6-1.4 10.8-4.3 14.9-8.4L512.1 262.7l-71-71L311.9 321z"fill=currentColor></path></svg> <span>&nbsp;###CONTRACT###</span></div><div><svg aria-hidden=true class="css-0 svg-inline--fa fa-message"data-icon=message data-prefix=fas focusable=false role=img viewBox="0 0 512 512"xmlns=http://www.w3.org/2000/svg><path d="M64 0C28.7 0 0 28.7 0 64V352c0 35.3 28.7 64 64 64h96v80c0 6.1 3.4 11.6 8.8 14.3s11.9 2.1 16.8-1.5L309.3 416H448c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H64z"fill=currentColor></path></svg> <span>&nbsp;###MSG###</span></div>`;
    let targetNode = tools.getParentByIndex(document.querySelectorAll("div.navbar-container div>img")[0], 3);
    this.componentData.containerNode = containerNode;
    // 挂载标签
    targetNode.insertAdjacentElement("afterend", containerNode);
    // 获取合同数据数据
    let contractUnread, msgUnread;
    let netData = await tools.getNetData(`${this.componentData.baseURL}/${realm}/me/#${await tools.generateUUID()}`);
    if (!netData) return tools.errorLog(netData);
    if (netData.incomingContractsOtherRealms.length == 0) {
      contractUnread = 0;
    } else if (netData.incomingContractsOtherRealms[0].incoming) {
      contractUnread = netData.incomingContractsOtherRealms[0].incoming;
    }
    containerNode.innerHTML = containerNode.innerHTML.replace("###CONTRACT###", contractUnread);
    // 获取未读消息数据
    let socket = new WebSocket(this.componentData.baseWS);
    socket.onopen = () => {
      tools.log("连接至聊天室频道,等待信息中.");
      socket.send(JSON.stringify({ routing: "RESYNC_AFTER_RECONNECT", data: [] }));
    };
    socket.onmessage = (event) => {
      let msg = JSON.parse(event.data);
      if (msg.routing != "GROUP") return;
      if (msg.messages.length == 0) return socket.close();
      for (let i = 0; i < msg.messages.length; i++) {
        let message = msg.messages[i];
        if (message.routing != "UNREAD_MESSAGES") continue;
        if (message.data.unreadMessagesOtherRealms.length == 0) continue;
        tools.log(message);
        msgUnread = message.data.unreadMessagesOtherRealms[0].unread;
      }
      containerNode.innerHTML = containerNode.innerHTML.replace("###MSG###", msgUnread || 0);
      this.showContainer();
      return socket.close();
    }
  }
  showContainer() {
    this.componentData.containerNode.style.display = "inline-block";
  }
}
new otherRealmMsg();
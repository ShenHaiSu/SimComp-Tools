const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class chatEmote extends BaseComponent {
  constructor() {
    super();
    this.name = "聊天室表情包加载";
    this.describe = "捕获聊天信息中的图片url 自动在信息后追加img";
    this.enable = false;
  }
  indexDBData = {
    reg: /https:\/\/[^\s]+\.(jpg|jpeg|png|gif)/g, // 使用的正则表达式
  }
  chatMsgFuncList = [this.mainCheck]
  startupFuncList = [this.addClickEvent]
  cssText = [`div.script_chatEmote_container{display:flex;width:100%;flex-wrap:wrap;}div.script_chatEmote_container img{flex:1 0 calc(20% - 10px);margin:5px;max-width:15%;max-height:15%;}div.script_chatEmote_container img.showBig{position:fixed;top:50%;left:50%;z-index:5000;transform:translate(-50%,-50%);max-width:95%;max-height:95%;}div#script_chatEmote_setting textarea{background-color:rgb(34,34,34);text-align:center;resize:none;width:90%;height:150px;}`]

  settingUI = () => {
    let newNode = document.createElement("div");
    let htmlText = `<div class=header>聊天室表情包加载设置</div><div class=container><div><div><button class="btn script_opt_submit">保存</button></div></div><table><thead><tr><td>功能<td>设置<tbody><tr><td title=请自行查阅JavaScript正则表达式语法>正则匹配式<td><textarea></textarea></table></div>`;
    newNode.id = "script_chatEmote_setting";
    newNode.innerHTML = htmlText;
    newNode.querySelector("textarea").value = `/${this.indexDBData.reg.source}/${this.indexDBData.reg.flags}`;
    newNode.addEventListener('click',event => this.settingClick(event));
    return newNode;
  }
  settingClick(event) {
    if (/script_opt_submit/.test(event.target.className)) return this.settingSubmit();
  }
  settingSubmit(){
    let valueList = Object.values(document.querySelectorAll("#script_chatEmote_setting textarea")).map(node => node.value);
    // 审查
    if (!valueList[0].startsWith("/")) return tools.alert("请使用JavaScript正则表达式的正确表达");
    if (!/\/[img]*$/.test(valueList[0])) return tools.alert("请使用JavaScript正则表达式的正确结尾");
    // 生成结果
    let body = valueList[0].replace(/^\//,"").replace(/\/[img]*$/,"");
    let flag = valueList[0].match(/\/([img])*$/)[1];
    // 保存
    this.indexDBData.reg = new RegExp(body,flag);
    tools.indexDB_updateIndexDBData();
    tools.alert("保存");
  }

  addClickEvent() {
    document.body.addEventListener('click', event => {
      if (event.target.tagName !== "IMG") return;
      if (event.target.parentElement.tagName !== "DIV") return;
      if (!/script_chatEmote_container/.test(event.target.parentElement.className)) return;
      event.target.classList.toggle("showBig");
    })
  }

  mainCheck(mainNode, textList) {
    if (mainNode.querySelector("div.script_chatEmote_container")) return;
    for (let i = 0; i < mainNode.childNodes[2].childNodes.length; i++) {
      let node = mainNode.childNodes[2].childNodes[i].childNodes[0];
      let text = textList[i];
      let urlList = text.match(this.indexDBData.reg);
      if (urlList === null) continue;
      let newNode = document.createElement("div");
      let htmlText = ``;
      for (let i = 0; i < urlList.length; i++) htmlText += `<img src='${urlList[i]}' />`
      newNode.className = "script_chatEmote_container";
      newNode.innerHTML = htmlText;
      node.appendChild(newNode);
    }
  }
}

new chatEmote();
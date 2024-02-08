const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 自定义背景图片
class customBackgroundImage extends BaseComponent {
  constructor() {
    super();
    this.name = "自定义背景图片";
    this.describe = "在设置界面输入背景图片网址或者在代码中编辑\n请自己注意图片的可访问性";
    this.enable = true;
    this.tagList = ['个性化'];
  }
  componentData = {
    styleNode: undefined, // 临时style节点
  }
  startupFuncList = [
    this.mainFunc
  ];
  indexDBData = {
    cssText: "", // 背景数据存储位置
  };
  settingUI = () => {
    // 创建并挂载
    let mainSetNode = document.createElement("div");
    let htmlText = `<div><div class="header">自定义背景图片设置</div><div class=container><div><div><button class="btn script_opt_submit">保存</button></div></div><table><tr style=height:60px><td>功能<td>设置<tr style=height:120px><td title=请注意被访问地址的开放性>背景CSS内容<td><textarea style=background-color:rgb(34,34,34);min-width:60px;min-height:120px;max-height:125px;text-align:center;max-width:257px;height:154px;width:313px></textarea></table></div></div>`;
    mainSetNode.innerHTML = htmlText;
    mainSetNode.id = "setting-container-4";
    mainSetNode.className = "col-sm-12 setting-container"
    mainSetNode.querySelector("textarea").value = this.indexDBData.cssText;

    // 绑定按钮事件
    mainSetNode.querySelector("button.script_opt_submit").addEventListener("click", () => this.settingSubmitHandle());

    // 返回构建
    return mainSetNode;
  }
  settingSubmitHandle() {
    let itemValue = document.querySelector("div#setting-container-4 textarea").value;
    let url_reg = /^https:\/\/[\w.-]+\.[a-zA-Z]{2,}/;
    let color_reg = tools.hexArgbCheck(itemValue);

    if (itemValue == "" || color_reg) {
      this.indexDBData.cssText = itemValue;
    } else if (url_reg.test(itemValue)) {
      this.indexDBData.cssText = `url(${itemValue})`;
    } else {
      return tools.alert("内容不正确，允许以下类型的内容：\n  #121212\n  rgb(1,1,35)\n  https://image.url");
    }
    tools.indexDB_updateIndexDBData();
    this.mainFunc();
    tools.alert("更改已提交");
  }
  mainFunc() {
    // 删除已有挂载
    let nowNode = document.querySelector("style[sct_cpt='customBackgroundImage']");
    if (nowNode) nowNode.remove();

    // 构建新节点
    if (this.indexDBData.cssText == "") return;
    let newNode = document.createElement("style");
    newNode.setAttribute("sct_cpt", "customBackgroundImage");
    newNode.setAttribute("type", "text/css");
    newNode.textContent = `div#root div#page>div {
  background: ${this.indexDBData.cssText} no-repeat center top !important;
  background-size: cover !important;
}`;
    this.componentData.styleNode = newNode;

    // 挂载节点
    document.head.appendChild(this.componentData.styleNode);
  }
}
new customBackgroundImage();
const BaseComponent = require("../tools/baseComponent.js");
const {tools, componentList, runtimeData, indexDBData, feature_config} = require("../tools/tools.js");

// 一键收菜组件
class clickHarvest extends BaseComponent {
  constructor() {
    super()
    this.name = "一键收菜";
    this.describe = "组件包括了一键收菜的功能，在地图主页面点击收取按钮可以完成一键收菜"
    this.enable = false;
    this.tagList = ['快捷'];
  }

  commonFuncList = [{
    match: event => Boolean(location.href.match(/landscape\/$/)),
    func: this.createBtn
  }, {
    match: event => !Boolean(location.href.match(/landscape\/$/)),
    func: this.hideBtn
  }];
  startupFuncList = [
    this.userWarnFunc, // 用户安全警告提醒
  ];
  indexDBData = {
    buttonText: "一键收菜",
    nodePosition: 0, // 0 右上角 1 左上角 2 中间悬浮
  };
  componentData = {
    btnNode: undefined
  };
  cssText = [
    `#Script_oneClickHarvest_Btn {color:var(--fontColor); margin:0 5px; background-color:rgb(51,51,51); width:auto;} button#Script_oneClickHarvest_Btn.fixedDisplay {position:fixed;  left:50%; bottom:80px; transform:translateX(-50%); min-height:40px; min-width:65px; box-shadow: 0 0 20px 1px white; z-index:1040; opacity:0.4;}`
  ];
  settingUI = this.uisetting;

  // 创建按钮标签
  createBtn(event) {
    // 检查btn存在Script_oneClickHarvest_Btn
    let buttonNode = document.querySelector("#Script_oneClickHarvest_Btn");
    if (buttonNode) {
      buttonNode.style.display = "block";
      return;
    }
    // 检查内存中是否存在
    if (this.componentData.btnNode === undefined) {
      let newNode = document.createElement("button");
      newNode.innerText = this.indexDBData.buttonText;
      newNode.id = "Script_oneClickHarvest_Btn";
      newNode.className = "btn";
      this.componentData.btnNode = newNode;
      this.componentData.btnNode.addEventListener("click", this.btnClickHandle);
    }

    if (this.indexDBData.nodePosition === 0) {
      // 挂载右上角
      document.querySelector(".navbar-container").appendChild(this.componentData.btnNode);
    } else if (this.indexDBData.nodePosition === 1) {
      // 挂载左上角
      let parentElement = document.querySelector(".navbar-container");
      parentElement.insertBefore(this.componentData.btnNode, parentElement.children[1]);
    } else if (this.indexDBData.nodePosition === 2) {
      // 悬浮挂载
      this.componentData.btnNode.className = "btn fixedDisplay";
      document.body.appendChild(this.componentData.btnNode);
    }
  }

  // 按钮点击处理函数
  btnClickHandle() {
    // 如果不在对应界面，就删除挂载的元素。
    if (!Boolean(location.href.match(/landscape\/$/))) {
      return document.querySelector("#Script_oneClickHarvest_Btn").remove();
    }
    // 获取节点并过滤
    const nodeList = Object.values(document.querySelectorAll("div > div > div > a"))
      .filter(node => !node.className.match("headquarter")) // 排除总部建筑
      .filter(node => Object.values(node.querySelectorAll("img")).length === 4) // 排除没有四个图像的节点

    // 遍历节点并点击
    for (let i = 0; i < nodeList.length; i++) {
      nodeList[i].click();
    }

    // 发送消息
    tools.msg_send("一键收取", "完成收取啦!", 1);
  }

  // 删除按钮标签
  clearBtn() {
    let node = document.querySelector("#Script_oneClickHarvest_Btn");
    if (!node) return;
    node.remove();
    this.componentData.btnNode = undefined;
  }

  // 隐藏按钮标签
  hideBtn() {
    let node = document.querySelector("#Script_oneClickHarvest_Btn");
    if (!node) return;
    Object.assign(node.style, {display: "none"});
  }

  // 设置界面
  uisetting() {
    let mainNode = document.createElement("div");
    let htmlText = `<div class="col-sm-12 setting-container" id="script_setting_clickHarvest"><div><div class='header'>一键收菜设置</div><div class='container'><div><div><button class="btn script_opt_submit">保存</button></div></div><table><tr style=height:60px><td>功能<td>设置<tr><td title=在这里设置按钮的文本内容>按钮内容文本<td><input class='form-control' style='text-align:center;' value=####><tr><td title="0.右上角 - 在头像右边  \n1.左上角 - 在领域服务器标左边  \n2.悬浮 - 在地图正下方，底栏上方">按钮位置<td><select class='form-control' value=####><option value=0>右上角<option value=1>左上角<option value=2>悬浮</select></table></div></div></div>`;
    htmlText = htmlText.replace("####", this.indexDBData.buttonText);
    htmlText = htmlText.replace("####", this.indexDBData.nodePosition.toString());
    mainNode.innerHTML = htmlText;
    mainNode.querySelector("select").value = this.indexDBData.nodePosition;
    mainNode.querySelector("button.script_opt_submit").addEventListener("click", () => this.settingSubmitHandle());
    return mainNode;
  }

  // 设置界面提交按钮处理函数
  settingSubmitHandle() {
    let valueList = [
      document.querySelector("#script_setting_clickHarvest input").value.toString(),
      parseInt(document.querySelector("#script_setting_clickHarvest select").value)
    ];
    tools.log("一键收菜设置设置更新", valueList);
    this.indexDBData.buttonText = valueList[0] === "" ? "一键收取" : valueList[0];
    this.indexDBData.nodePosition = valueList[1];
    tools.indexDB_updateIndexDBData();
    this.clearBtn();
    tools.alert("已提交更新");
    return;
  }

  // 用户安全警告提醒
  userWarnFunc() {
    tools.msg_send("一键收菜", "该组件在2024年8月25日前后由协管“KINGMAK3R”明确认定为违规功能，此组件的默认开关已改为关闭状态，开启后注意账号风险，插件开发者不承担任何责任。", 1);
    tools.msg_send("一键收菜", "该组件的其他实现方式正在开发中，也欢迎在Github页面提交建议或者Pull Request。", 1);
  }
}

new clickHarvest();
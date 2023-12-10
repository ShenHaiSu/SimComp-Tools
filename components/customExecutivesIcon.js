const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class customExecutivesIcon extends BaseComponent {
  constructor() {
    super();
    this.name = "自定义高管头像";
    this.describe = "在公司高管页面/被挖角页面/公司主页面/百科页面/科研页面将指定公司高管的头像替换."
    this.enable = true;
  }
  indexDBData = {
    executivesIconList: [{ name: "testA", icon: "https://null.de" }], // 高管自定义头像列表 {name:"asdasd",icon:"https://ss"}
    useDefault: false, // 是否使用默认遮罩
  }
  componentData = {
    defaultIcon: undefined, // 默认遮蔽
  }
  commonFuncList = [{
    match: () => true,
    func: this.mainCheck
  }]
  startupFuncList = [
    this.initDefaultIcon
  ]

  // 前台方法
  frontUI = () => this.mainCheck();
  // 设置方法
  settingUI = () => {
    let newNode = document.createElement("div");
    let htmlText = `<div class="header">自定义高管头像设置界面</div><div class="container"><div><div><button class="btn script_opt_submit">保存</button></div></div><div><table><thead><tr><td>功能</td><td>设置</td></tr></thead><tbody><tr><td title="在检测到没有自定义的高管时,是否使用默认遮蔽头像.">使用默认遮蔽</td><td><input class="form-control" type="checkbox" #####></td></tr></tbody></table><table><thead><tr><td>高管名</td><td>头像地址</td><td>删除</td></tr></thead><tbody>`;
    for (let i = 0; i < this.indexDBData.executivesIconList.length; i++) {
      let exeIcon = this.indexDBData.executivesIconList[i];
      htmlText += `<tr><td><input class="form-control" value="${exeIcon.name}"></td><td><input class="form-control" value="${exeIcon.icon}"></td><td><button class="btn script_customExecutivesIcon_delete">删除</button></td></tr>`;
    }
    htmlText += `</tbody></table><button class="btn" style="width: 100%;" id="script_customExecutivesIcon_add">添加</button></div></div>`;
    htmlText = htmlText.replace("#####", this.indexDBData.useDefault ? "checked" : "");
    newNode.innerHTML = htmlText;
    newNode.id = "script_customExecutivesIcon_setting";
    newNode.addEventListener("click", (event) => this.settingClickHandle(event));
    return newNode;
  }
  // 设置界面点击事件分发
  settingClickHandle(event) {
    if (event.target.className.match("script_opt_submit")) return this.settingSubmit();
    if (event.target.id == "script_customExecutivesIcon_add") return this.addItem(event);
    if (event.target.className.match("script_customExecutivesIcon_delete")) return this.deleteOne(event);
  }
  // 设置界面提交更改
  settingSubmit() {
    let valueList = Object.values(document.querySelectorAll("#script_customExecutivesIcon_setting input"))
      .map(node => node.type == "checkbox" ? node.checked : node.value);
    // 检查数据
    let useDefault = valueList[0];
    valueList = valueList.slice(1);
    for (let i = 0; i < valueList.length; i += 2) {
      if (valueList[i] == "") return tools.alert("高管名称不能使用空内容");
      if (valueList[i + 1] == "") return tools.alert("遮罩url不能使用空内容");
      if (!/^https:\/\/[^\s/$.?#].[^\s]*$/.test(valueList[i + 1])) return tools.alert("遮罩url必须是https协议的合法url");
    }
    // 保存数据
    this.indexDBData.useDefault = useDefault;
    let newArray = [];
    for (let i = 0; i < valueList.length; i += 2) {
      newArray.push({ name: valueList[i], icon: valueList[i + 1] });
    }
    this.indexDBData.executivesIconList = newArray;
    tools.indexDB_updateIndexDBData();
    tools.alert("已提交更改");
  }
  // 添加一个
  addItem(event) {
    let newNode = document.createElement("tr");
    newNode.innerHTML = `<td><input class="form-control" value=""></td><td><input class="form-control" value=""></td><td><button class="btn script_customExecutivesIcon_delete">删除</button></td>`;
    event.target.previousElementSibling.querySelector("tbody").appendChild(newNode);
  }
  // 删除一个
  deleteOne(event) {
    tools.getParentByIndex(event.target, 2).remove();
  }

  // 初始化构建默认遮罩
  initDefaultIcon() {
    let newNode = document.createElement("div");
    newNode.className = "script_executivesIcon_Dmask";
    newNode.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M24 20a7 7 0 1 0 0-14a7 7 0 0 0 0 14ZM6 40.8V42h36v-1.2c0-4.48 0-6.72-.872-8.432a8 8 0 0 0-3.496-3.496C35.92 28 33.68 28 29.2 28H18.8c-4.48 0-6.72 0-8.432.872a8 8 0 0 0-3.496 3.496C6 34.08 6 36.32 6 40.8Z"/></svg>`;
    Object.assign(newNode.style, { position: "absolute", inset: "0px" });
    this.componentData.defaultIcon = newNode;
  }

  // 核心检查以及挂载函数
  async mainCheck() {
    // 捕获当前页面所有符合要求的div
    let targetNodeList = Object.values(document.querySelectorAll("div>img"))
      .filter(node => node.parentElement.querySelectorAll("img").length == 5)
      .filter((node, index) => index % 5 == 0)
      .map(node => node.parentElement)
      .filter(node => node.querySelector(".script_executivesIcon_Dmask, .script_executivesIcon_Cmask") == null);
    // 循环操作
    for (let i = 0; i < targetNodeList.length; i++) {
      let targetNode = targetNodeList[i];
      let staffName = this.getStaffName(targetNode);
      let targetIcon = this.getIcon(staffName);
      if (!targetIcon) continue;
      // 屏蔽显示
      targetNode.querySelectorAll("img[src][alt][class]").forEach(node => node.style.display = "none");
      // 添加脚本标签
      targetNode.prepend(targetIcon);
    }
  }
  // 获取高管名字
  getStaffName(node, index = 5) {
    let name = /[A-Z][a-z]+\s[A-Z][a-z]+(\s[A-Z][a-z]+)?/.test(node.innerText);
    if (name) return node.innerText.match(/[A-Z][a-z]+\s[A-Z][a-z]+(\s[A-Z][a-z]+)?/)[0];
    if (index != 0) return this.getStaffName(node.parentElement, --index);
    return "NoName";
  }
  // 创建遮蔽标签
  getIcon(name) {
    let customTarget = this.indexDBData.executivesIconList.find(exe => exe.name == name);
    if (!customTarget && this.indexDBData.useDefault) {
      // 无匹配并且允许使用默认遮罩
      return this.componentData.defaultIcon.cloneNode(true);
    } else if (!customTarget && !this.indexDBData.useDefault) {
      // 无匹配 但是也不使用默认遮罩
      return false;
    } else if (customTarget) {
      // 匹配成功
      let newNode = document.createElement("div");
      newNode.className = "script_executivesIcon_Cmask";
      newNode.innerHTML = `<img style="width:100%;" src="${customTarget.icon}" />`
      Object.assign(newNode.style, { position: "absolute", inset: "0px" });
      return newNode;
      // https://d1fxy698ilbz6u.cloudfront.net/logo/8d62b48a96d0b4ae54c874ebd21cd5b101f0119e.png
    } else {
      return false;
    }
  }
}
new customExecutivesIcon();
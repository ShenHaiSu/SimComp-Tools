const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 随手记
class easyText extends BaseComponent {
  constructor() {
    super();
    this.name = "随手笔记";
    this.describe = "前台随手笔记功能";
    this.enable = true;
  }
  componentData = {
    rootNode: undefined, // 根元素对象
    isDragging: false, // 是否正在拖拽
    offset: { x: 0, y: 0 }, // 偏移量
    tapCount: 0, // 内容修改计数
    oldStyleNode: undefined, // 旧版本编辑器容器对象
  }
  indexDBData = {
    textContent: "", // 随手笔记文本内容
    backgroundCSS: "rgb(0,0,0,0.5)", // 背景设置
    styleMode: 0, // 0-新版本 1-旧版本
    positionTop: "10px", // 容器定位顶部距离
    positionLeft: "10px", // 容器定位左侧距离
    isShow: false, // 容器是否处于展示状态
    isHide: false, // 是否缩小
    nodeWidth: 0, // 默认宽度
    nodeHeight: 0, // 默认高度
  }
  startupFuncList = [
    this.buildContianer
  ]
  cssText = [
    `#script_easyText_root{z-index:1040;display:none;color:var(--fontColor);position:fixed;top:20px;left:20px;width:30%;height:30%;border:1px solid #ccc;padding:10px;box-sizing:border-box;cursor:move;background-position:center;background-repeat:no-repeat;background-size:cover;box-shadow:0 0 5px 1px black;border-radius:5px;}#script_easyText_root #script_easyText_title{text-align:center;font-weight:bold;margin-bottom:10px;}#script_easyText_root #script_eastText_close{position:absolute;top:10px;right:10px;cursor:pointer;}#script_easyText_root textarea{width:100%;height:calc(100% - 30px);background-color:transparent;border:none;resize:none;}#script_easyText_root #script_eastText_hide{position:absolute;top:10px;right:42px;cursor:pointer;}button#script_easeyText_button{color:var(--fontColor);text-align:center;display:block;position:fixed;left:10px;bottom:10px;width:fit-content;height:fit-content;z-index:2001;border-radius:5px;border:1px solid white;}div#script_easeyText_rootOld{background-repeat:no-repeat;background-position:center;background-size:cover;position:fixed;display:none;width:100%;height:100%;bottom:0;left:0;z-index:1031;padding:10px;}textarea#script_easyText_textArea{color:var(--fontColor);resize:none;height:100%;width:100%;background:rgba(0,0,0,0);border-radius:5px;box-shadow:0 0 7px 1px rgb(255,255,255,0.8);}`,
    `#script_easyText_root{z-index:1040;display:none;color:var(--fontColor);position:fixed;top:20px;left:20px;width:70%;height:60%;border:1px solid #ccc;padding:10px;box-sizing:border-box;cursor:move;background-position:center;background-repeat:no-repeat;background-size:cover;box-shadow:0 0 5px 1px black;border-radius:5px;}#script_easyText_root #script_easyText_title{text-align:center;font-weight:bold;margin-bottom:10px;}#script_easyText_root #script_eastText_close{position:absolute;top:10px;right:10px;cursor:pointer;}#script_easyText_root textarea{width:100%;height:calc(100% - 30px);background-color:transparent;border:none;resize:none;}#script_easyText_root #script_eastText_hide{position:absolute;top:10px;left:10px;cursor:pointer;}button#script_easeyText_button{color:var(--fontColor);text-align:center;display:block;position:fixed;left:10px;bottom:10px;width:fit-content;height:fit-content;z-index:2001;border-radius:5px;border:1px solid white;}div#script_easeyText_rootOld{position:fixed;display:none;width:100%;height:40%;bottom:0;left:0;z-index:1031;padding:10px;}textarea#script_easyText_textArea{color:var(--fontColor);resize:none;height:100%;width:100%;background:rgba(0,0,0,0);border-radius:5px;box-shadow:0 0 7px 1px rgb(255,255,255,0.8);}`
  ]
  frontUI = () => {
    Object.assign(this.componentData.rootNode.style, { display: "block" });
  }
  // 设置界面
  settingUI = () => {
    let newNode = document.createElement("div");
    let htmlText = `<div class=header>随手笔记设置</div><div class=container><div><button class="btn script_opt_submit">保存</button></div><table><tr style=height:60px><td>功能<td>设置<tr><td title=请注意被访问地址的开放性>背景CSS内容<td><textarea style=background-color:#222;text-align:center;height:60px;width:100%;resize:none></textarea><tr><td title=旧版本只能修改背景样式,不能修改其它参数.\n新版本可以修改其他参数>随手记样式<td><select class=form-control id=script_easyText_mode><option value=0>新版本<option value=1>旧版本</select><tr><td title=请自行注意宽高与显示器窗口大小的限制>宽度<td><input class=form-control type=number value=#####><tr><td title=请自行注意宽高与显示器窗口大小的限制>高度<td><input class=form-control type=number value=#####></table></div>`;
    newNode.id = "easyTextSetting";
    newNode.className = "col-sm-12 setting-container";
    // 挂载数据
    htmlText = htmlText.replace("#####", this.indexDBData.nodeWidth || 0);
    htmlText = htmlText.replace("#####", this.indexDBData.nodeHeight || 0);
    newNode.innerHTML = htmlText;
    newNode.querySelector("textarea").value = this.indexDBData.backgroundCSS;
    newNode.querySelector("select#script_easyText_mode").value = this.indexDBData.styleMode;
    // 挂载按钮
    newNode.querySelector("button.script_opt_submit").addEventListener("click", () => this.settingSubmit());
    // 返回元素
    return newNode;
  }
  // 设置提交按钮
  async settingSubmit() {
    let valueList = [];
    document.querySelectorAll("div#easyTextSetting textarea, div#easyTextSetting input, div#easyTextSetting select").forEach(node => valueList.push(node.value));
    let url_reg = /^https:\/\/[\w.-]+\.[a-zA-Z]{2,}/;
    let color_reg = tools.hexArgbCheck(valueList[0]);
    let reloadFlag = false;

    if (valueList[0] == "") {
      this.indexDBData.backgroundCSS = "rgb(0,0,0,0.5)";
    } else if (color_reg) {
      this.indexDBData.backgroundCSS = valueList[0];
    } else if (url_reg.test(valueList[0])) {
      this.indexDBData.backgroundCSS = `url(${valueList[0]})`;
    } else {
      return tools.alert("内容不正确，允许以下类型的内容：\n  #121212\n  rgb(1,1,35)\n  https://image.url");
    }

    if (valueList[2] < 0 || valueList[3] < 0) return tools.alert("宽高不能这么设置");
    if (this.indexDBData.styleMode != Math.floor(valueList[1])) reloadFlag = true;
    this.indexDBData.styleMode = Math.floor(valueList[1]);
    this.indexDBData.nodeWidth = valueList[2];
    this.indexDBData.nodeHeight = valueList[3];
    await tools.indexDB_updateIndexDBData();
    this.componentData.rootNode.style.background = this.indexDBData.backgroundCSS;
    tools.alert("更改已提交");
    if (reloadFlag) location.reload();
  }
  // 构建随手记容器元素
  buildContianer(window) {
    // 0 新版本 
    // 1 旧版本
    if (this.indexDBData.styleMode == 0) {
      return this.buildNewContainer();
    } else if (this.indexDBData.styleMode == 1) {
      return this.buildOldContainer();
    }
  }
  // 构建旧版随手记的元素
  buildOldContainer() {
    let newButton = document.createElement("button");
    let newContainer = document.createElement("div");
    let editor = document.createElement("textarea");
    Object.assign(newButton.style, { backgroundColor: this.indexDBData.backgroundCSS });
    newButton.id = "script_easeyText_button";
    newContainer.id = "script_easeyText_rootOld";
    editor.id = "script_easyText_textArea";
    newButton.innerText = "eTEXT";
    newContainer.appendChild(editor);
    document.body.appendChild(newButton);
    document.body.appendChild(newContainer);
    newButton.addEventListener("click", () => this.oldSwicthBtn());
    editor.addEventListener("change", event => this.oldEditorChange(event));
    this.componentData.rootNode = newContainer;
    this.indexDBData.isShow = !this.indexDBData.isShow;
    this.oldSwicthBtn();
  }
  // 旧版随手记交互按钮
  oldSwicthBtn() {
    Object.assign(this.componentData.rootNode.style, {
      display: this.indexDBData.isShow ? "none" : "block",
      background: this.indexDBData.backgroundCSS
    });
    this.componentData.rootNode.querySelector("#script_easyText_textArea").value = this.indexDBData.textContent;
    this.indexDBData.isShow = !this.indexDBData.isShow;
    tools.indexDB_updateIndexDBData();
  }
  // 旧版编辑器内容变动
  oldEditorChange(event) {
    this.indexDBData.textContent = event.target.value;
    tools.indexDB_updateIndexDBData();
  }

  // 构建新版随手记的元素
  buildNewContainer() {
    // 创建元素
    let newNode = document.createElement("div");
    newNode.id = "script_easyText_root";
    newNode.innerHTML = `<div id="script_easyText_title">随手笔记</div>
      <div id="script_eastText_hide">缩小</div>
      <div id="script_eastText_close">关闭</div>
      <textarea id="script_easyText_editor"></textarea>`;
    // 绑定函数
    newNode.addEventListener("mousedown", event => this.startDragging(event));
    newNode.addEventListener("touchstart", event => this.startDragging(event));
    newNode.querySelector("div#script_eastText_close").addEventListener('click', () => this.closeRootDisplay());
    newNode.querySelector("div#script_eastText_hide").addEventListener('click', () => this.switchHide())
    newNode.querySelector("textarea#script_easyText_editor").addEventListener("input", event => this.contentInput(event));
    newNode.querySelector("textarea#script_easyText_editor").addEventListener("change", event => this.contentChange(event));
    // 添加背景css和文本内容
    Object.assign(newNode.style, {
      background: this.indexDBData.backgroundCSS,
      top: this.indexDBData.positionTop,
      left: this.indexDBData.positionLeft,
      display: this.indexDBData.isShow ? "block" : "none"
    });
    newNode.querySelector("textarea#script_easyText_editor").value = this.indexDBData.textContent;
    newNode.style.height = this.indexDBData.nodeHeight == 0 ? "" : `${this.indexDBData.nodeHeight}px`;
    newNode.style.width = this.indexDBData.nodeWidth == 0 ? "" : `${this.indexDBData.nodeWidth}px`;
    // 挂载标签
    this.componentData.rootNode = newNode;
    document.body.appendChild(newNode);
    // 更新缩小
    this.indexDBData.isHide = !this.indexDBData.isHide;
    this.switchHide();
  }
  // 开始拖拽函数
  startDragging(event) {
    let windowElement = this.componentData.rootNode;
    let zoom = parseInt(feature_config.zoomRate) / 100;
    if (event.target.tagName == "TEXTAREA") return event.stopPropagation();
    if (event.button === undefined || event.button === 0) {
      event.stopPropagation();
      this.componentData.isDragging = true;
      let rect = windowElement.getBoundingClientRect();
      if (event.type === 'mousedown') {
        this.componentData.offset.x = (event.clientX) / zoom - rect.left;
        this.componentData.offset.y = (event.clientY) / zoom - rect.top;
        window.addEventListener('mousemove', event => this.drag(event));
        window.addEventListener('mouseup', event => this.stopDragging(event));
      } else if (event.type === 'touchstart') {
        this.componentData.offset.x = (event.touches[0].clientX) / zoom - rect.left;
        this.componentData.offset.y = (event.touches[0].clientY) / zoom - rect.top;
        window.addEventListener('touchmove', event => this.drag(event));
        window.addEventListener('touchend', event => this.stopDragging(event));
      }
    }
  }
  // 拖拽同步函数
  drag(event) {
    let windowElement = this.componentData.rootNode;
    let zoom = parseInt(feature_config.zoomRate) / 100;
    if (this.componentData.isDragging) {
      event.stopPropagation();
      let rect = windowElement.getBoundingClientRect();
      let clientX = event.type === 'mousemove' ? event.clientX : event.touches[0].clientX;
      let clientY = event.type === 'mousemove' ? event.clientY : event.touches[0].clientY;
      windowElement.style.left = clientX / zoom - this.componentData.offset.x + 'px';
      windowElement.style.top = clientY / zoom - this.componentData.offset.y + 'px';
    }
  }
  // 停止拖拽函数
  stopDragging(event) {
    event.stopPropagation();
    this.componentData.isDragging = false;
    window.removeEventListener('mousemove', event => this.drag(event));
    window.removeEventListener('mouseup', event => this.stopDragging(event));
    window.removeEventListener('touchmove', event => this.drag(event));
    window.removeEventListener('touchend', event => this.stopDragging(event));
    this.contentChange();
  }
  // 按钮关闭显示函数
  closeRootDisplay() {
    Object.assign(this.componentData.rootNode.style, { display: "none" });
  }
  // 缩小显示
  switchHide() {
    if (this.indexDBData.isHide) {
      this.componentData.rootNode.style.width = this.indexDBData.nodeWidth == 0 ? "" : `${this.indexDBData.nodeWidth}px`;
      this.componentData.rootNode.style.height = this.indexDBData.nodeHeight == 0 ? "" : `${this.indexDBData.nodeHeight}px`;
    } else {
      // 窗口横纵 0 横 1 纵
      let width = tools.clientHorV ? "initial" : "300px";
      Object.assign(this.componentData.rootNode.style, { width, height: "40px", overflow: "hidden" });
    }
    this.indexDBData.isHide = !this.indexDBData.isHide;
  }
  // 内容输入
  contentInput(event) {
    this.indexDBData.textContent = event.target.value;
    if (this.componentData.tapCount % 20 != 0) return;
    this.indexDBData.isShow = this.componentData.rootNode.style.display == "block";
    this.indexDBData.positionLeft = this.componentData.rootNode.style.left;
    this.indexDBData.positionTop = this.componentData.rootNode.style.top;
  }
  // 内容变动
  contentChange(event) {
    if (event == undefined) event = { target: { value: document.querySelector("#script_easyText_editor").value } };
    this.indexDBData.textContent = event.target.value;
    this.indexDBData.isShow = this.componentData.rootNode.style.display == "block";
    this.indexDBData.positionLeft = this.componentData.rootNode.style.left;
    this.indexDBData.positionTop = this.componentData.rootNode.style.top;
    tools.indexDB_updateIndexDBData();
  }
}
new easyText();
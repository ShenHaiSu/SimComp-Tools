const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config, langData } = require("../tools/tools.js");

class festivalEffectSwitch extends BaseComponent {
  constructor() {
    super();
    this.name = "节日效果开关";
    this.describe = "如题";
    this.enable = true;
    this.tagList = ['样式'];
  }
  indexDBData = {
    christmasSnowsFall: false, // 圣诞节 地图下雪
    newYearFireWorks: false, // 新年 烟花按钮
  }
  commonFuncList = [
    { // 圣诞节 地图下雪 
      match: () => this.indexDBData.christmasSnowsFall && /landscape\/$/.test(location.href),
      func: this.christmasSnowsFall
    }, { // 新年 烟花按钮
      match: () => this.indexDBData.newYearFireWorks && /landscape\/$/.test(location.href),
      func: this.newYearFireWorks
    }
  ]

  // 设置界面
  settingUI = () => {
    let mainNode = document.createElement("div");
    let htmlText = `<div class="header">节日效果开关设置</div><div class=container><div><div><button class="btn script_opt_submit">保存</button></div></div><table><thead><tr><td>屏蔽项目<td>屏蔽选项<tbody>`;
    htmlText += `<tr><td title="在圣诞节前后 公司的地图界面会有canvas标签绘制地图飘雪">圣诞节 地图飘雪<td><input ${this.indexDBData.christmasSnowsFall ? "checked" : ""} class=form-control type=checkbox>`
    htmlText += `<tr><td title="新年前后 公司地图右下角有烟花按钮">新年 烟花按钮<td><input ${this.indexDBData.newYearFireWorks ? "checked" : ""} class=form-control type=checkbox>`
    htmlText += `</table></div>`;
    mainNode.id = "scirpt_setting_festivalEffectSwitch";
    mainNode.innerHTML = htmlText;
    mainNode.addEventListener('click', event => this.settingClickHandle(event));
    return mainNode;
  }
  settingClickHandle(event) {
    if (event.target.className.match("script_opt_submit")) return this.settingSubmit();
  }
  settingSubmit() {
    let queryString = `div#scirpt_setting_festivalEffectSwitch td>select, div#scirpt_setting_festivalEffectSwitch td>input`;
    let valueList = Object.values(document.body.querySelectorAll(queryString)).map(node => node.type == "checkbox" ? node.checked : node.value);
    this.indexDBData.christmasSnowsFall = valueList[0];
    this.indexDBData.newYearFireWorks = valueList[1];
    tools.indexDB_updateIndexDBData();
    tools.alert("更新并保存");
  }

  // 圣诞节 地图下雪 
  christmasSnowsFall() {
    let targetNode = document.querySelector(`canvas[data-testid="SnowfallCanvas"]`);
    if (!targetNode) return;
    Object.assign(targetNode.style, { display: "none" });
  }
  // 新年 烟花按钮
  newYearFireWorks() {
    tools.getParentByIndex(document.querySelector("button>img[alt='Start fireworks']"),1).remove();
  }
}
new festivalEffectSwitch();
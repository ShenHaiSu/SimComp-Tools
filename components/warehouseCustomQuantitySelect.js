const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

class warehouseCustomQuantitySelect extends BaseComponent {
  constructor() {
    super();
    this.name = "库存发货数量快捷选择";
    this.describe = "在库存发货界面可以快捷选择预设的数量进行发货";
    this.enable = false;
    this.tagList = ['仓库', '实用', '快捷'];
  }
  componentData = {
    tempNode: undefined, // 临时节点
  }
  indexDBData = {
    quantityList: [], // 自定义数量列表
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/warehouse\/(.+)/) && document.querySelectorAll("form").length > 0),
    func: this.mountSelectFunc
  }]
  cssText = [`select[sct_cpt='warehouseCustomQuantitySelect'][sct_id='selector']{width:100%;height:30px;background-color:#3c3c3c;border-radius:5px;color:var(--fontColor);}`]

  // 设置界面构建
  settingUI = () => {
    let mainNode = document.createElement("div");
    // 构建节点
    let htmlText = `<div class="header">库存发货数量快捷选择设置</div><div class="container"><div><button class="btn script_opt_submit">保存更改</button></div><table><thead><tr><td>数量</td><td>删除</td></tr></thead><tbody>`;
    for (let i = 0; i < this.indexDBData.quantityList.length; i++) {
      let item = this.indexDBData.quantityList[i];
      htmlText += `<tr><td><input class="form-control" value="${item}"></td><td><button class="btn" sct_cpt='warehouseCustomQuantitySelect' sct_id='deleteOne'>删除</button></td></tr>`
    }
    htmlText += `</tbody></table><button class="btn" style="width: 100%;" sct_cpt='warehouseCustomQuantitySelect' sct_id='addOne'>添加</button></div>`
    mainNode.innerHTML = htmlText;
    // 绑定事件
    mainNode.addEventListener("click", (e) => this.settingClickHandle(e));
    mainNode.id = "warehouseCustomQuantitySelect_setting"
    // 返回节点对象
    return mainNode;
  }
  // 设置界面事件分发
  settingClickHandle(e) {
    let target = e.target;
    let nodeID = target.getAttribute("sct_id");
    if (target.tagName != "BUTTON") return;
    if (/script_opt_submit/.test(target.className)) return this.settingSubmit();
    if (nodeID == "addOne") return this.settingAddOne(e);
    if (nodeID == "deleteOne") return this.settingDeleteOne(e);
  }
  // 设置提交保存按钮
  settingSubmit() {
    let valueList = Object.values(document.querySelectorAll("#warehouseCustomQuantitySelect_setting input"))
      .filter(node => node.value != "" && !isNaN(Math.floor(node.value.replace(/,/g, ""))))
      .map(node => Math.floor(node.value.replace(/,/g, "")))
      .filter(value => value > 0);
    this.indexDBData.quantityList = valueList;
    tools.indexDB_updateIndexDBData();
    this.buildSelectorNode();
    document.querySelectorAll("div[sct_cpt='warehouseCustomQuantitySelect']").forEach(node => node.remove());
    tools.alert("已提交更改保存");
  }
  // 删除单个按钮
  settingDeleteOne(e) {
    tools.getParentByIndex(e.target, 2).remove();
  }
  // 添加一个按钮
  settingAddOne(e) {
    let newNode = document.createElement("tr");
    newNode.innerHTML = `<td><input class="form-control" value=""></td><td><button class="btn" sct_cpt="warehouseCustomQuantitySelect" sct_id="deleteOne">删除</button></td>`;
    e.target.previousElementSibling.querySelector("tbody").appendChild(newNode);
  }

  // 挂载选择器函数
  mountSelectFunc() {
    // 检查删除已有
    let nowNode = document.querySelector("div[sct_cpt='warehouseCustomQuantitySelect']");
    if (nowNode) return;

    // 检查缓存节点
    if (!this.componentData.tempNode) this.buildSelectorNode();
    let selectNode = this.componentData.tempNode;

    // 捕获挂载位置
    let targetNode = document.querySelector("input[name='amount']").parentElement.parentElement;
    targetNode.appendChild(selectNode);
  }

  // 选择器内容变动函数
  selectChangeHandle(e) {
    let newValue = e.target.value;
    let targetInput = tools.getParentByIndex(e.target, 2).querySelector("input[name='amount']");
    tools.setInput(targetInput, newValue, 2);
  }

  // 构造选择器函数
  buildSelectorNode() {
    // 删除原有节点
    if (this.componentData.tempNode) this.componentData.tempNode = undefined;

    // 构建
    let newNode = document.createElement("div");
    let innerHTML = `<select sct_cpt='warehouseCustomQuantitySelect' sct_id="selector"><option value="0">待选择...</option>`;
    for (let i = 0; i < this.indexDBData.quantityList.length; i++) {
      let quantity = this.indexDBData.quantityList[i];
      innerHTML += `<option value="${quantity}">${tools.numberAddCommas(quantity)}</option>`;
    }
    innerHTML += `</select>`;
    newNode.setAttribute("sct_cpt", "warehouseCustomQuantitySelect");
    newNode.innerHTML = innerHTML;

    // 挂载变动函数
    newNode.querySelector("select").addEventListener("change", e => this.selectChangeHandle(e));

    // 挂载
    this.componentData.tempNode = newNode;
  }
}

new warehouseCustomQuantitySelect();
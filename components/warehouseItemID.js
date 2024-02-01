const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config, langData } = require("../tools/tools.js");

class warehouseItemID extends BaseComponent {
  constructor() {
    super();
    this.name = "仓库界面物资显示物品ID";
    this.describe = "在仓库界面物资文字右边会显示物品的ID";
    this.tagList = ["仓库", '物品', 'ID'];
    this.enable = false;
  }
  componentData = {
    nameList: [], // 缓存的物品列表
    nodeTemp: undefined, // 节点缓存
  }
  cssText = [
    `span[sct_cpt='warehouseItemID'][sct_id='item_id']{display:block;position:absolute;text-align:center;font-size:20px;color:#ffffff70;right:2%;bottom:20%;}`
  ]
  commonFuncList = [{
    match: () => Boolean(location.href.match(/warehouse\/$/)),
    func: this.mainFunc
  }]
  startupFuncList = [this.updateCache]

  async updateCache() {
    for (let i = 0; i < 180; i++) {
      let result = await tools.itemIndex2Name(i);
      if (!result) continue;
      this.componentData.nameList[i] = result;
    }
  }

  mainFunc() {
    let itemNodeList = Object.values(document.querySelectorAll(".col-lg-10.col-md-9 > div > div > div > div > div"));
    // 审查
    if (itemNodeList.length == 0) return;
    if (itemNodeList[0].querySelector(`span[sct_cpt='warehouseItemID'][sct_id='item_id']`)) return;
    // 初始化显示节点
    if (!this.componentData.nodeTemp) {
      let tempNode = document.createElement("span");
      tempNode.setAttribute("sct_cpt", "warehouseItemID");
      tempNode.setAttribute("sct_id", "item_id");
      this.componentData.nodeTemp = tempNode;
    }
    // 循环检索以及挂载
    for (let i = 0; i < itemNodeList.length; i++) {
      let targetNode = itemNodeList[i];
      targetNode.querySelectorAll(`span[sct_cpt='warehouseItemID'][sct_id='item_id']`).forEach(item => item.remove());
      let itemName = targetNode.querySelector("b").innerText;
      let id = this.componentData.nameList.findIndex(item => item == itemName);
      let newNode = this.componentData.nodeTemp.cloneNode(true);
      newNode.innerText = id;
      targetNode.appendChild(newNode);
    }
  }
}

new warehouseItemID();
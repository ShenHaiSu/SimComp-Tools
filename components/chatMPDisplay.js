const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 聊天室自动询价
class chatroom_mp_display extends BaseComponent {
  constructor() {
    super()
    this.name = "聊天室自动询价";
    this.describe = "在聊天室中,点击带有物资图标的信息文本处可以自动在交易所查价格"
    this.enable = true;
    this.canDisable = true;
  }
  indexDBData = {
    display_ms: 0, // 固定显示时长 填0会启用下面的属性
    display_auto_ms: 2000, // 动态显示时长 实际显示时长 = 物品数量 * display_auto_ms
    focus_q: 0, // 关注的品质
    focus_offset: 0, // 价格偏移
  }
  settingUI = () => {
    // 创建并挂载
    let mainSetNode = document.createElement("div");
    let htmlText = `<div class="col-sm-12 setting-container" id=setting-container-3><div><div class='header'>聊天室自动询价设置</div><div class=container><div><div><button class="script_opt_submit btn">保存</button></div></div><table><tr style=height:60px><td>功能<td>设置<tr><td title=无论物品数量都只显示指定时长单位毫秒如果设定为0秒就会使用自适应显示时间>强制显示时间<td><input class='form-control' type=number value=display_ms><tr><td title="根据物品数量自动设置显示时间 单位毫秒 实际显示时间为：所有物品加载完毕后 数量*这个设置的时间">自适应显示时间<td><input class='form-control' type=number value=display_auto_ms><tr><td title=在自动询价时会强制显示这个品质的价格>关注的品质<td><input class='form-control' type=number value=focus_q><tr><td title="mp-目标折扣% 将此项目设定为0将不强制计算折扣">目标折扣<td><input class='form-control' type=number value=focus_offset></table></div></div></div>`;
    htmlText = htmlText.replace("display_ms", this.indexDBData.display_ms.toString());
    htmlText = htmlText.replace("display_auto_ms", this.indexDBData.display_auto_ms.toString());
    htmlText = htmlText.replace("focus_q", this.indexDBData.focus_q.toString());
    htmlText = htmlText.replace("focus_offset", this.indexDBData.focus_offset.toString());
    mainSetNode.innerHTML = htmlText;
    // 绑定按键
    mainSetNode.querySelector("button.script_opt_submit").addEventListener("click", () => this.settingSubmitHandle());
    // 返回元素
    return mainSetNode;
  }
  async settingSubmitHandle() {
    let valueList = [];
    document.querySelectorAll("#setting-container-3 input").forEach((item) => valueList.push(item.value));
    if (!(valueList.length == 4 && valueList.every((num) => num >= 0) && valueList[2] <= 12 && valueList[3] <= 100)) {
      window.alert("数据内容不合规，请检查所有内容不应当小于0。品质在0-12中，折扣在0-100中。");
      return;
    }
    this.indexDBData.display_ms = Math.floor(valueList[0]);
    this.indexDBData.display_auto_ms = Math.floor(valueList[1]);
    this.indexDBData.focus_q = Math.floor(valueList[2]);
    this.indexDBData.focus_offset = Math.floor(valueList[3]);
    await tools.indexDB_updateIndexDBData();
    window.alert("已提交保存。");
  }
  componentData = {
    containerNode: undefined, // 价格显示容器元素
    tableNode: undefined, // 显示内容主元素
    fadeTimer: undefined, // 自动消失的计时器
  }
  commonFuncList = [{
    match: event => event != undefined && /messages\/(.+)/.test(location.href) && event.target.parentElement.querySelectorAll("div").length == 0,
    func: this.mainFunc
  }]
  async mainFunc(event) {
    tools.log(event);
    if (!this.componentData.containerNode) {
      // 不存在，当前是第一次加载
      this.componentData.containerNode = document.createElement("div");
      this.componentData.tableNode = document.createElement("table");
      Object.assign(this.componentData.containerNode.style, {
        position: "absolute",
        top: "20px",
        left: "400px",
        minWidth: "180px",
        minHeight: "80px",
        backgroundColor: "rgb(0,0,0,0.8)",
        borderRadius: "5px",
        zIndex: "1031",
        display: "none",
        color: feature_config.fontColor,
      });
      Object.assign(this.componentData.tableNode.style, {
        width: "100%",
        height: "100%",
        textAlign: "center",
      });
      this.componentData.tableNode.innerHTML = `<tbody></tbody>`;
      this.componentData.containerNode.appendChild(this.componentData.tableNode);
      document.body.appendChild(this.componentData.containerNode);
      this.componentData.containerNode.addEventListener("click", () => {
        Object.assign(this.componentData.containerNode.style, { display: "none" });
      });
    }

    if (this.componentData.fadeTimer) clearTimeout(this.componentData.fadeTimer);
    // 格式化信息内容  [id1,id2,id3]
    // 排除 90 91 92 93 94 95 96 97 99
    let itemList = this.getChatItemList(event.target.parentElement);
    itemList = itemList.filter((item) => item == 98 || item < 90 || item > 99);
    if (itemList.length == 0) return;
    // 格式化品质需求列表 默认需求q0 []
    let qualityList = this.extractQualityList(event.target.parentElement.innerText);
    if (!qualityList.includes(0)) qualityList.unshift(0);
    if (this.indexDBData.focus_offset !== 0) qualityList.unshift("sp");
    // 将容器目标定在鼠标周边，并修改style
    Object.assign(this.componentData.containerNode.style, {
      display: "block",
      height: `${(itemList.length + 1) * 28}px`,
      width: `${(qualityList.length + 1) * 70}px`,
      top: `${event.clientY + 20}px`,
      left: `${event.clientX + 10 - (qualityList.length + 1) * 80 <= 0 ? 0 : event.clientX + 10 - (qualityList.length + 1) * 80}px`,
    });
    this.formatHTML(this.componentData.tableNode, itemList, qualityList);
    // 触发价格更新后从数据库中提取
    for (let i = 0; i < itemList.length; i++) {
      await tools.getMarketPrice(itemList[i], 0, runtimeData.basisCPT.realm);
      let node = this.componentData.tableNode;
      for (let j = 0; j < qualityList.length; j++) {
        let currentItem = indexDBData.basisCPT.resourcePool[runtimeData.basisCPT.realm][itemList[i]];
        let quality = qualityList[j];
        let focusQuality = this.indexDBData.focus_q;
        let focusOffset = this.indexDBData.focus_offset;
        let price;
        if (quality === "sp") {
          // 如果 quality 是 "sp"
          // 如果 currentItem.price[focusQuality] 不是一个数字
          price = isNaN(currentItem[focusQuality]) ? "无" : ((currentItem[focusQuality] * (100 - focusOffset)) / 100).toFixed(3);
        } else {
          // 如果 quality 不是 "sp"
          price = currentItem[quality] == Infinity ? "无" : currentItem[quality];
        }
        node.innerHTML = node.innerHTML.replace("请求中...", price == Infinity ? "无" : price);
      }
    }

    // 定时隐藏
    if (this.indexDBData.display_auto_ms == 0 && this.indexDBData.display_ms == 0) return;
    this.componentData.fadeTimer = setTimeout(() => {
      Object.assign(this.componentData.containerNode.style, { display: "none" });
    }, this.indexDBData.display_ms || itemList.length * this.indexDBData.display_auto_ms);
    tools.log(event.target, itemList);
  }
  getChatItemList(node) {
    let outputList = [];
    let resList = Object.values(node.querySelectorAll("span > span[attr-to]"));
    for (let i = 0; i < resList.length; i++) {
      let resNode = resList[i];
      let info = resNode.getAttribute("attr-to");
      if (!/resource\/\d+/.test(info)) continue;
      let result = Math.floor(info.match(/resource\/(\d+)\//)[1]);
      if (!outputList.includes(result)) outputList.push(result);
    }
    return outputList;
  }
  extractQualityList(text) {
    const regex = /(?:q|Q)(\d+)/g;
    return Array.from(text.matchAll(regex), (item) => parseInt(item[1]))
      .filter((item, index, self) => item >= 0 && item <= 12 && self.indexOf(item) === index)
      .sort((item_a, item_b) => item_a - item_b);
  }
  formatHTML(node, itemList, qualityList) {
    let fragment = document.createDocumentFragment();
    let tableBody = document.createElement("tbody");
    tableBody.classList.add("script_tbody");
    let headerRow = document.createElement("tr");
    let headerCell = document.createElement("td");
    headerCell.classList.add("script_tbody_tr_1");
    headerCell.textContent = "品名";
    headerRow.appendChild(headerCell);
    for (let i = 0; i < qualityList.length; i++) {
      let quality = qualityList[i];
      let isFocusQ = quality === "sp";
      let qualityLabel = isFocusQ
        ? `q${this.indexDBData.focus_q} -${this.indexDBData.focus_offset}%`
        : `q${quality}`;
      let qualityCell = document.createElement("td");
      qualityCell.textContent = qualityLabel;
      headerRow.appendChild(qualityCell);
    }
    tableBody.appendChild(headerRow);
    for (let i = 0; i < itemList.length; i++) {
      let itemName = tools.itemIndex2Name(itemList[i]);
      let itemRow = document.createElement("tr");
      let itemNameCell = document.createElement("td");
      itemNameCell.classList.add("script_tbody_tr_1");
      itemNameCell.textContent = itemName;
      itemRow.appendChild(itemNameCell);
      for (let j = 0; j < qualityList.length; j++) {
        let placeholderCell = document.createElement("td");
        placeholderCell.textContent = "请求中...";
        itemRow.appendChild(placeholderCell);
      }
      tableBody.appendChild(itemRow);
    }
    fragment.appendChild(tableBody);
    node.innerHTML = "";
    node.appendChild(fragment);
  }
}
new chatroom_mp_display();
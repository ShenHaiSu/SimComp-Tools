const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config } = require("../tools/tools.js");

// 仓库出售界面显示mp偏移
class warehouseACCmpOffest extends BaseComponent {
  constructor() {
    super();
    this.name = "仓库出售界面显示mp偏移";
    this.describe = "在仓库出售表格中,填写单价的下面会自动根据当前市场最低价以及设置的计算方法来显示";
    this.enable = true;
  }
  indexDBData = {
    offestList: [["mp+0", "mp*0.97"], ["mp+0", "mp*0.97"]], // 不同分区的偏移列表 内容是字符串 使用mp作为占位符
  }
  componentData = {
    onLoad: false, // 正在加载标记
    realm: undefined, // 当前服务器标记
    selectorNode: undefined, // 选择器缓存节点
  }
  commonFuncList = [{
    match: () => Boolean(location.href.match(/warehouse\/(.+)/) && document.querySelectorAll("form").length > 0),
    func: this.mainFunc
  }]
  cssText = [`select[sct_cpt='warehouseACCmpOffest'][sct_id='selectorNode']{width:100%;height:30px;background-color:#3c3c3c;border-radius:5px;margin-top:5px;color:var(--fontColor);}`];

  // 设置界面的构建
  settingUI = async () => {
    let newNode = document.createElement("div");
    let realm = (this.componentData.realm == undefined) ? await tools.getRealm() : this.componentData.realm;
    this.componentData.realm = realm;
    let htmlText = `<div class="header">仓库出售界面显示mp偏移</div><div class="container"><div><button class="btn script_opt_submit">保存</button></div><table><thead><tr><td colspan="2"><span>使用mp作为占位符</span><br><span>允许使用单次 + - * / 运算符</span><br><span>或者使用#来代表归零0； 例如#100 = 100</span></td></tr><tr><td>偏移表达</td><td>设置</td></tr></thead><tbody>`;
    for (let i = 0; i < this.indexDBData.offestList[realm].length; i++) {
      let offestString = this.indexDBData.offestList[realm][i];
      htmlText += `<tr><td><input class="form-control" value='${offestString}'></td><td><button class="btn form-control" sct_id="deleteOne">删除</button></td></tr>`;
    }
    htmlText += `</tbody></table><button class="btn form-control" sct_id="addOne">添加</button></div>`;
    newNode.innerHTML = htmlText;
    newNode.id = "accMPoffsetSetting";
    // 绑定按钮
    newNode.addEventListener('click', e => this.settingClickHandle(e));
    // 返回元素
    return newNode;
  }
  // 设置界面点击交互
  settingClickHandle(e) {
    if (e.target.tagName != "BUTTON") return;
    if (/script_opt_submit/.test(e.target.className)) return this.settingSubmit();
    if (e.target.getAttribute("sct_id") == "deleteOne") return tools.getParentByIndex(e.target, 2).remove();
    if (e.target.getAttribute("sct_id") == "addOne") return this.settingAddOne(e.target);
  }
  // 添加一行
  settingAddOne(target) {
    let newTrNode = document.createElement("tr");
    newTrNode.innerHTML = `<td><input type="text" class="form-control"></td><td><button class="btn form-control" sct_id="deleteOne">删除</button></td>`;
    target.previousElementSibling.querySelector("tbody").appendChild(newTrNode);
  }
  // 设置提交
  settingSubmit() {
    let realm = this.componentData.realm;
    // 获取内容
    let valueList = Object.values(document.querySelectorAll("div#accMPoffsetSetting input"))
      .map(node => node.value.replace(/\s/g, ""))
      .filter(value => Boolean(value));
    // 信息检查
    if (valueList.some(value => (value.match(/[+\-*/#]/g) || []).length > 1)) {
      return tools.alert("只允许使用一次运算符，并且使用mp作为占位符，请更正错误内容。");
    }
    // 检查数量是否达标
    if (valueList.length == 1) return tools.alert("不能仅仅设置一个快捷定价。");
    if (!valueList.some(value => value == "mp+0")) valueList.unshift("mp+0");
    // 提交更改
    this.indexDBData.offestList[realm] = valueList;
    tools.indexDB_updateIndexDBData();
    tools.alert("已提交更改");
    // 刷新显示
    this.componentData.selectorNode = undefined;
    let mountNode = document.querySelector("select[sct_cpt='warehouseACCmpOffest'][sct_id='selectorNode']");
    if (mountNode) mountNode.remove();
  }
  async mainFunc() {
    // 检查网页标记是否已存在
    if (document.querySelector("select[sct_cpt='warehouseACCmpOffest'][sct_id='selectorNode']")) return;
    // 检测是否正在等待加载
    if (this.componentData.onLoad) return;
    this.componentData.onLoad = true;
    try {
      // 初始化数据以及节点预备
      if (this.componentData.selectorNode == undefined) await this.buildSelectorNode();
      let selectorNode = this.componentData.selectorNode;
      let targetNode = document.querySelector("input[name='price']").parentElement;
      let realm = (this.componentData.realm == undefined) ? await tools.getRealm() : this.componentData.realm;
      this.componentData.realm = realm;
      let res_id = tools.itemName2Index(decodeURI(location.href.match(/\/([^\/]+)$/)[1]));
      let quality = this.getQuality(document.querySelector("form"));
      let market_price = await tools.getMarketPrice(res_id, quality, realm);

      // 重新渲染select内部的数值
      selectorNode.setAttribute("mp", market_price);
      selectorNode.selectedIndex = 0;
      let optionList = Object.values(selectorNode.querySelectorAll("option"));
      for (let i = 0; i < optionList.length; i++) {
        let optionNode = optionList[i];
        if (isNaN(parseInt(optionNode.value))) {
          // 特殊Value处理器
          this.specialValueHandler(optionNode, optionNode.value, market_price);
        } else {
          // 常规计算处理器
          let oriContent = this.indexDBData.offestList[realm][parseInt(optionNode.value)];
          let realPrice = this.realPriceCalc(oriContent, market_price);
          optionNode.innerHTML = `${oriContent}: ${realPrice}`;
        }
      }
      // 挂载节点
      targetNode.appendChild(selectorNode);
    } catch (error) {
      tools.errorLog(error);
    }
    this.componentData.onLoad = false;
  }
  // 获取品质信息
  getQuality(formNode) {
    let starsCount = formNode.previousElementSibling.querySelectorAll("span > svg").length;
    if (starsCount == 0) return 0;
    let qualityNumber = parseInt(formNode.previousElementSibling.querySelectorAll("span > svg")[0].parentElement.innerText);
    return isNaN(qualityNumber) ? starsCount : qualityNumber;
  }
  // 构建选择器模板
  async buildSelectorNode() {
    let realm = (this.componentData.realm == undefined) ? await tools.getRealm() : this.componentData.realm;
    this.componentData.realm = realm;
    let newNode = document.createElement("select");
    let htmlText = `<option value='#mp' disabled >MP:</option>`;
    htmlText += this.indexDBData.offestList[realm].map((value, index) => `<option value='${index}'>${value}</option>`).join("");
    newNode.innerHTML = htmlText;
    newNode.addEventListener("change", e => this.selectorChange(e));
    newNode.setAttribute("sct_cpt", "warehouseACCmpOffest");
    newNode.setAttribute("sct_id", "selectorNode");
    this.componentData.selectorNode = newNode;
  }
  // 选择器被点击
  selectorChange(e) {
    try {
      // 特殊Value拦截处理器
      if (isNaN(parseInt(e.target.selectedOptions[0].value))) return; // 非常规value值，暂不处理。Date:2024年9月1日
      let realm = this.componentData.realm;
      let index = e.target.selectedIndex;
      let market_price = Number(e.target.getAttribute("mp"));
      let realPrice = this.realPriceCalc(this.indexDBData.offestList[realm][parseInt(e.target.selectedOptions[0].value)], market_price);
      let targetNode = e.target.previousElementSibling;
      tools.log(`index:${index} value:${this.indexDBData.offestList[realm][index]} output:${realPrice}`);
      tools.setInput(targetNode, realPrice, 3);
    } catch (e) {
      tools.errorLog("仓库出售界面显示mp偏移组件报错", e);
    }
  }
  // 计算实际价格
  realPriceCalc(inputString, marketPrice) {
    // inputString = inputString.replace("mp", marketPrice);
    let [placeholder, operator, value] = inputString.split(/([+\-*/#])/);
    let mp = (placeholder == "") ? 0 : parseFloat(placeholder.replace("mp", marketPrice).trim());
    let num = parseFloat(value.trim());
    let result = 0;
    // console.log(placeholder, operator, value);
    if (isNaN(num)) return 0;
    switch (operator) {
      case '+':
        result = mp + num;
        break;
      case '-':
        result = mp - num;
        break;
      case '*':
        result = mp * num;
        break;
      case '/':
        result = mp / num;
        break;
      case "#":
        result = num;
        break;
      default:
        result = 0;
        return;
    }
    return Number(result.toFixed(2));
  }
  // 特殊Value赋值处理器
  specialValueHandler(optionNode, value, market_price) {
    switch (value) {
      case "#mp":
        optionNode.innerHTML = `MP: ${market_price}`;
        return;
      default:
        optionNode.innerHTML = `#####`;
        return;
    }
  }
}
new warehouseACCmpOffest();
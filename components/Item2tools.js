const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config, langData } = require("../tools/tools.js");

class item2tools extends BaseComponent {
  constructor() {
    super();
    this.name = "物资外站跳转";
    this.describe = "点击进入仓库或者交易所某一物资界面之后 下方可以直接点击打开SimCompanyTools第三方网站";
    this.enable = false;
    this.tagList = ["实用", "物资"];
  }
  componentData = {
    tempNode: undefined, // 临时标签对象
    realm: -1, // 服务器标号
  }
  cssText = [`div[sct_cpt='item2tools'][sct_id='jumpButtonContain']{width:100%;display:block;margin:10px 0;padding:5px;text-align:center;}div[sct_cpt='item2tools'][sct_id='jumpButtonContain']>button{font-size:14px;background-color:#00000070;color:var(--fontColor);transition:ease-in-out 0.1s;}div[sct_cpt='item2tools'][sct_id='jumpButtonContain']>button:hover{background-color:black;color:white;}`]
  commonFuncList = [{
    match: () => /headquarters\/warehouse\/.+$/.test(location.href),
    func: this.warehouseMountButtonFunc
  }, {
    match: () => /market\/resource\/\d+\/$/.test(location.href),
    func: this.marketMountButtonFunc
  }]

  // 仓库界面按钮标签挂载
  warehouseMountButtonFunc() {
    try {
      // 检查当前网页是否有
      if (document.querySelector(`div[sct_cpt='item2tools']`)) return;
      // 检查标签缓存
      if (!this.componentData.tempNode) this.genTempNode();
      // 挂载标签
      let targetNode = tools.getParentByIndex(document.querySelector("div.row>div.col-md-6>div>div>a>table"), 2);
      targetNode.appendChild(this.componentData.tempNode);
    } catch (e) {
      tools.errorLog("item2tools报错", e);
    }
  }
  // 交易所界面按钮标签挂载
  marketMountButtonFunc() {
    try {
      // 检查当前网页是否有
      if (document.querySelector(`div[sct_cpt='item2tools']`)) return;
      // 检查标签缓存
      if (!this.componentData.tempNode) this.genTempNode();
      // 挂载标签
      let targetNode = tools.getParentByIndex(document.querySelector("form"), 1);
      targetNode.appendChild(this.componentData.tempNode);
    } catch (e) {
      tools.errorLog("item2tools报错", e);
    }
  }

  // 按钮点击事件分发
  async buttonClickHandle(event) {
    if (this.componentData.realm == -1) this.componentData.realm = await tools.getRealm();
    if (/headquarters\/warehouse\/.+$/.test(location.href)) return this.warehouseClickHandle(event);
    if (/market\/resource\/\d+\/$/.test(location.href)) return this.marketClickHandle(event);
  }
  // 仓库处理函数
  warehouseClickHandle(event) {
    let target = tools.getParentByIndex(event.target, 2);
    let realm = this.componentData.realm;
    let resID = tools.itemName2Index(decodeURI(location.href.match(/warehouse\/(.+)/)[1]));
    let quality = 0;
    if (/Q\d+/i.test(target.querySelector("span>b").innerText))
      quality = target.querySelector("span>b").innerText.match(/q(\d+)/i)[1];
    window.open(`https://simcotools.app/zh/exchange/${realm}/${resID}?quality=${quality}`);
  }
  // 交易所处理函数
  marketClickHandle(event) {
    let realm = this.componentData.realm;
    let resID = Math.floor(location.href.match(/resource\/(\d+)\/$/)[1]);
    let quality = 0;
    if (document.body.querySelector("form").querySelector("button>span"))
      quality = Math.floor(document.body.querySelector("form").querySelector("button>span").innerText);
    window.open(`https://simcotools.app/zh/exchange/${realm}/${resID}?quality=${quality}`);
  }


  // 生成临时标签
  genTempNode() {
    let newNode = document.createElement("div");
    newNode.innerHTML = `<button class='form-control' sct_cpt='item2tools' sct_id='jumpButton'>前往SimCompanyTools物资界面</button>`;
    newNode.setAttribute("sct_cpt", "item2tools");
    newNode.setAttribute("sct_id", "jumpButtonContain");
    this.componentData.tempNode = newNode;

    document.body.addEventListener("click", e => {
      if (e.target.tagName !== "BUTTON") return;
      if (e.target.getAttribute("sct_cpt") != "item2tools") return;
      if (e.target.getAttribute("sct_id") != "jumpButton") return;
      this.buttonClickHandle(e);
    })
    console.log("元素构建");
  }
}
new item2tools();
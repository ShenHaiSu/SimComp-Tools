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
    executivesIconList: [{}, {}], // 高管自定义头像列表 {id:123,icon:"https://ss",name:"asd"}
  }
  commonFuncList = [
    { // 公司详情界面
      match: () => /company\/\d+\/\w+\/$/.test(location.href),
      func: this.mainCompanyProfile
    }, { // 公司高管页面
      match: () => /headquarters\/executives\/$/.test(location.href),
      func: this.mainExecutives
    }, { // 高管被挖角页面
      match:() => false,
      func:() => {}
    },{ // 百科页面
      match:() => {},
      func:
    }
  ];

  // 公司详情界面
  mainCompanyProfile() {

  }
  // 公司高管页面
  mainExecutives() {

  }
  // 百科页面
  
}
new customExecutivesIcon();
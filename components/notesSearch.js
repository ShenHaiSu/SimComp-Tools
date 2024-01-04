const BaseComponent = require("../tools/baseComponent.js");
const { tools, indexDBData } = require("../tools/tools.js");

class notesSearch extends BaseComponent {
  constructor() {
    super();
    this.name = "备注搜索";
    this.describe = "在备注页面可以在所有你曾经写过的,给别家公司的备注中搜索内容";
    this.enable = false;
    this.tagList = ["备注", "实用"];
  }
  componentData = {
    node: undefined, // 搜索框标签
  }

  cssText = [`div[sct_notessearch][sct_id="container"]{background-color:#00000099;padding:10px;margin-bottom:10px;color:var(--fontColor);}[sct_notessearch]>[sct_id="header"]{text-align:center;margin-bottom:10px;font-size:large;font-weight:700;}[sct_notessearch]>[sct_id="main"]{padding:5px;display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:center;align-items:stretch;}[sct_notessearch]>[sct_id="main"]>input{flex:4;color:var(--fontColor);background-color:#333333;margin-right:5px;}[sct_notessearch]>[sct_id="main"]>button{text-align:center;flex:1;line-height:16px;font-size:16px;vertical-align:middle;background-color:#333333;color:var(--fontColor);}[sct_notessearch]>[sct_id="main"]>button:hover{outline-offset:1px;outline:5px auto white;}[sct_notessearch]>[sct_id="main"]>button>span{vertical-align:middle;}`]
  commonFuncList = [{
    match: () => /account\/notes\/$/.test(location.href) && !document.querySelector("div[sct_notessearch]"),
    func: this.mountFunc
  }]

  // 挂载搜索框
  mountFunc() {
    if (!this.componentData.node) {
      let newNode = document.createElement("div");
      newNode.innerHTML = `<div sct_id=header>备注搜索</div><div sct_id=main><input class=form-control> <button class="form-control btn"><span><svg height=16 viewBox="0 0 16 16"width=16 xmlns=http://www.w3.org/2000/svg><g fill=none stroke=currentColor stroke-linecap=round stroke-linejoin=round stroke-width=1.5><path d="m11.25 11.25l3 3"></path><circle cx=7.5 cy=7.5 r=4.75></circle></g></svg></span>搜索</button></div>`;
      newNode.setAttribute("sct_notessearch", "");
      newNode.setAttribute("sct_id", "container");
      // 按钮添加事件监听
      newNode.querySelector("div[sct_id='main']>button")
        .addEventListener('click', e => this.mainClick(e));
      // 输入框添加事件监听
      newNode.querySelector("div[sct_id='main']>input")
        .addEventListener("keydown", e => e.keyCode === 13 ? e.target.nextElementSibling.click() : null);
      this.componentData.node = newNode;
    }
    let target = document.querySelector("div.container>div.row div.col-md-6.col-md-pull-6");
    target.prepend(this.componentData.node);
  }
  // 搜索按钮点击交互
  async mainClick(event) {
    let realm = await tools.getRealm();
    let searchValue = event.target.closest("button")?.previousElementSibling?.value;
    this.showAll();
    if (searchValue == "" || !searchValue) return;
    let matchList = indexDBData.basisCPT.notes[realm].out.filter(item => !item.note.includes(searchValue)).map(item => item.about.company);
    this.getAllNodes().filter(node => matchList.includes(node.querySelector("b").innerText.trim())).map(node => node.style.display = "none");
  }

  // 展示所有备注
  showAll() {
    let targetList = this.getAllNodes();
    for (let i = 0; i < targetList.length; i++) targetList[i].style.display = "";
  }
  // 获取备注所有节点
  getAllNodes() {
    return Object.values(document.querySelector("div[sct_notessearch]").nextElementSibling.querySelector(".well-header").nextElementSibling.children)
  }
}
new notesSearch();
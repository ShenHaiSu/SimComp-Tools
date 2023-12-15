const BaseComponent = require("../tools/baseComponent.js");
const { tools, componentList, runtimeData, indexDBData, feature_config, langData } = require("../tools/tools.js");

class warehouseChangeRecords extends BaseComponent {
  constructor() {
    super();
    this.name = "仓库变动统计";
    this.describe = "在仓库界面可以打开显示仓库变动统计";
    this.enable = false;
  }
  dependence = {
    cpt: [],
    url: [
      { name: "echarts", url: "https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js" }
    ]
  }
  indexDBData = {
    r0Data: [], // [{timeStamp:123,total:13,data:[ {name:"",amount:123,cost:53156} ]}]
    r1Data: [], // [{timeStamp:123,total:13,data:[ {name:"",amount:123,cost:53156} ]}]
    dataLength: 20, // 数据列表的长度
    norm: "amount", // 图表显示指标
    isDark: true, // 是否暗黑模式
  }
  componentData = {
    realm: undefined, // 服务器标签
    warehouseMountMain: undefined, // 仓库界面挂载节点
    warehouseIsOn: false, // 仓库界面表格是否被打开
    suspendDisplayMain: undefined, // 悬浮显示节点
  }
  netFuncList = [{ // 仓库数据拦截
    urlMatch: url => /v2\/resources\/$/.test(url),
    func: this.warehouseInfo
  }]
  commonFuncList = [{
    match: () => Boolean(/warehouse\/$/.test(location.href)),
    func: this.mountPanel
  }]

  cssText = [
    `div#script_warehouseChange_wMain{transition:ease-in-out 0.5s;width:100%;overflow-x:auto;overflow-y:hidden;padding:10px;color:var(--fontColor);}div#script_warehouseChange_wMain.script_hide{height:60px;}div#script_warehouseChange_wMain.script_show{height:600px;}button#script_warehouseChange_wButton{height:40px;width:60%;display:block;margin:0 auto 10px auto;transition:ease-in-out 0.5s;background-color:#727272;}button#script_warehouseChange_wButton:hover{background-color:#dddddd;color:rgb(78,78,78);box-shadow:0 0 5px 4px black;}div#script_warehouseChange_wMain>div:nth-of-type(2){max-width:500%;min-width:100%;height:430px;background-color:rgb(255,255,255,0.7);}div.col-md-6>div#script_warehouseChange_wMain.script_show,div.col-md-6>div#script_warehouseChange_wMain.script_hide{display:none !important;}`
  ]

  // 设置界面
  settingUI = async () => {
    let newNode = document.createElement("div");
    let htmlText = `<div class=header>仓库变动统计设置</div><div class=container><div><button class="btn script_opt_submit">保存更改</button></div><table><thead><tr><td>功能<td>设置<tbody><tr><td title=每一次查询仓库数据如果有变动则记录为一次数据,默认为20>历史数据长度<td><input type=number class=form-control value=#####><tr><td title=纵轴是数量或者价值>显示的指标<td><select class=form-control><option value=amount>数量<option value=cost>金额</select><tr><td title=是否开启暗黑模式>暗黑模式<td><input class='form-control' type=checkbox #####></table></div>`;

    htmlText = htmlText.replace("#####", this.indexDBData.dataLength);
    htmlText = htmlText.replace("#####", this.indexDBData.isDark ? "checked" : "");

    newNode.id = "script_warehouseChangeRecords_setting";
    newNode.innerHTML = htmlText;
    newNode.querySelector("select").value = this.indexDBData.norm;
    newNode.addEventListener('click', (event) => this.settingClickHandle(event));
    return newNode;
  }
  // 设置界面被点击
  settingClickHandle(event) {
    if (/script_opt_submit/.test(event.target.className)) return this.settingSubmit();
  }
  // 提交设置
  settingSubmit() {
    let valueList = Object.values(document.querySelectorAll("#script_warehouseChangeRecords_setting select, #script_warehouseChangeRecords_setting input"))
      .map(node => node.type == "checkbox" ? node.checked : node.value);
    // 审查
    valueList[0] = Math.floor(valueList[0]);
    if (valueList[0] <= 5) return tools.alert("数据量太小了.");
    // 删除显示
    let fresh = false;
    if (this.indexDBData.isDark != valueList[2]) fresh = true;
    // 保存
    this.indexDBData.dataLength = valueList[0];
    this.indexDBData.norm = valueList[1];
    this.indexDBData.isDark = valueList[2];
    tools.indexDB_updateIndexDBData();
    tools.alert("已保存");
    if (fresh) location.reload();
  }

  // 检测网络数据
  async warehouseInfo(url, method, resp) {
    resp = JSON.parse(resp).map(item => {
      return { name: item.kind.name, amount: item.amount, cost: Math.floor(Object.values(item.cost).reduce((acc, curr) => acc + curr, 0).toFixed(2)) }
    });
    let realm = this.componentData.realm == undefined ? await tools.getRealm() : this.componentData.realm;
    this.componentData.realm = realm;
    let targetData = this.indexDBData[`r${realm}Data`];
    let timeStamp = new Date().getTime();
    // 检查是否有变动
    let nowTotal = resp.reduce((acc, curr) => acc + curr.cost, 0);
    let lastTotal = targetData.lastItem?.total || 0;
    if (nowTotal == lastTotal) return;
    // 保存新数据
    if (targetData.length >= this.indexDBData.dataLength) targetData.splice(0, targetData.length - this.indexDBData.dataLength + 1);
    targetData.push({ timeStamp, total: nowTotal, data: resp });
    tools.indexDB_updateIndexDBData();
  }

  // 生成echart使用的配置
  genEchartConf(input, mode = "cost") {
    let output = {
      // 鼠标悬浮坐标显示
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } } },
      // 图例
      legend: { data: [] },
      // 小工具
      toolbox: { feature: { saveAsImage: {} } },
      // 栅格布局
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      // 横坐标信息
      xAxis: [{ type: 'category', boundaryGap: false, data: [] }],
      // 纵坐标信息
      yAxis: [{ type: "value" }],
      // 数据集
      series: []
    };

    // 生成图例 生成横坐标信息
    let legend = [];
    let xAxis = [];
    let dataSeries = [];
    for (let i = 0; i < input.length; i++) {
      if (!xAxis.includes(input[i].timeStamp)) xAxis.push(this.formatTimestampToHHmm(input[i].timeStamp));
      if (input[i].data.length == 0) continue;
      for (let j = 0; j < input[i].data.length; j++) {
        let item = input[i].data[j];
        if (!legend.includes(item.name)) {
          // 第一次存入
          legend.push(item.name);
          let chartData = { name: item.name, type: "line", stack: "Total", areaStyle: {}, emphasis: { focus: "series" }, data: [] };
          dataSeries.push(chartData);
        }
        // 根据索引写入数据
        let index = dataSeries.findIndex(e => e.name == item.name);
        dataSeries[index].data[i] = item[mode];
      }
    }
    // 去除空内容
    let length = xAxis.length;
    for (let i = 0; i < dataSeries.length; i++) {
      for (let j = 0; j < length; j++) {
        if (dataSeries[i].data[j]) continue;
        dataSeries[i].data[j] = 0;
      }
    }

    output.legend.data = legend;
    output.xAxis[0].data = xAxis;
    output.series = dataSeries;
    return output;
  }

  // 格式化时间显示
  formatTimestampToHHmm = (timestamp = "") => new Date(timestamp).toLocaleTimeString([], { hour12: false });

  // 挂载在仓库界面
  async mountPanel() {
    if (window.echarts == undefined) {
      await tools.dely(5000);
      return this.mountPanel();
    }
    try {
      // 创建容器标签
      if (this.componentData.warehouseMountMain == undefined) {
        let container = document.createElement("div");
        container.id = "script_warehouseChange_wMain";
        container.className = "script_hide";
        container.innerHTML = `<div><button class=btn id=script_warehouseChange_wButton>查看仓库历史变动</button></div><div id='script_warehouseChange_wCharts'></div>`
        this.componentData.warehouseMountMain = container;
        container.querySelector("button#script_warehouseChange_wButton").addEventListener('click', () => this.switchWarehouseMount());
      }
      // 检测是否已有
      if (document.querySelector("div#script_warehouseChange_wMain")) return;
      // 挂载 
      let targetNode = tools.getParentByIndex(document.querySelector("div.col-lg-10.col-md-9 button"), 2);
      targetNode.appendChild(this.componentData.warehouseMountMain);
    } catch (e) {
      tools.errorLog(e);
    }
  }
  // 仓库界面按钮被点击
  async switchWarehouseMount() {
    try {
      if (this.componentData.warehouseIsOn == false) {
        // 现在要打开表格
        this.componentData.warehouseMountMain.className = "script_show";
        let targetData = this.indexDBData[`r${this.componentData.realm}Data`];
        let chartConf = this.genEchartConf(targetData, this.indexDBData.norm);
        let targetNode = document.querySelector("div#script_warehouseChange_wCharts");
        Object.assign(targetNode.style, { width: "400px", height: "420px" });
        let myChart = window.echarts.init(targetNode, this.indexDBData.isDark ? "dark" : null);
        myChart.setOption(chartConf);
        // console.log(chartConf);
      } else {
        // 现在要关闭表格
        this.componentData.warehouseMountMain.className = "script_hide";
      }
      this.componentData.warehouseIsOn = !this.componentData.warehouseIsOn;
    } catch (error) {
      console.error(error);
    }
  }
}
new warehouseChangeRecords();
import express from "express";
import axios from "axios";

const router = express.Router();

export default router;

// 引入中间件
import requestFrequencyController from "./middleware/requestFrequencyController.mjs";
import globalErrorHandler from "./middleware/errorHandle.mjs";
// 挂载频率控制中间件
router.use(requestFrequencyController);

// 插件文件中转路由
let cachedPluginContent = null;
let lastUpdateTime = 0;

router.get("/plugin-download", async (req, res, next) => {
  try {
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // 检查缓存是否过期
    if (!cachedPluginContent || currentTime - lastUpdateTime > fiveMinutes) {
      const pluginRealUrl = "https://github.com/ShenHaiSu/SimComp-Tools/raw/refs/heads/master/dist/build.user.js";
      const response = await axios.get(pluginRealUrl, {
        responseType: 'text'
      });

      cachedPluginContent = response.data;
      lastUpdateTime = currentTime;
    }

    // 设置响应头并发送缓存内容
    res.setHeader('Content-Type', 'text/javascript');
    res.setHeader('Content-Disposition', 'attachment; filename=build.user.js');
    res.send(cachedPluginContent);
  } catch (error) {
    next(error);
  }
});


// 兜底错误处理
router.use(globalErrorHandler);
const runtimeDataPool = {}
const RATE_LIMIT = 5; // 单位时间最多请求次数
const TIME_WINDOW = 60000; // 单位时间长度（毫秒）

/**
 * Express中间件函数，用于控制请求频率
 * @param {import('express').Request} req - Express请求对象
 * @param {import('express').Response} res - Express响应对象
 * @param {import('express').NextFunction} next - Express next函数
 * @returns {void}
 */
export default (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const currentTime = Date.now();


  // 初始化或获取IP记录
  const ipData = runtimeDataPool[ip] || {
    count: 0,
    lastRequestTime: currentTime
  };

  // 更新时间窗口
  if (currentTime - ipData.lastRequestTime > TIME_WINDOW) {
    ipData.count = 0;
    ipData.lastRequestTime = currentTime;
  }

  // 检查请求限制
  if (ipData.count >= RATE_LIMIT) {
    res.status(429).send('请求过于频繁，请稍后再试');
    return;
  }

  // 更新计数器并继续处理请求
  runtimeDataPool[ip] = ipData;
  ipData.count++;
  next();
}
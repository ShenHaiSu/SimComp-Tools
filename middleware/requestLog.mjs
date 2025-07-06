import fs from 'fs';
import path from 'path';

const logDir = './logs';
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const today = new Date().toISOString().split('T')[0];
const logFile = path.join(logDir, `${today}.log`);

/**
 * Express中间件函数，用于记录请求日志
 * @param {Error} err - 错误对象
 * @param {import('express').Request} req - Express请求对象
 * @param {import('express').Response} res - Express响应对象
 * @param {import('express').NextFunction} next - Express next函数
 * @returns {void}
 */
export default (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const path = req.originalUrl;
  const logMessage = `${timestamp} [${ip}] ${path}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage);
  next();
}
import express from "express";
import fs from "node:fs";
import https from "node:https";

const ServerPort = 8081;
const app = express();

// 引入日志中间件
import requestLog from "./middleware/requestLog.mjs";
app.use(requestLog);

// 引入主路由入口
import mainRouter from "./mainRouter.mjs";

app.use("/api", mainRouter);

// 加密证书读取与使用
const options = {
  key: fs.readFileSync('./cert/key.pem'),
  cert: fs.readFileSync('./cert/cert.pem')
};

// 路由
const server = https.createServer(options, app);

// 启动监听
server.listen(ServerPort, () => {
  console.log(`Server is running on port ${ServerPort}`);
  console.log(`https://sct1.daoluolts.de:${ServerPort}`);
})
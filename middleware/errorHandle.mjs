/**
 * Express中间件函数，用户处理总体的错误处理
 * @param {Error} err - 错误对象
 * @param {import('express').Request} req - Express请求对象
 * @param {import('express').Response} res - Express响应对象
 * @param {import('express').NextFunction} next - Express next函数
 * @returns {void}
 */
export default (err, req, res, next) => {
  console.error(err);
  res.status(404).send(err.message || "错误。");
}
# PT站项目 Copilot 指令

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

这是一个LZU 内部PT站项目，包含以下特性：

## 项目结构
- `backend/` - Express.js API服务器
- `frontend/` - React前端应用

## 技术栈
- 后端：Node.js + Express.js + SQLite/PostgreSQL
- 前端：React + Axios
- 认证：JWT
- 文件处理：Multer

## 主要功能
1. 用户系统：注册、登录、权限管理
2. 种子管理：上传、下载、搜索
3. 积分系统：上传下载比例、积分计算
4. 管理功能：用户管理、种子审核

## 编码规范
- 使用ES6+语法
- 采用RESTful API设计
- 数据库使用ORM (Sequelize)
- 前端使用函数式组件和Hooks
- 错误处理要完善
- 安全性考虑（输入验证、SQL注入防护等）

## PT站特定需求
- Tracker服务器集成
- 种子文件解析
- 同伴连接管理
- 上传下载比例统计
- 邀请注册系统

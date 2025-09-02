# Node PT

一个基于Node.js和React的私有BitTorrent站点。

## 🌟 功能特性

### 核心功能
- 👥 **用户管理**: 注册、登录、权限管理
- 📁 **种子管理**: 上传、下载、搜索、分类
- 📊 **统计系统**: 上传下载比例、积分计算
- 🔐 **权限控制**: 不同用户权限（用户/管理员）

### 技术特性
- ⚡ **现代技术栈**: Node.js + Express + React + Material-UI
- 🛡️ **安全保障**: JWT认证、输入验证、SQL注入防护
- 📱 **响应式设计**: 支持桌面和移动设备
- 🗄️ **数据库**: PostgreSQL
- 🎨 **用户界面**: Material-UI组件库

## 🚀 快速开始

### 环境要求
- Node.js 16.0+
- npm 8.0+
- Git
- PostgreSQL 12+

### ⚡ 一键启动（推荐）

**Windows用户:**
```batch
# 一键启动（自动配置IP）
start.bat

# 或者完整启动脚本
start-pt-system.bat
```

**手动启动:**
```bash
# 安装所有依赖
npm run install:all

# 同时启动前后端服务
npm run dev
```

### 📍 访问地址

启动后可通过以下地址访问：
- **HTTPS入口（推荐）**: https://[您的IP]/
- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001/api
- **Tracker服务**: http://localhost:3001/announce

### 🎯 启动脚本说明

项目提供了多个Windows批处理脚本，简化启动过程：

- **`start.bat`** - 简洁版一键启动脚本
- **`start-pt-system.bat`** - 完整启动脚本（自动IP检测和配置更新）
- **`quick-start.bat`** - 快速启动（不修改配置）
- **`stop-pt-system.bat`** - 停止所有服务

详细说明请参考：[START-SCRIPTS-README.md](START-SCRIPTS-README.md)

### 🔧 分步安装

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd pt
   ```

2. **安装后端依赖**
   ```bash
   cd backend
   npm install
   ```

3. **配置数据库**
   ```bash
   # 交互式数据库设置
   npm run setup-db
   
   # 初始化数据库数据
   npm run init-db
   ```

4. **启动后端服务**
   ```bash
   # 开发模式（推荐）
   npm run dev
   
   # 或者分别启动
   npm run dev:backend  # 后端（端口3001）
   npm run dev:frontend # 前端（端口3000）
   ```

5. **访问应用**
   - 前端: http://localhost:3000
   - 后端API: http://localhost:3001/api

## 📁 项目结构

```
pt/
├── backend/                 # 后端API服务器
│   ├── models/             # 数据库模型
│   ├── routes/             # API路由
│   ├── middleware/         # 中间件
│   ├── uploads/            # 文件上传目录
│   ├── server.js           # 主服务器文件
│   └── init-db.js          # 数据库初始化
├── frontend/               # React前端应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── contexts/       # React上下文
│   │   ├── services/       # API服务
│   │   └── App.js          # 主应用组件
│   └── public/             # 静态资源
└── README.md               # 项目说明
```

## 🛠️ 开发指南

### 后端开发
```bash
cd backend
npm run dev          # 开发模式启动（热重载）
npm start            # 生产模式启动
npm run init-db      # 重新初始化数据库
```

### 前端开发
```bash
cd frontend
npm start            # 开发模式启动
npm run build        # 构建生产版本
npm test             # 运行测试
```

### API文档
后端API遵循RESTful设计原则：

- **认证**: `/api/auth/*`
  - POST `/auth/register` - 用户注册
  - POST `/auth/login` - 用户登录
  - GET `/auth/verify` - 验证token

- **用户**: `/api/users/*`
  - GET `/users/profile` - 获取用户资料
  - PUT `/users/profile` - 更新用户资料
  - GET `/users/stats` - 获取用户统计

- **种子**: `/api/torrents/*`
  - GET `/torrents` - 获取种子列表
  - POST `/torrents` - 上传种子
  - GET `/torrents/:id` - 获取种子详情
  - GET `/torrents/:id/download` - 下载种子文件

## 🔧 配置说明

### 后端配置 (.env)
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your_secret_key
DB_DIALECT=sqlite
MAX_FILE_SIZE=100000000
SITE_NAME=LZU PT站
SIGNUP_ENABLED=true
INVITE_ONLY=false
```

### 前端配置 (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SITE_NAME=LZU PT站
```


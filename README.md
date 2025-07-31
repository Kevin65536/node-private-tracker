# LZU PT站

一个基于Node.js和React的私有BitTorrent站点，专为LZU内部资源分享而设计。

## 🌟 功能特性

### 核心功能
- 👥 **用户管理**: 注册、登录、权限管理
- 📁 **种子管理**: 上传、下载、搜索、分类
- 📊 **统计系统**: 上传下载比例、积分计算
- 🔐 **权限控制**: 多级用户权限（用户/VIP/版主/管理员）
- 🎯 **邀请系统**: 邀请码注册（可选）

### 技术特性
- ⚡ **现代技术栈**: Node.js + Express + React + Material-UI
- 🛡️ **安全保障**: JWT认证、输入验证、SQL注入防护
- 📱 **响应式设计**: 支持桌面和移动设备
- 🗄️ **数据库**: SQLite（开发）/PostgreSQL（生产）
- 🎨 **用户界面**: Material-UI组件库

## 🚀 快速开始

### 环境要求
- Node.js 16.0+
- npm 8.0+
- Git
- PostgreSQL 12+

### ⚡ 一键启动（推荐）

```bash
# 安装所有依赖
npm run install:all

# 同时启动前后端服务
npm run dev
```

### 📍 访问地址

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001/api

### 👤 测试账户

- **管理员**: admin / admin123456  
- **普通用户**: testuser / test123456

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

## 📦 部署

### 生产环境部署
1. 构建前端应用
2. 配置反向代理（nginx）
3. 设置PM2进程管理
4. 配置SSL证书
5. 设置定时任务

### Docker部署（计划中）
```bash
docker-compose up -d
```

## 🤝 贡献指南

1. Fork本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Node.js](https://nodejs.org/) - 后端运行时
- [React](https://reactjs.org/) - 前端框架
- [Material-UI](https://mui.com/) - UI组件库
- [Express](https://expressjs.com/) - Web框架
- [Sequelize](https://sequelize.org/) - ORM框架

## 📞 支持

如果您在使用过程中遇到问题，请：
1. 查看文档和FAQ
2. 搜索已有的Issues
3. 创建新的Issue描述问题
4. 加入讨论群组

---

**注意**: 本项目仅供教育和学习使用，请遵守相关法律法规。

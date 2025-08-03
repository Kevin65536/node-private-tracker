# PT站项目迁移部署指南

## 📋 迁移前准备清单

### 1. 目标服务器环境检查
- [ ] Node.js (v18+) 已安装
- [ ] PostgreSQL 已安装并运行
- [ ] Git 已安装
- [ ] 防火墙端口 3000, 3001 已开放
- [ ] 网络连接正常

### 2. 当前项目状态记录
- [ ] 记录当前服务器IP: 172.21.48.71
- [ ] 记录目标服务器IP: [待填写]
- [ ] 记录数据库用户密码
- [ ] 备份重要配置文件

## 🎯 迁移步骤

### 第一步：代码迁移

#### 方法1：使用Git (推荐)
```bash
# 在目标服务器上
cd /path/to/your/deployment/directory
git clone https://github.com/Kevin65536/LAN-private-tracker.git
cd LAN-private-tracker
```

#### 方法2：直接复制
```bash
# 打包当前项目（排除测试文件）
tar -czf pt-site-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=backend/test-*.js \
  --exclude=backend/uploads/test-* \
  --exclude=.git \
  backend/ frontend/ package.json README.md .github/

# 传输到目标服务器并解压
```

### 第二步：数据库迁移

#### PostgreSQL数据导出（当前服务器）
```bash
# 导出数据库结构和数据
pg_dump -h localhost -U postgres -d pt_database > pt_database_backup.sql

# 或者只导出结构
pg_dump -h localhost -U postgres -d pt_database --schema-only > pt_database_schema.sql
```

#### PostgreSQL数据导入（目标服务器）
```bash
# 创建数据库
createdb -U postgres pt_database

# 导入数据
psql -h localhost -U postgres -d pt_database < pt_database_backup.sql
```

### 第三步：环境配置

#### 1. 安装依赖
```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

#### 2. 配置环境变量
复制 `.env.example` 到 `.env` 并修改：

```bash
# 服务器配置
NODE_ENV=production
PORT=3001

# 数据库配置
DB_NAME=pt_database
DB_USER=postgres
DB_PASSWORD=[您的密码]
DB_HOST=localhost
DB_PORT=5432
DB_DIALECT=postgres

# JWT密钥 (生产环境请更换)
JWT_SECRET=[生成新的随机密钥]

# PT站配置 - 重要：更新IP地址
ANNOUNCE_URL=http://[目标服务器IP]:3001
FRONTEND_URL=http://[目标服务器IP]:3000

# 其他配置...
```

### 第四步：网络和安全配置

#### 1. 防火墙配置
```bash
# Windows (以管理员身份运行)
netsh advfirewall firewall add rule name="PT-Site-Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="PT-Site-Backend" dir=in action=allow protocol=TCP localport=3001

# Linux
sudo ufw allow 3000
sudo ufw allow 3001
```

#### 2. 获取目标服务器IP
```bash
# Windows
ipconfig
# 或
node -e "const { getBestLocalIP } = require('./backend/utils/network'); console.log(getBestLocalIP());"

# Linux
ip addr show
# 或
hostname -I
```

### 第五步：启动和测试

#### 1. 数据库初始化
```bash
cd backend
npm run init-db  # 如果有初始化脚本
# 或
node init-db.js
```

#### 2. 启动服务
```bash
# 后端
cd backend
npm start

# 前端（新终端）
cd frontend
npm start
```

## ⚠️ 关键注意事项

### 1. IP地址更新
- 必须更新 `.env` 中的 `ANNOUNCE_URL` 为目标服务器IP
- 用户下载的种子文件将包含新的tracker地址
- 现有用户需要重新下载种子文件以获得正确的tracker地址

### 2. 数据库密码安全
- 生产环境必须使用强密码
- 建议创建专门的数据库用户而非使用postgres超级用户

### 3. JWT密钥更新
- 生产环境必须生成新的JWT_SECRET
- 更换后所有用户需要重新登录

### 4. 文件权限
- 确保 `uploads/` 目录有写权限
- 确保日志目录有写权限

### 5. 测试文件清理
- 不要迁移 `test-*.js` 文件
- 不要迁移测试用的种子文件
- 清理 `uploads/` 目录中的测试文件

## 🔍 迁移后验证清单

### 基础功能测试
- [ ] 服务器启动成功，无错误日志
- [ ] 数据库连接正常
- [ ] 前端页面正常访问
- [ ] 健康检查接口响应正常: `http://[新IP]:3001/health`

### 用户功能测试
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 密码重置功能正常
- [ ] 用户资料修改正常

### PT核心功能测试
- [ ] 种子上传功能正常
- [ ] 种子下载功能正常
- [ ] Tracker announce正常响应
- [ ] 上传下载统计正常
- [ ] Passkey生成和验证正常

### 网络连通性测试
- [ ] 从其他PC能正常访问前端
- [ ] 从其他PC能正常访问API
- [ ] BitTorrent客户端能连接tracker
- [ ] 种子文件包含正确的tracker地址

## 🛠️ 故障排除

### 常见问题
1. **数据库连接失败**
   - 检查PostgreSQL服务是否启动
   - 验证数据库用户名密码
   - 检查防火墙是否阻止5432端口

2. **tracker连接失败**
   - 验证ANNOUNCE_URL配置
   - 检查防火墙端口3001
   - 确认种子文件中的tracker地址正确

3. **文件上传失败**
   - 检查uploads目录权限
   - 验证磁盘空间
   - 确认MAX_FILE_SIZE配置

### 日志检查
```bash
# 查看应用日志
tail -f backend/logs/app.log

# 查看错误日志
tail -f backend/logs/error.log

# 查看PostgreSQL日志（Windows）
# 查看事件查看器中的PostgreSQL日志
```

## 📞 技术支持

如果遇到问题，请提供：
- 错误日志信息
- 网络配置信息
- 操作系统版本
- Node.js和PostgreSQL版本

---

📝 **迁移完成后别忘了：**
- 备份新服务器上的配置文件
- 设置定期数据库备份
- 监控服务器性能和磁盘使用
- 通知用户新的访问地址

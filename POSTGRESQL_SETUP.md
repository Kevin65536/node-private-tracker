# PostgreSQL 设置指南

## 🔧 快速设置步骤

### 1. 设置数据库
```bash
npm run setup-db
```
这个命令会：
- 提示您输入PostgreSQL密码
- 创建PT站数据库
- 更新配置文件

### 2. 测试数据库连接
```bash
npm run test-db
```

### 3. 检查数据库状态
```bash
npm run check-db
```

### 4. 初始化数据库数据
```bash
npm run init-db
```

### 5. 启动带数据库的服务器
```bash
npm run dev:db
```

## 📋 命令参考

| 命令 | 说明 |
|------|------|
| `npm run setup-db` | 交互式数据库设置 |
| `npm run test-db` | 测试数据库连接 |
| `npm run check-db` | 检查数据库状态和数据 |
| `npm run init-db` | 初始化数据库表和基础数据 |
| `npm run dev:db` | 启动开发服务器（使用数据库） |
| `npm run start:db` | 启动生产服务器（使用数据库） |

## 🛠️ 手动设置（如果需要）

### 创建数据库
```sql
-- 连接到PostgreSQL
psql -U postgres

-- 创建数据库
CREATE DATABASE pt_database;

-- 创建用户（可选）
CREATE USER pt_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE pt_database TO pt_user;
```

### 环境变量配置
在 `.env` 文件中设置：
```env
DB_NAME=pt_database
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_DIALECT=postgres
```

## 🔍 故障排除

### PostgreSQL服务未启动
```bash
# Windows
net start postgresql-x64-14

# 或者在服务管理器中启动PostgreSQL服务
```

### 密码认证失败
1. 检查密码是否正确
2. 确认用户权限
3. 检查pg_hba.conf配置

### 数据库不存在
```sql
-- 在psql中创建数据库
CREATE DATABASE pt_database;
```

### 连接被拒绝
1. 确认PostgreSQL服务运行中
2. 检查端口是否正确 (默认5432)
3. 确认防火墙设置

## 📊 数据库结构

初始化后将创建以下表：
- `users` - 用户表
- `user_stats` - 用户统计表
- `categories` - 分类表
- `torrents` - 种子表
- `downloads` - 下载记录表

## 🎯 下一步

设置完成后，您可以：
1. 访问 http://localhost:3001/api/health 检查服务状态
2. 使用默认账户登录前端应用
3. 开始开发更多功能

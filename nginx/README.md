# PT站 Nginx 配置指南

本目录包含为PT站项目配置Nginx反向代理的所有必要文件和脚本。

## 📁 文件说明

| 文件名 | 描述 | 用途 |
|--------|------|------|
| `pt-site.conf` | 开发环境Nginx配置 | 代理到React开发服务器(3000) |
| `pt-site-production.conf` | 生产环境Nginx配置 | 服务静态构建文件 |
| `setup-nginx.bat` | Nginx安装配置脚本 | 一键安装和配置 |
| `manage-nginx.bat` | Nginx管理脚本 | 启动/停止/重启服务 |
| `check-deployment.bat` | 部署检查脚本 | 验证配置是否正确 |

## 🚀 快速开始

### 1. 安装和配置Nginx
```batch
# 以管理员身份运行
cd nginx
setup-nginx.bat
```

### 2. 检查部署状态
```batch
check-deployment.bat
```

### 3. 启动服务
```batch
# 启动后端服务
cd ..\backend
npm start

# 启动前端服务（开发模式）
cd ..\frontend
npm start

# 启动Nginx
cd ..\nginx
manage-nginx.bat start
```

### 4. 访问网站
- 前端: http://localhost
- API: http://localhost/api/health
- Tracker: http://localhost/announce

## 🔧 管理命令

```batch
# 查看服务状态
manage-nginx.bat status

# 启动Nginx
manage-nginx.bat start

# 停止Nginx
manage-nginx.bat stop

# 重启Nginx
manage-nginx.bat restart

# 重新加载配置
manage-nginx.bat reload

# 检查配置语法
manage-nginx.bat test

# 查看日志
manage-nginx.bat logs          # 访问日志
manage-nginx.bat logs error    # 错误日志
```

## 🏗️ 架构说明

### 开发环境架构
```
客户端 → Nginx (80) → React开发服务器 (3000)
                  → Express API (3001)
```

### 生产环境架构
```
客户端 → Nginx (80/443) → 静态文件 (直接服务)
                       → Express API (3001)
```

## 📋 配置要点

### 1. 反向代理配置
- **前端**: 代理到React开发服务器或直接服务构建文件
- **API**: 代理到Express后端服务
- **Tracker**: 专门优化的BitTorrent协议代理

### 2. 安全配置
- 限制请求频率（防DOS攻击）
- BitTorrent客户端UA检查
- 敏感文件访问阻止
- 安全头设置

### 3. 性能优化
- 静态文件缓存
- Gzip压缩
- 连接keep-alive
- 上游健康检查

### 4. PT站特殊优化
- **Tracker服务**: 无缓存、快速响应
- **文件上传**: 大文件支持、进度跟踪
- **种子下载**: 直接文件服务

## 🔒 安全注意事项

### 1. 生产环境配置
- 更换默认SSL证书
- 配置防火墙规则
- 启用HTTPS重定向
- 设置IP白名单（管理接口）

### 2. 访问控制
```nginx
# 管理员API限制
location /api/admin {
    allow 192.168.1.0/24;  # 只允许内网访问
    deny all;
}
```

### 3. 防止滥用
```nginx
# Tracker频率限制
limit_req zone=tracker burst=5 nodelay;

# 只允许BT客户端
if ($http_user_agent !~* "BitTorrent|uTorrent") {
    return 403;
}
```

## 🌍 环境变量配置

创建 `backend/.env` 文件：
```env
NODE_ENV=production
ANNOUNCE_URL=http://your-domain.com/announce
FRONTEND_URL=http://your-domain.com
TRUST_PROXY=true
```

## 📊 监控和维护

### 1. 日志文件位置
- 访问日志: `C:\nginx\logs\pt_access.log`
- 错误日志: `C:\nginx\logs\pt_error.log`
- Tracker日志: `C:\nginx\logs\tracker_access.log`

### 2. 健康检查端点
- Nginx状态: `http://localhost/health`
- 后端健康: `http://localhost:3001/health`

### 3. 性能监控
```bash
# 查看连接数
netstat -an | find ":80" | find "ESTABLISHED" | find /c /v ""

# 查看进程状态
tasklist | find "nginx.exe"
```

## 🔄 版本升级

### 从开发环境切换到生产环境
1. 构建前端: `cd frontend && npm run build`
2. 复制生产配置: `copy pt-site-production.conf pt-site.conf`
3. 修改文件路径为实际路径
4. 重新加载: `manage-nginx.bat reload`

### 更新配置
1. 修改配置文件
2. 测试语法: `manage-nginx.bat test`
3. 重新加载: `manage-nginx.bat reload`

## 🆘 故障排除

### 常见问题

#### 1. 端口80被占用
```batch
# 查看占用进程
netstat -ano | find ":80"
# 结束进程
taskkill /f /pid [PID]
```

#### 2. 配置文件错误
```batch
# 检查语法
manage-nginx.bat test
# 查看错误日志
manage-nginx.bat logs error
```

#### 3. 上游服务不可用
```batch
# 检查后端服务
curl http://localhost:3001/health
# 重启后端
cd backend && npm restart
```

#### 4. 权限问题
- 确保以管理员身份运行安装脚本
- 检查文件夹权限设置

### 联系支持
如遇到问题，请检查：
1. 错误日志文件
2. 配置文件语法
3. 端口占用情况
4. 防火墙设置

---

## 📝 更新日志

- **v1.0.0**: 初始版本，支持基本反向代理
- **v1.1.0**: 添加生产环境配置和SSL支持
- **v1.2.0**: 优化PT站特殊需求和安全配置

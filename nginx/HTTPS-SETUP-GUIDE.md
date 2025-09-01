# PT站 HTTPS配置完整指南

## 概述
已为您的PT站配置完整的HTTPS支持，包括自动HTTP重定向、SSL证书生成和安全头设置。

## 配置文件说明

### 1. nginx.conf
- **位置**: `c:\Users\qdsxh\Desktop\toys\pt\nginx\nginx.conf`
- **功能**: 主配置文件，包含HTTP到HTTPS重定向和HTTPS服务器配置
- **特性**:
  - HTTP(80端口)自动重定向到HTTPS(443端口)
  - 完整的SSL/TLS安全配置
  - 安全头设置(HSTS, X-Frame-Options等)
  - Gzip压缩和性能优化

### 2. pt-site.conf
- **位置**: `c:\Users\qdsxh\Desktop\toys\pt\nginx\pt-site.conf`
- **功能**: 站点特定的location配置
- **特性**:
  - React前端代理配置
  - API路由代理
  - Tracker服务配置
  - 文件上传/下载优化
  - 限流和安全控制

## 部署步骤

### 第一步：生成SSL证书
```batch
# 运行高级证书生成脚本
cd c:\Users\qdsxh\Desktop\toys\pt\nginx
generate-ssl-cert-advanced.bat
```

这会在 `C:\nginx\ssl\` 目录下生成：
- `pt.local.key` - 私钥文件
- `pt.local.crt` - 证书文件
- `pt.local.pem` - PEM格式证书

### 第二步：复制配置文件
```batch
# 手动复制配置文件到nginx目录
copy nginx.conf C:\nginx\conf\nginx.conf
copy pt-site.conf C:\nginx\conf\pt-site.conf
```

### 第三步：启动HTTPS服务
```batch
# 使用一键启动脚本
start-https-server.bat
```

或手动启动：
```batch
cd C:\nginx
nginx.exe
```

## 访问方式

配置完成后，可通过以下方式访问：

### HTTPS访问（推荐）
- https://localhost/
- https://pt.local/ (需配置hosts文件)

### HTTP访问
- http://localhost/ (自动重定向到HTTPS)
- http://pt.local/ (自动重定向到HTTPS)

## 安全特性

### 1. SSL/TLS配置
- 支持TLS 1.2和TLS 1.3
- 使用现代加密套件
- 禁用不安全的协议和算法

### 2. HTTP安全头
- **HSTS**: 强制HTTPS访问
- **X-Frame-Options**: 防止点击劫持
- **X-Content-Type-Options**: 防止MIME类型嗅探
- **X-XSS-Protection**: XSS保护
- **Referrer-Policy**: 控制引用信息泄露

### 3. 限流配置
- API请求：10请求/秒
- Tracker请求：2请求/秒
- 文件上传：1请求/秒

## 故障排除

### 1. 证书警告
首次访问时浏览器会显示证书警告：
- Chrome: 点击"高级" → "继续访问localhost(不安全)"
- Firefox: 点击"高级" → "添加例外"

### 2. 无法访问
检查以下项目：
- Nginx服务是否启动：`tasklist | findstr nginx`
- 端口是否被占用：`netstat -an | findstr :443`
- 前后端服务是否运行：确保3000和3001端口服务正常
- 查看错误日志：`C:\nginx\logs\error.log`

### 3. 502错误
- 检查后端服务(3001端口)是否正常运行
- 确认upstream配置正确
- 查看nginx错误日志

## 配置文件特点

### 性能优化
- Gzip压缩
- Keepalive连接
- 静态文件缓存
- 文件发送优化

### 安全加固
- 隐藏Nginx版本
- 阻止敏感目录访问
- User-Agent检查(Tracker)
- 错误页面自定义

### PT站特化
- BitTorrent客户端支持
- 种子文件上传优化
- Tracker服务专门配置
- 文件下载性能优化

## 生产环境建议

1. **使用正式证书**: 将自签名证书替换为CA签发的证书
2. **配置防火墙**: 只开放必要的端口(80, 443)
3. **启用访问日志**: 监控访问情况
4. **设置日志轮转**: 防止日志文件过大
5. **配置备份**: 定期备份配置文件和证书

## 维护命令

```batch
# 重新加载配置
nginx -s reload

# 停止服务
nginx -s quit

# 强制停止
taskkill /F /IM nginx.exe

# 测试配置
nginx -t

# 查看版本
nginx -v
```

## 注意事项

1. **证书有效期**: 自签名证书有效期为2年，到期前需要重新生成
2. **域名配置**: pt.local需要在hosts文件中配置：`127.0.0.1 pt.local`
3. **防火墙**: 确保Windows防火墙允许nginx.exe通信
4. **服务依赖**: HTTPS服务依赖前后端服务正常运行

配置完成后，您的PT站将具备企业级的HTTPS安全访问能力！

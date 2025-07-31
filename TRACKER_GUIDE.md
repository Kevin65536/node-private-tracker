# 🎯 Private Tracker 使用指南

## 📋 概述

PT站包含完整的Private Tracker功能，支持BitTorrent协议的announce和scrape操作。每个用户都有唯一的Passkey用于身份验证。

## 🚀 快速开始

### 启动Tracker服务

```bash
cd backend
npm start
```

### 一键测试（推荐）

```bash
cd backend
npm run start-tracker-test
```

此命令会自动：
- ✅ 初始化数据库
- ✅ 启动服务器
- ✅ 运行所有测试
- ✅ 创建测试种子文件

## 🔧 功能测试

### 1. 健康检查

```bash
curl http://localhost:3001/health
```

期望响应：
```json
{
  "status": "OK",
  "message": "PT站服务正常运行",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "tracker": "enabled"
}
```

### 2. 获取用户Passkey

**方法1 - 通过数据库查询：**
```sql
SELECT u.username, up.passkey 
FROM users u 
JOIN user_passkeys up ON u.id = up.user_id 
WHERE u.username = 'admin';
```

**方法2 - 通过API（需要JWT token）：**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/users/profile
```

### 3. 测试Announce端点

```bash
# 替换 YOUR_PASSKEY 为实际passkey
curl "http://localhost:3001/announce/YOUR_PASSKEY?info_hash=%12%34%56%78%9a%bc%de%f0%12%34%56%78%9a%bc%de%f0%12%34%56%78&peer_id=-PT0001-123456789012&port=6881&uploaded=0&downloaded=0&left=1000000&event=started&compact=1"
```

### 4. 测试Scrape端点

```bash
curl "http://localhost:3001/scrape/YOUR_PASSKEY?info_hash=%12%34%56%78%9a%bc%de%f0%12%34%56%78%9a%bc%de%f0%12%34%56%78"
```

## 🎮 使用真实BitTorrent客户端

### 创建测试种子

```bash
# 使用内置种子生成器
npm run create-torrent YOUR_PASSKEY
```

### 客户端测试

1. **添加种子文件**：在 `backend/uploads/` 目录下找到生成的 `.torrent` 文件
2. **导入客户端**：使用qBittorrent、Transmission等客户端添加种子
3. **验证连接**：检查Tracker状态应显示"Working"或"已连接"

### 支持的客户端

- ✅ qBittorrent
- ✅ Transmission
- ✅ uTorrent
- ✅ Deluge
- ✅ 其他标准BitTorrent客户端

## 📊 监控和调试

### 查看活跃Peer

```sql
SELECT * FROM peers WHERE last_announce > NOW() - INTERVAL '1 hour';
```

### 查看Announce日志

```sql
SELECT * FROM announce_logs ORDER BY created_at DESC LIMIT 10;
```

### 查看统计信息

```bash
curl http://localhost:3001/api/stats
```

## 🐛 故障排除

### 常见问题

**1. "Invalid passkey" 错误**
- 检查passkey是否正确
- 确认用户passkey状态为active
- 验证数据库连接

**2. Tracker连接失败**
- 确认PostgreSQL服务运行
- 检查端口3001是否开放
- 验证防火墙设置

**3. 客户端无法连接**
- 检查announce URL格式
- 确认passkey有效性
- 查看服务器日志

### 调试命令

```bash
# 测试数据库连接
npm run test-db

# 检查数据库状态
npm run check-db

# 运行完整Tracker测试
npm run test-tracker
```

## 🔒 安全注意事项

1. **Passkey保护**：用户的Passkey相当于密码，不应泄露
2. **定期更新**：建议定期重新生成Passkey
3. **访问控制**：确保只有授权用户能获取种子文件
4. **日志监控**：定期检查异常的announce请求

## 📈 性能监控

### 关键指标

- **活跃Peers数量**：当前连接的客户端数
- **Announce频率**：每小时的请求数量
- **种子健康度**：Seeder/Leecher比例
- **数据库性能**：查询响应时间

### 优化建议

- 使用Redis缓存热点数据
- 定期清理过期的Peer记录
- 监控数据库查询性能
- 配置适当的announce间隔

---

**💡 提示**：在生产环境中，建议配置HTTPS和适当的访问控制策略。

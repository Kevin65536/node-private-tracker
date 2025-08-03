# PT站内网访问配置指南

## 网络配置概览

你的PT站现在已经配置为支持内网访问，其他设备可以通过内网IP地址访问你的开发服务器。

### 当前网络配置

- **本机IP地址**: `172.21.101.2`
- **子网掩码**: `255.255.0.0` (172.21.0.0/16)
- **网关**: `172.21.0.1`

### 服务地址

#### 前端应用 (React)
- 本地访问: `http://localhost:3000`
- 内网访问: `http://172.21.101.2:3000`

#### 后端API (Express)
- 本地访问: `http://localhost:3001`
- 内网访问: `http://172.21.101.2:3001`
- API根路径: `http://172.21.101.2:3001/api`
- Tracker服务: `http://172.21.101.2:3001/announce`

## 配置更改说明

### 1. 后端服务器配置 (`backend/server.js`)

```javascript
// CORS配置 - 允许内网设备访问
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'http://172.21.101.2:3000',  // 本机内网IP
    /^http:\/\/172\.21\.\d+\.\d+:3000$/  // 同网段设备
  ],
  credentials: true
}));

// 服务器监听所有网络接口
app.listen(PORT, '0.0.0.0', () => {
  // ...
});
```

### 2. 前端API配置 (`frontend/src/services/api.js`)

```javascript
// 动态API地址配置
function getApiBaseUrl() {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  } else {
    // 自动使用当前访问的IP访问后端
    return `http://${hostname}:3001/api`;
  }
}
```

## 内网设备访问指南

### 对于同一内网的其他设备

1. **确保设备在同一内网**: 设备IP应在 `172.21.x.x` 范围内
2. **访问前端应用**: 在浏览器中输入 `http://172.21.101.2:3000`
3. **直接访问API**: `http://172.21.101.2:3001/api`

### 支持的设备类型

- **Windows/Mac/Linux 电脑**: 使用任何现代浏览器
- **手机/平板**: 
  - iOS Safari
  - Android Chrome
  - 其他移动浏览器
- **其他设备**: 任何支持HTTP的设备

## 防火墙配置

### Windows防火墙

如果遇到访问问题，可能需要配置Windows防火墙：

```powershell
# 允许端口3000和3001的入站连接
netsh advfirewall firewall add rule name="PT Site Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="PT Site Backend" dir=in action=allow protocol=TCP localport=3001
```

### 或通过图形界面

1. 打开"Windows Defender 防火墙"
2. 点击"高级设置"
3. 选择"入站规则" → "新建规则"
4. 选择"端口" → "TCP" → 输入"3000,3001"
5. 选择"允许连接"
6. 应用到所有配置文件

## 测试连接

### 快速测试命令

```bash
# 测试后端API健康状态
curl http://172.21.101.2:3001/api/health

# 测试前端是否可访问
curl -I http://172.21.101.2:3000
```

### 浏览器测试

1. **后端API测试**: 访问 `http://172.21.101.2:3001/api/health`
2. **前端应用测试**: 访问 `http://172.21.101.2:3000`

## 故障排除

### 常见问题

1. **连接被拒绝**
   - 检查防火墙设置
   - 确认服务器正在运行
   - 验证IP地址是否正确

2. **CORS错误**
   - 确认后端CORS配置已更新
   - 重启后端服务器

3. **API请求失败**
   - 检查前端API配置
   - 确认后端服务器可访问

### 调试工具

```bash
# 检查端口监听状态
netstat -an | findstr ":3000\|:3001"

# 检查网络连接
ping 172.21.101.2

# 测试端口连通性
telnet 172.21.101.2 3001
```

## 注意事项

### 安全考虑

- **开发环境**: 当前配置适用于开发环境
- **生产环境**: 生产部署时需要额外的安全配置
- **网络隔离**: 确保在受信任的内网环境中使用

### 性能考虑

- **网络延迟**: 内网访问可能比本地访问稍慢
- **带宽限制**: 考虑内网带宽限制
- **并发连接**: 注意多设备同时访问的性能影响

## 高级配置

### 环境变量配置

创建 `.env` 文件进行自定义配置：

```env
# 前端环境变量 (frontend/.env)
REACT_APP_API_URL=http://172.21.101.2:3001/api

# 后端环境变量 (backend/.env)
PORT=3001
FRONTEND_URL=http://172.21.101.2:3000
```

### 动态主机名

如果IP地址经常变化，可以考虑：

1. **设置静态IP**: 在路由器中配置DHCP保留
2. **使用主机名**: 配置本地DNS或hosts文件
3. **自动发现**: 实现服务发现机制

---

## 快速启动清单

✅ 1. 更新后端CORS配置  
✅ 2. 修改服务器监听地址  
✅ 3. 更新前端API配置  
✅ 4. 重启后端服务器  
✅ 5. 配置防火墙规则  
✅ 6. 测试内网访问  

现在其他内网设备可以通过 `http://172.21.101.2:3000` 访问你的PT站了！

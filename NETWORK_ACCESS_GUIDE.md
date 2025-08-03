# 内网访问配置指南

## 🔧 解决内网访问问题

根据你的截图显示的错误 "ERR_CONNECTION_TIMED_OUT"，这是网络连接被阻止的问题。需要配置以下几个方面：

## 🛡️ 第一步：Windows防火墙配置

### 方法1：图形界面配置
1. 打开 "Windows Defender 防火墙"
2. 点击 "允许应用或功能通过 Windows Defender 防火墙"
3. 点击 "更改设置" 
4. 点击 "允许其他应用"
5. 浏览并添加 `node.exe`（通常在 `C:\Program Files\nodejs\node.exe`）
6. 确保勾选 "专用" 和 "公用" 网络

### 方法2：命令行配置（管理员权限）
```cmd
:: 允许Node.js应用通过防火墙
netsh advfirewall firewall add rule name="Node.js App" dir=in action=allow program="C:\Program Files\nodejs\node.exe"

:: 或者直接开放端口
netsh advfirewall firewall add rule name="PT-Site-Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="PT-Site-Backend" dir=in action=allow protocol=TCP localport=3001

:: 查看防火墙规则
netsh advfirewall firewall show rule name="PT-Site-Frontend"
netsh advfirewall firewall show rule name="PT-Site-Backend"
```

## 🌐 第二步：网络发现配置

### 启用网络发现
1. 打开 "控制面板" > "网络和共享中心"
2. 点击 "更改高级共享设置"
3. 展开 "专用" 配置文件
4. 选择：
   - ✅ 启用网络发现
   - ✅ 启用文件和打印机共享
5. 展开 "公用" 配置文件，做同样设置
6. 点击 "保存更改"

## 🔍 第三步：验证网络配置

### 检查服务器IP和端口
```cmd
:: 查看当前IP地址
ipconfig
:: 查看监听的端口
netstat -an | findstr :3000
netstat -an | findstr :3001
```

### 测试本地访问
```cmd
:: 测试本地访问
curl http://localhost:3000
curl http://localhost:3001/health
:: 或用浏览器访问
start http://localhost:3000
```

### 测试内网访问
从其他内网设备测试：
```cmd
:: 替换为实际IP地址
curl http://172.21.134.69:3000
curl http://172.21.134.69:3001/health
```

## ⚙️ 第四步：应用配置检查

### 检查绑定地址
确保应用绑定到所有网络接口，而不是只绑定localhost：

```javascript
// server.js 中应该是：
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
});

// 而不是：
app.listen(PORT, 'localhost', () => {
  // 这样只能本地访问
});
```

## 🚨 第五步：故障排除

### 常见问题和解决方案

1. **端口被占用**
```cmd
:: 检查端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :3001
:: 如果被占用，结束进程或更换端口
```

2. **应用只绑定localhost**
检查代码中的监听配置，确保绑定到 `0.0.0.0` 而非 `localhost`

3. **杀毒软件阻止**
- 检查杀毒软件是否阻止了网络连接
- 将node.exe添加到杀毒软件白名单

4. **路由器/网络设备限制**
- 检查是否有企业网络策略限制
- 咨询网络管理员是否有端口限制

## 🔧 第六步：自动化配置脚本

创建一个配置脚本来自动完成网络设置：

```cmd
@echo off
echo 配置PT站内网访问...

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 需要管理员权限，请右键以管理员身份运行
    pause
    exit /b 1
)

:: 配置防火墙规则
echo 配置防火墙规则...
netsh advfirewall firewall delete rule name="PT-Site-Frontend" >nul 2>&1
netsh advfirewall firewall delete rule name="PT-Site-Backend" >nul 2>&1
netsh advfirewall firewall add rule name="PT-Site-Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="PT-Site-Backend" dir=in action=allow protocol=TCP localport=3001

:: 允许Node.js程序
for /f "tokens=*" %%i in ('where node 2^>nul') do (
    echo 允许Node.js程序: %%i
    netsh advfirewall firewall add rule name="Node.js PT-Site" dir=in action=allow program="%%i"
)

:: 显示当前IP
echo.
echo 当前服务器IP地址:
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr "IPv4"') do echo %%i

echo.
echo 配置完成！其他用户现在应该可以通过以下地址访问：
echo 前端: http://你的IP:3000
echo API: http://你的IP:3001
echo.
pause
```

## 📱 第七步：移动设备访问

如果需要手机等移动设备访问：

1. 确保手机连接相同WiFi网络
2. 在手机浏览器输入：`http://172.21.134.69:3000`
3. 如果仍无法访问，检查路由器设置中的"客户端隔离"功能是否开启

## 🏢 企业网络注意事项

如果在企业/学校网络环境：

1. **端口策略**：某些机构可能阻止特定端口
2. **防火墙策略**：可能有集中的防火墙策略
3. **网络隔离**：不同网段可能被隔离
4. **咨询IT管理员**：获得必要的网络权限

## ✅ 验证清单

配置完成后，请验证：

- [ ] 本地可以访问 `http://localhost:3000`
- [ ] 本地可以访问 `http://localhost:3001/health`  
- [ ] 内网其他设备可以访问 `http://你的IP:3000`
- [ ] 内网其他设备可以访问 `http://你的IP:3001/health`
- [ ] 防火墙规则已正确添加
- [ ] 网络发现已启用
- [ ] 应用监听在 `0.0.0.0` 而非 `localhost`

完成这些配置后，内网用户就应该能够正常访问你的PT站了！

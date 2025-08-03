# 浏览器调试诊断指南

## 🔍 使用浏览器开发者工具诊断网络问题

既然服务器主机（172.21.134.69）可以正常访问，但本机无法访问，我们需要使用浏览器工具来精确定位问题。

## 📊 第一步：浏览器网络面板诊断

### 1. 打开开发者工具
1. 按 `F12` 或右键 → "检查"
2. 切换到 **"Network"（网络）** 标签页
3. 确保 **"Preserve log"（保留日志）** 已勾选

### 2. 尝试访问并观察
1. 在地址栏输入：`http://172.21.134.69:3000`
2. 按 Enter，观察 Network 面板的请求

### 3. 分析网络请求状态

#### 🔴 如果看到红色的请求失败：
- **状态码 ERR_CONNECTION_TIMED_OUT**：网络超时
- **状态码 ERR_CONNECTION_REFUSED**：连接被拒绝
- **状态码 ERR_NETWORK_CHANGED**：网络变化
- **状态码 (failed)**：请求失败

#### 🟡 如果看到黄色或等待状态：
- **Pending**：请求挂起，可能是网络延迟或阻塞

#### 🟢 如果看到绿色的成功请求：
- **状态码 200**：请求成功，问题可能在资源加载

## 🌐 第二步：具体网络错误分析

### ERR_CONNECTION_TIMED_OUT 详细诊断

这个错误表示请求超时，可能的原因：

1. **防火墙阻止**（最可能）
2. **路由问题**
3. **网络设备限制**
4. **本机网络配置问题**

### 详细调试步骤：

#### 1. 检查请求详情
在 Network 面板中：
- 点击失败的请求
- 查看 **"Headers"** 标签页
- 查看 **"Timing"** 标签页（如果有）

#### 2. 查看具体错误信息
在 **"Console"（控制台）** 标签页查看：
- 是否有网络错误信息
- 是否有 CORS 相关错误
- 是否有其他 JavaScript 错误

## 🛠️ 第三步：系统级网络诊断

### 1. 命令行测试
打开命令提示符（cmd）进行测试：

```cmd
:: 测试基本连通性
ping 172.21.134.69

:: 测试端口连通性
telnet 172.21.134.69 3000
telnet 172.21.134.69 3001

:: 如果 telnet 不可用，使用 PowerShell
powershell "Test-NetConnection -ComputerName 172.21.134.69 -Port 3000"
powershell "Test-NetConnection -ComputerName 172.21.134.69 -Port 3001"

:: 查看本机路由表
route print

:: 查看本机网络配置
ipconfig /all
```

### 2. 使用 curl 测试
```cmd
:: 测试 HTTP 连接
curl -v http://172.21.134.69:3000
curl -v http://172.21.134.69:3001/health

:: 带超时设置的测试
curl --connect-timeout 10 http://172.21.134.69:3000
```

## 🔧 第四步：网络配置检查

### 1. 检查本机网络设置

#### 网络配置检查：
```cmd
:: 查看网络适配器
ipconfig /all

:: 查看网络连接状态
netsh interface show interface

:: 检查 DNS 设置
nslookup 172.21.134.69

:: 检查网络路由
tracert 172.21.134.69
```

#### 检查代理设置：
1. 打开 "设置" → "网络和 Internet" → "代理"
2. 确保没有启用代理服务器
3. 或者在代理例外中添加 `172.21.134.69`

### 2. 检查 Windows 网络配置

#### 网络发现和共享：
```cmd
:: 检查网络发现状态
netsh advfirewall firewall show rule group="Network Discovery"

:: 检查文件和打印机共享
netsh advfirewall firewall show rule group="File and Printer Sharing"
```

## 🔍 第五步：高级诊断工具

### 1. 使用 Wireshark 抓包（可选）
如果有 Wireshark：
1. 启动 Wireshark
2. 选择活动网络接口
3. 设置过滤器：`host 172.21.134.69`
4. 尝试访问网站，观察数据包

### 2. 检查网络适配器
```cmd
:: 重置网络适配器
netsh winsock reset
netsh int ip reset

:: 刷新 DNS
ipconfig /flushdns

:: 重新获取 IP
ipconfig /release
ipconfig /renew
```

## 🎯 第六步：常见问题解决方案

### 问题 1：防火墙阻止（最常见）
**症状**：ping 能通，但 HTTP 请求超时
**解决**：
```cmd
:: 临时关闭防火墙测试
netsh advfirewall set allprofiles state off

:: 测试后记得重新开启
netsh advfirewall set allprofiles state on
```

### 问题 2：企业网络策略
**症状**：特定端口被阻止
**解决**：
- 咨询网络管理员
- 尝试使用其他端口（如 8080, 8888）
- 使用 VPN 或其他网络

### 问题 3：路由器设置
**症状**：同网段无法互访
**解决**：
- 检查路由器的"客户端隔离"设置
- 检查路由器的访问控制列表（ACL）
- 重启路由器

### 问题 4：本机网络问题
**症状**：其他服务也无法访问
**解决**：
```cmd
:: 重置网络堆栈
netsh int ip reset
netsh winsock reset
:: 重启计算机
```

## 🚀 第七步：创建诊断报告

请运行以下命令收集诊断信息：

```cmd
:: 创建诊断报告
echo 开始网络诊断... > network-diagnosis.txt
echo ==================== >> network-diagnosis.txt
echo 时间: %date% %time% >> network-diagnosis.txt
echo. >> network-diagnosis.txt

echo [网络配置] >> network-diagnosis.txt
ipconfig /all >> network-diagnosis.txt
echo. >> network-diagnosis.txt

echo [连通性测试] >> network-diagnosis.txt
ping -n 4 172.21.134.69 >> network-diagnosis.txt
echo. >> network-diagnosis.txt

echo [端口测试] >> network-diagnosis.txt
powershell "Test-NetConnection -ComputerName 172.21.134.69 -Port 3000" >> network-diagnosis.txt
powershell "Test-NetConnection -ComputerName 172.21.134.69 -Port 3001" >> network-diagnosis.txt
echo. >> network-diagnosis.txt

echo [路由信息] >> network-diagnosis.txt
route print >> network-diagnosis.txt
echo. >> network-diagnosis.txt

echo [防火墙状态] >> network-diagnosis.txt
netsh advfirewall show allprofiles >> network-diagnosis.txt

echo 诊断完成，请查看 network-diagnosis.txt 文件
```

## 📋 快速检查清单

请按顺序检查以下项目：

- [ ] 在浏览器 F12 Network 面板中看到的具体错误是什么？
- [ ] `ping 172.21.134.69` 是否成功？
- [ ] `telnet 172.21.134.69 3000` 是否能连接？
- [ ] 本机是否启用了代理服务器？
- [ ] 本机防火墙是否阻止出站连接？
- [ ] 是否在企业网络环境中？
- [ ] 其他设备能否访问该服务器？
- [ ] 本机能否访问其他内网服务？

## 💡 立即尝试的解决方案

### 方案 1：临时禁用防火墙测试
```cmd
:: 以管理员身份运行
netsh advfirewall set allprofiles state off
:: 测试访问
:: 测试完成后恢复
netsh advfirewall set allprofiles state on
```

### 方案 2：使用其他浏览器测试
尝试使用不同浏览器（Chrome、Firefox、Edge）访问，看是否有差异。

### 方案 3：检查代理设置
在浏览器设置中禁用代理，或将 172.21.134.69 添加到代理例外列表。

---

请先尝试在浏览器 F12 Network 面板中查看具体的错误信息，然后告诉我你看到的详细错误，我可以提供更精确的解决方案。

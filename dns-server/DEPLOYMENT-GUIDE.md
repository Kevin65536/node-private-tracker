# Linux DNS服务器部署指南

## 快速部署

### 1. 上传文件到Linux服务器

将以下文件上传到Linux服务器的任意目录（如 `/tmp/dns-setup/`）：
- `install-dns-linux.sh` - 安装脚本
- `test-dns-linux.sh` - 测试脚本
- `manage-dns-linux.sh` - 管理脚本
- `dnsmasq-linux.conf` - 配置模板（可选）

### 2. 设置执行权限

```bash
chmod +x install-dns-linux.sh
chmod +x test-dns-linux.sh
chmod +x manage-dns-linux.sh
```

### 3. 运行安装脚本

```bash
sudo ./install-dns-linux.sh
```

安装脚本会自动：
- 检测Linux发行版
- 安装dnsmasq
- 检测网络配置
- 询问PT站服务器IP地址
- 生成配置文件
- 配置防火墙
- 启动服务
- 执行基本测试

### 4. 测试DNS服务器

```bash
./test-dns-linux.sh
```

## 详细配置说明

### 主要配置项

在安装过程中，你需要提供：
1. **Linux服务器IP**: DNS服务器的IP地址（自动检测）
2. **PT站服务器IP**: 运行nginx和PT站的Windows服务器IP地址

### 域名解析配置

默认会配置以下域名解析：
- `pt.local` → PT站服务器IP
- `www.pt.local` → PT站服务器IP
- `tracker.pt.local` → PT站服务器IP
- `api.pt.local` → PT站服务器IP
- `admin.pt.local` → PT站服务器IP
- `*.pt.local` → PT站服务器IP（泛域名）

## 客户端配置

### 方法1：路由器配置（推荐）

1. 登录路由器管理界面
2. 找到DHCP设置
3. 设置主DNS服务器为Linux服务器IP
4. 设置备用DNS为 `8.8.8.8`
5. 保存并重启路由器

这样局域网内所有设备都会自动使用你的DNS服务器。

### 方法2：Windows客户端手动配置

1. 控制面板 → 网络和Internet → 网络连接
2. 右键活动网络连接 → 属性
3. 双击"Internet协议版本4(TCP/IPv4)"
4. 选择"使用下面的DNS服务器地址"
5. 首选DNS：`[Linux服务器IP]`
6. 备用DNS：`8.8.8.8`

### 方法3：Linux客户端配置

临时配置：
```bash
echo "nameserver [Linux服务器IP]" | sudo tee /etc/resolv.conf
```

永久配置（Ubuntu 18.04+）：
```bash
sudo nano /etc/systemd/resolved.conf
# 添加: DNS=[Linux服务器IP]
sudo systemctl restart systemd-resolved
```

## 日常管理

### 使用管理脚本

复制管理脚本到系统路径：
```bash
sudo cp manage-dns-linux.sh /usr/local/bin/dns-manager
sudo chmod +x /usr/local/bin/dns-manager
```

常用命令：
```bash
# 查看服务状态
dns-manager status

# 重启DNS服务
sudo dns-manager restart

# 查看实时日志
dns-manager logs

# 监控DNS查询
dns-manager monitor

# 查看统计信息
dns-manager stats

# 更新PT服务器IP地址
sudo dns-manager update-ip

# 添加新域名
sudo dns-manager add-domain

# 备份配置
sudo dns-manager backup
```

### 手动管理

```bash
# 查看服务状态
sudo systemctl status dnsmasq

# 重启服务
sudo systemctl restart dnsmasq

# 查看配置文件
sudo nano /etc/dnsmasq.conf

# 测试配置语法
sudo dnsmasq --test

# 查看实时日志
sudo journalctl -u dnsmasq -f
```

## 测试验证

### 基本测试

```bash
# 测试pt.local解析
nslookup pt.local [Linux服务器IP]

# 测试外部域名解析
nslookup baidu.com [Linux服务器IP]

# 测试HTTP访问（在配置了DNS的客户端上）
curl -k https://pt.local
```

### 完整测试

```bash
# 运行完整测试套件
./test-dns-linux.sh

# 或分别测试各项
./test-dns-linux.sh status    # 服务状态
./test-dns-linux.sh dns       # DNS解析
./test-dns-linux.sh perf      # 性能测试
```

## 网络拓扑

```
[路由器] ── DHCP DNS: Linux服务器IP
    │
    ├── [Linux DNS服务器] ── 解析 *.pt.local → Windows服务器IP
    │                      转发其他域名 → 公共DNS
    │
    ├── [Windows PT站服务器] ── nginx + PT站应用
    │
    └── [客户端设备] ── 自动使用Linux DNS服务器
```

## 故障排除

### 常见问题

1. **DNS服务无法启动**
   ```bash
   sudo lsof -i :53  # 检查端口占用
   sudo systemctl status dnsmasq  # 查看错误信息
   ```

2. **域名解析失败**
   ```bash
   sudo dnsmasq --test  # 检查配置语法
   ping [PT服务器IP]    # 检查网络连通性
   ```

3. **客户端无法访问**
   - 检查防火墙是否开放端口53
   - 确认客户端DNS配置正确
   - 测试直接IP访问是否正常

### 日志分析

```bash
# 查看错误日志
sudo journalctl -u dnsmasq | grep -i error

# 查看DNS查询日志
sudo journalctl -u dnsmasq | grep query

# 实时监控
sudo journalctl -u dnsmasq -f
```

## 高级配置

### 条件转发

如果有企业内部域名需要转发：
```bash
# 编辑配置文件
sudo nano /etc/dnsmasq.conf

# 添加条件转发
server=/company.local/192.168.2.1
server=/internal.domain/10.0.1.1
```

### 性能优化

```bash
# 增加缓存大小
cache-size=5000

# 启用并发查询
dns-forward-max=200

# 禁用负缓存
no-negcache
```

### 安全加固

```bash
# 限制查询来源
interface=eth0
bind-interfaces

# 过滤恶意查询
bogus-priv
domain-needed

# 禁用不必要的功能
no-hosts
no-resolv
```

## DNS over HTTPS (DoH) 增强安全方案

### DoH的优势

- **加密传输**: DNS查询通过HTTPS加密，防止窃听和篡改
- **防DNS劫持**: 避免ISP或恶意路由器篡改DNS响应
- **隐私保护**: DNS查询看起来像普通HTTPS流量
- **绕过限制**: 可以绕过某些网络对DNS的限制

### DoH快速部署

使用DoH增强版安装脚本：

```bash
# 下载DoH安装脚本
wget https://your-server/install-doh-dns.sh
chmod +x install-doh-dns.sh

# 运行DoH DNS服务器安装
sudo ./install-doh-dns.sh
```

DoH版本特点：
- 内网域名(*.pt.local)直接解析，不走DoH
- 外网域名通过cloudflared转发到DoH服务器
- 支持多个DoH提供商选择
- 完整的Web界面管理(可选AdGuard Home)

### DoH服务器提供商选择

| 提供商 | 特点 | 推荐度 |
|--------|------|--------|
| Cloudflare | 速度快，稳定性好 | ⭐⭐⭐⭐⭐ |
| Quad9 | 隐私友好，恶意软件拦截 | ⭐⭐⭐⭐ |
| AdGuard | 广告拦截，恶意软件防护 | ⭐⭐⭐⭐ |
| Google | 性能优先 | ⭐⭐⭐ |

### DoH测试验证

```bash
# 完整DoH功能测试
./test-doh-dns.sh

# 单项测试
./test-doh-dns.sh doh        # DoH连通性
./test-doh-dns.sh security   # 安全特性
./test-doh-dns.sh performance # 性能测试
```

### DoH管理命令

```bash
# 查看DoH DNS状态
doh-status

# 重启DoH DNS服务
doh-restart

# 查看DoH代理日志
journalctl -u cloudflared -f

# 查看DNS查询日志
tail -f /var/log/dnsmasq.log
```

---

## 维护建议

1. **定期备份配置**
   ```bash
   sudo dns-manager backup
   ```

2. **监控服务状态**
   - 设置监控脚本定期检查服务状态
   - 配置日志轮转避免日志过大
   - 监控DoH连通性和延迟

3. **更新维护**
   - 定期更新系统和dnsmasq包
   - 更新cloudflared到最新版本
   - 检查防火墙规则是否正常

4. **性能监控**
   ```bash
   dns-manager stats  # 查看统计信息
   dns-manager monitor  # 监控实时查询
   doh-status         # DoH专用状态检查
   ```

5. **安全检查**
   - 验证内网域名不泄露到DoH服务器
   - 检查DoH连接使用HTTPS加密
   - 定期测试DNS泄露防护

# DNS over HTTPS (DoH) 安全DNS服务器方案

## DoH的安全优势

1. **加密传输** - DNS查询通过HTTPS加密，防止窃听和篡改
2. **防DNS劫持** - 避免ISP或恶意路由器篡改DNS响应
3. **隐私保护** - DNS查询看起来像普通HTTPS流量
4. **绕过限制** - 可以绕过某些网络对DNS的限制

## 方案对比

| 方案 | 复杂度 | 功能 | 性能 | 管理界面 |
|------|--------|------|------|----------|
| dnsmasq + cloudflared | 简单 | 基础DoH | 高 | 命令行 |
| AdGuard Home | 中等 | 完整DoH/DoT + 广告拦截 | 中 | Web界面 |
| Unbound + Stubby | 复杂 | 完全自定义 | 高 | 命令行 |

---

## 方案一：dnsmasq + cloudflared（推荐）

### 架构说明

```
客户端 → Linux DNS服务器 → 判断域名类型
                         ↓
          内网域名(*.pt.local) → 直接解析
          外网域名 → cloudflared → DoH服务器(Cloudflare/Quad9)
```

### 优点
- 轻量级，资源占用少
- 本地域名解析快速
- 外网查询安全加密
- 配置相对简单

---

## 方案二：AdGuard Home

### 特点
- Web管理界面
- 内置DoH/DoT支持
- 广告和恶意软件拦截
- 详细的查询日志和统计
- 支持多种上游DNS配置

### 适用场景
- 需要图形化管理界面
- 希望同时拦截广告
- 需要详细的DNS统计

---

# 部署配置

## 方案一部署：dnsmasq + cloudflared

### 系统要求
- Linux服务器 (Ubuntu 18.04+, CentOS 7+, Debian 9+)
- 至少512MB内存
- 稳定的网络连接

### 安装步骤

1. **安装基础DNS服务**
   ```bash
   # 先安装标准dnsmasq
   sudo apt update && sudo apt install dnsmasq -y
   # 或 CentOS: sudo yum install dnsmasq -y
   ```

2. **安装cloudflared**
   ```bash
   # 下载cloudflared
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   
   # 或使用官方脚本
   curl -L https://pkg.cloudflare.com/cloudflared/install.sh | sudo bash
   ```

3. **配置cloudflared为系统服务**
   ```bash
   # 创建专用用户
   sudo useradd -r -M -s /usr/sbin/nologin cloudflared
   
   # 创建配置目录
   sudo mkdir -p /etc/cloudflared
   ```

### DoH服务器选择

#### Cloudflare (推荐)
```yaml
# /etc/cloudflared/config.yml
proxy-dns: true
proxy-dns-port: 5053
proxy-dns-address: 127.0.0.1
upstream:
  - https://1.1.1.1/dns-query
  - https://1.0.0.1/dns-query
```

#### Quad9 (隐私友好)
```yaml
upstream:
  - https://dns.quad9.net/dns-query
  - https://dns9.quad9.net/dns-query
```

#### Google (性能优先)
```yaml
upstream:
  - https://dns.google/dns-query
  - https://dns64.dns.google/dns-query
```

#### AdGuard (广告拦截)
```yaml
upstream:
  - https://dns.adguard.com/dns-query
  - https://dns-family.adguard.com/dns-query
```

### 配置文件详解

#### cloudflared配置 (/etc/cloudflared/config.yml)
```yaml
# DoH代理配置
proxy-dns: true
proxy-dns-port: 5053
proxy-dns-address: 127.0.0.1

# 上游DoH服务器（可配置多个）
upstream:
  - https://1.1.1.1/dns-query        # Cloudflare主服务器
  - https://1.0.0.1/dns-query        # Cloudflare备用服务器
  - https://dns.quad9.net/dns-query  # Quad9备用

# 日志配置
loglevel: info
logfile: /var/log/cloudflared.log

# 性能优化
proxy-dns-upstream: https://1.1.1.1/dns-query,https://1.0.0.1/dns-query

# 缓存设置（可选）
# proxy-dns-upstream-timeout: 10s
```

#### dnsmasq配置 (/etc/dnsmasq.conf)
```ini
# 基本设置
port=53
interface=eth0
bind-interfaces
no-dhcp-interface=eth0

# 本地域名解析（PT站相关）
address=/pt.local/192.168.1.100
address=/www.pt.local/192.168.1.100
address=/tracker.pt.local/192.168.1.100
address=/api.pt.local/192.168.1.100
address=/.pt.local/192.168.1.100

# 转发外部DNS查询到cloudflared
server=127.0.0.1#5053

# 禁用默认上游DNS
no-resolv

# 缓存和性能
cache-size=3000
no-negcache
strict-order

# 安全设置
bogus-priv
domain-needed
no-hosts

# 本地域名设置
domain=pt.local
expand-hosts
local-ttl=600
auth-ttl=600

# 日志（可选，生产环境建议关闭）
log-queries
log-facility=/var/log/dnsmasq.log
```

### 启动服务脚本
```bash
#!/bin/bash
# start-doh-dns.sh

# 设置权限
sudo chown cloudflared:cloudflared /etc/cloudflared/config.yml
sudo chmod 644 /etc/cloudflared/config.yml

# 创建systemd服务文件
sudo tee /etc/systemd/system/cloudflared.service > /dev/null << EOF
[Unit]
Description=Cloudflared DoH Proxy
After=network.target

[Service]
Type=simple
User=cloudflared
ExecStart=/usr/local/bin/cloudflared --config /etc/cloudflared/config.yml
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# 检查cloudflared状态
sleep 3
if systemctl is-active --quiet cloudflared; then
    echo "✓ cloudflared启动成功"
else
    echo "✗ cloudflared启动失败"
    sudo journalctl -u cloudflared --no-pager
    exit 1
fi

# 启动dnsmasq
sudo systemctl restart dnsmasq

# 检查dnsmasq状态
if systemctl is-active --quiet dnsmasq; then
    echo "✓ dnsmasq启动成功"
else
    echo "✗ dnsmasq启动失败"
    sudo journalctl -u dnsmasq --no-pager
    exit 1
fi

echo "DoH DNS服务器配置完成！"
```

---

## 方案二部署：AdGuard Home

### 安装AdGuard Home

```bash
#!/bin/bash
# install-adguard.sh

# 下载并安装AdGuard Home
curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh | sh -s -- -v

# 或手动安装
# wget https://github.com/AdguardTeam/AdGuardHome/releases/latest/download/AdGuardHome_linux_amd64.tar.gz
# tar -xvf AdGuardHome_linux_amd64.tar.gz
# sudo mv AdGuardHome/AdGuardHome /usr/local/bin/
# sudo /usr/local/bin/AdGuardHome -s install
```

### AdGuard Home配置

初始设置：
1. 访问 `http://[服务器IP]:3000`
2. 设置管理员账户
3. 选择监听接口和端口
4. 配置上游DNS服务器

#### 上游DNS配置（DoH）

在AdGuard Home Web界面的"设置 → DNS设置"中配置：

```
# Cloudflare DoH
https://1.1.1.1/dns-query
https://1.0.0.1/dns-query

# Quad9 DoH（隐私保护）
https://dns.quad9.net/dns-query

# AdGuard DoH（广告拦截）
https://dns.adguard.com/dns-query
```

#### 自定义过滤规则

添加PT站域名的自定义规则：
```
# 在"过滤器 → 自定义过滤规则"中添加
@@||pt.local^
192.168.1.100 pt.local
192.168.1.100 www.pt.local
192.168.1.100 tracker.pt.local
192.168.1.100 api.pt.local
```

---

# 安全配置和优化

## 防火墙配置

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 53/udp
sudo ufw allow 53/tcp
sudo ufw allow 3000/tcp  # AdGuard Home管理界面（可选）

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=53/udp
sudo firewall-cmd --permanent --add-port=53/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp  # AdGuard Home
sudo firewall-cmd --reload
```

## 性能优化

### dnsmasq + cloudflared优化

```ini
# /etc/dnsmasq.conf 性能配置
cache-size=5000                 # 增加缓存
dns-forward-max=300            # 增加并发查询数
all-servers                    # 并行查询所有上游服务器
```

```yaml
# /etc/cloudflared/config.yml 性能配置
proxy-dns-upstream-timeout: 5s
proxy-dns-max-upstream-conns: 5
```

### 系统优化

```bash
# 增加文件描述符限制
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf

# 网络参数优化
echo 'net.core.rmem_max = 134217728' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 134217728' >> /etc/sysctl.conf
sysctl -p
```

## 监控和日志

### 创建监控脚本

```bash
#!/bin/bash
# /usr/local/bin/monitor-doh.sh

echo "=== DoH DNS服务器监控报告 ==="
echo "时间: $(date)"
echo

# 检查服务状态
echo "服务状态:"
systemctl is-active dnsmasq && echo "✓ dnsmasq: 运行中" || echo "✗ dnsmasq: 停止"
systemctl is-active cloudflared && echo "✓ cloudflared: 运行中" || echo "✗ cloudflared: 停止"

echo
# 检查端口监听
echo "端口监听:"
ss -tuln | grep ':53 ' && echo "✓ DNS端口53监听正常" || echo "✗ DNS端口53未监听"
ss -tuln | grep ':5053 ' && echo "✓ cloudflared端口5053监听正常" || echo "✗ cloudflared端口5053未监听"

echo
# 测试DNS解析
echo "DNS解析测试:"
nslookup pt.local 127.0.0.1 > /dev/null && echo "✓ 内网域名解析正常" || echo "✗ 内网域名解析失败"
nslookup baidu.com 127.0.0.1 > /dev/null && echo "✓ 外网域名解析正常" || echo "✗ 外网域名解析失败"

echo
# 查看资源使用
echo "资源使用:"
ps aux | grep -E "(dnsmasq|cloudflared)" | grep -v grep
```

### 日志轮转配置

```bash
# /etc/logrotate.d/doh-dns
/var/log/dnsmasq.log /var/log/cloudflared.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 root root
    postrotate
        systemctl reload dnsmasq
        systemctl reload cloudflared
    endscript
}
```

---

# 测试和验证

## DNS解析测试

```bash
#!/bin/bash
# test-doh-dns.sh

echo "=== DoH DNS服务器测试 ==="

# 获取服务器IP
SERVER_IP=$(ip route get 8.8.8.8 | awk 'NR==1 {print $(NF-2)}')
echo "DNS服务器IP: $SERVER_IP"

echo
echo "1. 测试内网域名解析:"
for domain in "pt.local" "www.pt.local" "tracker.pt.local"; do
    if nslookup $domain $SERVER_IP > /dev/null 2>&1; then
        IP=$(nslookup $domain $SERVER_IP | grep "Address:" | tail -1 | awk '{print $2}')
        echo "✓ $domain → $IP"
    else
        echo "✗ $domain 解析失败"
    fi
done

echo
echo "2. 测试外网域名解析:"
for domain in "baidu.com" "google.com" "github.com"; do
    if nslookup $domain $SERVER_IP > /dev/null 2>&1; then
        echo "✓ $domain 解析成功"
    else
        echo "✗ $domain 解析失败"
    fi
done

echo
echo "3. 测试DoH连通性:"
if curl -s https://1.1.1.1/dns-query > /dev/null; then
    echo "✓ Cloudflare DoH连通正常"
else
    echo "✗ Cloudflare DoH连通失败"
fi

echo
echo "4. 测试查询速度:"
echo "内网域名查询速度:"
time nslookup pt.local $SERVER_IP > /dev/null

echo "外网域名查询速度:"
time nslookup baidu.com $SERVER_IP > /dev/null
```

## 安全性验证

```bash
# 检查DNS泄露
dig +short @$SERVER_IP whoami.akamai.net
# 应该显示你的公网IP

# 检查DoH工作状态
sudo journalctl -u cloudflared --since "1 hour ago" | grep -i query
```

---

# 故障排除

## 常见问题

### 1. cloudflared无法启动

```bash
# 检查配置文件语法
cloudflared --config /etc/cloudflared/config.yml --loglevel debug

# 检查网络连通性
curl -I https://1.1.1.1/dns-query

# 检查权限
ls -la /etc/cloudflared/
```

### 2. DNS查询失败

```bash
# 检查dnsmasq配置
sudo dnsmasq --test

# 检查端口监听
sudo netstat -tuln | grep -E "(53|5053)"

# 测试各个组件
nslookup baidu.com 127.0.0.1#5053  # 直接测试cloudflared
```

### 3. 性能问题

```bash
# 查看DNS查询日志
sudo tail -f /var/log/dnsmasq.log

# 监控系统资源
htop
iotop
```

---

# 客户端配置

配置客户端使用你的DoH DNS服务器的方法与标准DNS相同，只需将DNS服务器设置为你的Linux服务器IP即可。客户端无需知道后端使用了DoH，这个对用户是透明的。

## 优势总结

1. **透明加密** - 用户无感知，但所有外网DNS查询都通过HTTPS加密
2. **本地优化** - 内网域名直接解析，性能不受影响
3. **安全增强** - 防止DNS劫持、污染和窃听
4. **隐私保护** - DNS查询混淆在HTTPS流量中
5. **灵活配置** - 可选择不同的DoH提供商

这样配置后，你的PT站DNS服务器不仅能解析内网域名，还能为所有外网查询提供安全的DoH保护！

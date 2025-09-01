# Linux DNS服务器搭建指南 - PT站

使用Linux服务器搭建稳定的DNS服务器，为PT站提供域名解析服务。

## 系统要求

- Linux服务器（Ubuntu 18.04+、CentOS 7+、Debian 9+）
- 固定内网IP地址
- Root权限或sudo权限

## 方案一：dnsmasq（推荐）

### 1. 安装dnsmasq

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install dnsmasq -y
```

#### CentOS/RHEL/Rocky Linux
```bash
# CentOS 7
sudo yum install dnsmasq -y

# CentOS 8+/Rocky Linux
sudo dnf install dnsmasq -y
```

### 2. 配置dnsmasq

备份原配置文件：
```bash
sudo cp /etc/dnsmasq.conf /etc/dnsmasq.conf.backup
```

创建新的配置文件：
```bash
sudo nano /etc/dnsmasq.conf
```

### 3. 启动和管理服务

```bash
# 启动服务
sudo systemctl start dnsmasq

# 开机自启
sudo systemctl enable dnsmasq

# 检查状态
sudo systemctl status dnsmasq

# 重启服务
sudo systemctl restart dnsmasq

# 查看日志
sudo journalctl -u dnsmasq -f
```

### 4. 防火墙配置

#### Ubuntu (UFW)
```bash
sudo ufw allow 53/udp
sudo ufw allow 53/tcp
sudo ufw reload
```

#### CentOS/RHEL (firewalld)
```bash
sudo firewall-cmd --permanent --add-port=53/udp
sudo firewall-cmd --permanent --add-port=53/tcp
sudo firewall-cmd --reload
```

## 方案二：BIND9（功能更强大）

### 1. 安装BIND9

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install bind9 bind9utils bind9-doc -y
```

#### CentOS/RHEL
```bash
sudo yum install bind bind-utils -y
```

### 2. BIND9基础配置

编辑主配置文件：
```bash
sudo nano /etc/bind/named.conf.local
```

### 3. 启动BIND9服务

```bash
# Ubuntu/Debian
sudo systemctl start named
sudo systemctl enable named

# CentOS/RHEL
sudo systemctl start named
sudo systemctl enable named
```

## 网络配置

### 1. 检查服务器IP地址
```bash
# 查看网络接口
ip addr show

# 查看路由表
ip route show

# 确认服务器可以访问外网
ping -c 4 8.8.8.8
```

### 2. 测试DNS解析
```bash
# 测试本地DNS
nslookup pt.local 127.0.0.1

# 测试外部DNS
dig @127.0.0.1 baidu.com

# 监听端口检查
sudo netstat -tuln | grep :53
```

## 客户端配置

### Windows客户端
1. 网络设置 → 更改适配器设置
2. 右键网络连接 → 属性
3. Internet协议版本4(TCP/IPv4) → 属性
4. 使用下面的DNS服务器地址：
   - 首选：`[Linux服务器IP]`
   - 备用：`8.8.8.8`

### Linux客户端
编辑 `/etc/resolv.conf`：
```bash
nameserver [Linux服务器IP]
nameserver 8.8.8.8
```

### 路由器配置（推荐）
在路由器管理界面设置DHCP的DNS服务器为Linux服务器IP，这样局域网内所有设备都会自动使用。

## 监控和维护

### 1. 实时监控DNS查询
```bash
# 查看实时日志
sudo tail -f /var/log/syslog | grep dnsmasq

# 查看查询统计
sudo kill -USR1 $(pidof dnsmasq)
```

### 2. 性能监控脚本
```bash
# 创建监控脚本
sudo nano /usr/local/bin/dns-monitor.sh
```

### 3. 日志轮转配置
```bash
# 创建日志轮转配置
sudo nano /etc/logrotate.d/dnsmasq-custom
```

## 高级配置

### 1. DNS缓存优化
- 增加缓存大小
- 配置预取机制
- 设置合理的TTL值

### 2. 安全配置
- 限制查询来源
- 防DNS放大攻击
- 配置访问控制列表

### 3. 高可用配置
- 主从DNS配置
- 健康检查脚本
- 自动故障转移

## 故障排除

### 常见问题
1. **端口53被占用**
   ```bash
   sudo lsof -i :53
   sudo systemctl stop systemd-resolved  # Ubuntu可能需要
   ```

2. **DNS解析失败**
   ```bash
   # 检查配置语法
   sudo dnsmasq --test
   
   # 调试模式运行
   sudo dnsmasq -d -C /etc/dnsmasq.conf
   ```

3. **防火墙阻止**
   ```bash
   # 检查防火墙状态
   sudo ufw status
   sudo firewall-cmd --list-all
   ```

### 日志分析
```bash
# 查看错误日志
sudo grep -i error /var/log/syslog

# 查看DNS查询日志
sudo grep dnsmasq /var/log/syslog | tail -20
```

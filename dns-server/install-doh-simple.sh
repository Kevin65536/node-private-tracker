#!/bin/bash

# 简化版DoH DNS安装脚本 - 避免常见问题
# 重点解决cloudflared启动失败和命令缺失问题

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查curl
    if ! command -v curl >/dev/null 2>&1; then
        log_info "安装curl..."
        apt update && apt install -y curl || yum install -y curl
    fi
    
    # 检查网络连通性
    if ! curl -s --connect-timeout 5 https://1.1.1.1 >/dev/null; then
        log_error "网络连通性检查失败，请检查网络连接"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 安装cloudflared（更可靠的方法）
install_cloudflared_reliable() {
    log_info "安装cloudflared (使用官方脚本)..."
    
    # 使用官方安装脚本
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    
    if [[ -f cloudflared.deb ]]; then
        dpkg -i cloudflared.deb || (apt-get update && apt-get install -f -y)
        rm -f cloudflared.deb
    else
        # 备用方案：直接下载二进制文件
        log_warning "使用备用安装方案..."
        curl -L --output /usr/local/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
        chmod +x /usr/local/bin/cloudflared
    fi
    
    # 验证安装
    if cloudflared --version >/dev/null 2>&1; then
        log_success "cloudflared安装成功"
    else
        log_error "cloudflared安装失败"
        exit 1
    fi
}

# 创建用户和目录
setup_user_and_dirs() {
    log_info "设置用户和目录..."
    
    # 创建用户
    if ! id cloudflared >/dev/null 2>&1; then
        useradd -r -M -s /usr/sbin/nologin cloudflared
    fi
    
    # 创建目录
    mkdir -p /etc/cloudflared
    mkdir -p /var/log/cloudflared
    
    # 设置权限
    chown cloudflared:cloudflared /etc/cloudflared /var/log/cloudflared
    
    log_success "用户和目录设置完成"
}

# 创建简化配置
create_simple_config() {
    log_info "创建cloudflared配置..."
    
    cat > /etc/cloudflared/config.yml << 'EOF'
proxy-dns: true
proxy-dns-port: 5053
proxy-dns-address: 127.0.0.1
proxy-dns-upstream: https://1.1.1.1/dns-query,https://1.0.0.1/dns-query
EOF
    
    chown cloudflared:cloudflared /etc/cloudflared/config.yml
    chmod 644 /etc/cloudflared/config.yml
    
    log_success "配置文件创建完成"
}

# 创建可靠的systemd服务
create_reliable_service() {
    log_info "创建systemd服务..."
    
    # 确定cloudflared路径
    local cf_path
    if [[ -f /usr/local/bin/cloudflared ]]; then
        cf_path="/usr/local/bin/cloudflared"
    elif [[ -f /usr/bin/cloudflared ]]; then
        cf_path="/usr/bin/cloudflared"
    else
        cf_path=$(which cloudflared)
    fi
    
    cat > /etc/systemd/system/cloudflared.service << EOF
[Unit]
Description=Cloudflared DoH Proxy
After=network-online.target
Wants=network-online.target
StartLimitBurst=3
StartLimitIntervalSec=60

[Service]
Type=simple
User=cloudflared
Group=cloudflared
ExecStart=$cf_path --config /etc/cloudflared/config.yml
Restart=always
RestartSec=15
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cloudflared
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    log_success "systemd服务创建完成"
}

# 测试cloudflared
test_cloudflared() {
    log_info "测试cloudflared配置..."
    
    # 先测试配置文件
    local cf_path=$(which cloudflared)
    
    # 手动测试启动
    timeout 10 sudo -u cloudflared $cf_path --config /etc/cloudflared/config.yml &
    local test_pid=$!
    
    sleep 5
    
    # 测试DNS查询
    if nslookup google.com 127.0.0.1#5053 >/dev/null 2>&1; then
        log_success "cloudflared配置测试成功"
        kill $test_pid >/dev/null 2>&1 || true
        return 0
    else
        log_error "cloudflared配置测试失败"
        kill $test_pid >/dev/null 2>&1 || true
        return 1
    fi
}

# 配置dnsmasq
configure_dnsmasq_simple() {
    log_info "配置dnsmasq..."
    
    # 获取网络信息
    local interface=$(ip route | grep default | awk '{print $5}' | head -n1)
    local local_ip=$(ip addr show $interface | grep "inet " | awk '{print $2}' | cut -d/ -f1 | head -n1)
    
    echo
    read -p "请输入PT站服务器IP地址 (默认: $local_ip): " pt_server_ip
    pt_server_ip=${pt_server_ip:-$local_ip}
    
    # 备份原配置
    if [[ -f /etc/dnsmasq.conf ]]; then
        cp /etc/dnsmasq.conf /etc/dnsmasq.conf.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    # 创建简化配置
    cat > /etc/dnsmasq.conf << EOF
# PT站DoH DNS服务器 - 简化配置

# 基本设置
port=53
interface=$interface
bind-interfaces
no-dhcp-interface=$interface

# PT站域名解析（直接解析，不走DoH）
address=/pt.local/$pt_server_ip
address=/www.pt.local/$pt_server_ip
address=/tracker.pt.local/$pt_server_ip
address=/api.pt.local/$pt_server_ip
address=/.pt.local/$pt_server_ip

# 外网DNS查询转发到cloudflared（走DoH）
server=127.0.0.1#5053
no-resolv

# 缓存设置
cache-size=1000
no-negcache

# 安全设置
bogus-priv
domain-needed

# 日志（可选）
log-queries
log-facility=/var/log/dnsmasq.log
EOF
    
    # 测试配置
    if dnsmasq --test >/dev/null 2>&1; then
        log_success "dnsmasq配置正确"
    else
        log_error "dnsmasq配置有误"
        exit 1
    fi
}

# 创建管理工具
create_management_tools_simple() {
    log_info "创建管理工具..."
    
    # doh-status
    cat > /usr/local/bin/doh-status << 'EOF'
#!/bin/bash
echo "=== DoH DNS服务器状态 ==="
date
echo

echo "服务状态:"
systemctl is-active --quiet dnsmasq && echo "✓ dnsmasq: 运行中" || echo "✗ dnsmasq: 未运行"
systemctl is-active --quiet cloudflared && echo "✓ cloudflared: 运行中" || echo "✗ cloudflared: 未运行"

echo
echo "端口监听:"
ss -tuln | grep ':53 ' >/dev/null && echo "✓ 端口53: 监听中" || echo "✗ 端口53: 未监听"
ss -tuln | grep ':5053 ' >/dev/null && echo "✓ 端口5053: 监听中" || echo "✗ 端口5053: 未监听"

echo
echo "DNS测试:"
if nslookup pt.local 127.0.0.1 >/dev/null 2>&1; then
    echo "✓ 内网域名解析: 正常"
else
    echo "✗ 内网域名解析: 失败"
fi

if nslookup baidu.com 127.0.0.1 >/dev/null 2>&1; then
    echo "✓ 外网域名解析: 正常 (通过DoH)"
else
    echo "✗ 外网域名解析: 失败"
fi
EOF
    
    # doh-restart
    cat > /usr/local/bin/doh-restart << 'EOF'
#!/bin/bash
echo "重启DoH DNS服务..."
systemctl restart cloudflared
sleep 3
systemctl restart dnsmasq
echo "重启完成"
doh-status
EOF
    
    # doh-logs
    cat > /usr/local/bin/doh-logs << 'EOF'
#!/bin/bash
echo "=== DoH服务日志 ==="
echo
echo "cloudflared日志:"
journalctl -u cloudflared --no-pager -n 15

echo
echo "dnsmasq日志:"
if [[ -f /var/log/dnsmasq.log ]]; then
    tail -15 /var/log/dnsmasq.log
else
    journalctl -u dnsmasq --no-pager -n 15
fi
EOF
    
    chmod +x /usr/local/bin/doh-*
    log_success "管理工具创建完成"
}

# 启动服务
start_services_carefully() {
    log_info "启动服务..."
    
    # 处理端口冲突
    if systemctl is-active --quiet systemd-resolved; then
        log_warning "停用systemd-resolved以释放端口53"
        systemctl stop systemd-resolved
        systemctl disable systemd-resolved
        echo "nameserver 127.0.0.1" > /etc/resolv.conf
    fi
    
    # 启动cloudflared
    systemctl enable cloudflared
    systemctl start cloudflared
    
    # 等待cloudflared就绪
    local count=0
    while [[ $count -lt 10 ]]; do
        if systemctl is-active --quiet cloudflared; then
            break
        fi
        sleep 2
        ((count++))
    done
    
    if systemctl is-active --quiet cloudflared; then
        log_success "cloudflared启动成功"
    else
        log_error "cloudflared启动失败"
        journalctl -u cloudflared --no-pager -n 10
        exit 1
    fi
    
    # 启动dnsmasq
    systemctl restart dnsmasq
    systemctl enable dnsmasq
    
    if systemctl is-active --quiet dnsmasq; then
        log_success "dnsmasq启动成功"
    else
        log_error "dnsmasq启动失败"
        journalctl -u dnsmasq --no-pager -n 10
        exit 1
    fi
}

# 最终测试和显示结果
final_test_and_summary() {
    log_info "最终测试..."
    
    sleep 3
    
    echo
    echo "========================================"
    log_success "DoH DNS服务器安装完成"
    echo "========================================"
    
    # 运行状态检查
    /usr/local/bin/doh-status
    
    echo
    echo "管理命令："
    echo "  doh-status    - 查看状态"
    echo "  doh-restart   - 重启服务"
    echo "  doh-logs      - 查看日志"
    echo
    echo "配置文件："
    echo "  /etc/dnsmasq.conf            - dnsmasq配置"
    echo "  /etc/cloudflared/config.yml  - cloudflared配置"
    echo
    echo "现在可以在客户端设置DNS为此服务器IP来使用DoH DNS服务！"
}

# 主函数
main() {
    echo "========================================"
    echo "简化版DoH DNS服务器安装脚本"
    echo "========================================"
    echo "此版本重点解决常见安装问题"
    echo
    
    if [[ $EUID -ne 0 ]]; then
        log_error "请以root权限运行: sudo $0"
        exit 1
    fi
    
    check_dependencies
    
    # 安装dnsmasq
    log_info "安装dnsmasq..."
    apt update && apt install -y dnsmasq || yum install -y dnsmasq
    
    install_cloudflared_reliable
    setup_user_and_dirs
    create_simple_config
    create_reliable_service
    
    if test_cloudflared; then
        configure_dnsmasq_simple
        create_management_tools_simple
        start_services_carefully
        final_test_and_summary
    else
        log_error "cloudflared测试失败，请检查网络连接和配置"
        exit 1
    fi
}

main "$@"

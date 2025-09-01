#!/bin/bash

# PT站DoH DNS服务器自动安装脚本
# 使用dnsmasq + cloudflared实现DNS over HTTPS

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查root权限
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        log_info "请使用: sudo $0"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VERSION=$VERSION_ID
    else
        log_error "无法检测Linux发行版"
        exit 1
    fi
    
    log_info "检测到系统: $OS $VERSION"
}

# 获取网络信息
get_network_info() {
    log_info "检测网络配置..."
    
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
    if [[ -z "$INTERFACE" ]]; then
        INTERFACE="eth0"
        log_warning "无法自动检测网络接口，使用默认: $INTERFACE"
    fi
    
    LOCAL_IP=$(ip addr show $INTERFACE | grep "inet " | awk '{print $2}' | cut -d/ -f1 | head -n1)
    if [[ -z "$LOCAL_IP" ]]; then
        log_warning "无法自动检测IP地址"
        read -p "请输入服务器IP地址: " LOCAL_IP
    fi
    
    log_success "网络接口: $INTERFACE"
    log_success "DNS服务器IP: $LOCAL_IP"
    
    echo
    read -p "请输入PT站服务器IP地址 (默认: $LOCAL_IP): " PT_SERVER_IP
    PT_SERVER_IP=${PT_SERVER_IP:-$LOCAL_IP}
    
    log_success "PT站服务器IP: $PT_SERVER_IP"
}

# 选择DoH提供商
choose_doh_provider() {
    echo
    log_info "请选择DoH提供商:"
    echo "1. Cloudflare (推荐) - 快速稳定"
    echo "2. Quad9 - 隐私友好，恶意软件拦截"
    echo "3. AdGuard - 广告和恶意软件拦截"
    echo "4. Google - 性能优先"
    echo "5. 混合配置 - 多个提供商备份"
    
    read -p "请选择 (1-5, 默认1): " DOH_CHOICE
    DOH_CHOICE=${DOH_CHOICE:-1}
    
    case $DOH_CHOICE in
        1)
            DOH_PROVIDER="Cloudflare"
            DOH_SERVERS="https://1.1.1.1/dns-query,https://1.0.0.1/dns-query"
            ;;
        2)
            DOH_PROVIDER="Quad9"
            DOH_SERVERS="https://dns.quad9.net/dns-query,https://dns9.quad9.net/dns-query"
            ;;
        3)
            DOH_PROVIDER="AdGuard"
            DOH_SERVERS="https://dns.adguard.com/dns-query,https://dns-family.adguard.com/dns-query"
            ;;
        4)
            DOH_PROVIDER="Google"
            DOH_SERVERS="https://dns.google/dns-query,https://dns64.dns.google/dns-query"
            ;;
        5)
            DOH_PROVIDER="混合配置"
            DOH_SERVERS="https://1.1.1.1/dns-query,https://dns.quad9.net/dns-query,https://dns.adguard.com/dns-query"
            ;;
        *)
            log_error "无效选择，使用默认Cloudflare"
            DOH_PROVIDER="Cloudflare"
            DOH_SERVERS="https://1.1.1.1/dns-query,https://1.0.0.1/dns-query"
            ;;
    esac
    
    log_success "选择的DoH提供商: $DOH_PROVIDER"
}

# 安装dnsmasq
install_dnsmasq() {
    log_info "安装dnsmasq..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt update
        apt install -y dnsmasq curl wget
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
        if command -v dnf &> /dev/null; then
            dnf install -y dnsmasq curl wget
        else
            yum install -y dnsmasq curl wget
        fi
    else
        log_error "不支持的Linux发行版: $OS"
        exit 1
    fi
    
    log_success "dnsmasq安装完成"
}

# 安装cloudflared
install_cloudflared() {
    log_info "安装cloudflared..."
    
    # 检测系统架构
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            ARCH_SUFFIX="amd64"
            ;;
        aarch64|arm64)
            ARCH_SUFFIX="arm64"
            ;;
        armv7l)
            ARCH_SUFFIX="arm"
            ;;
        *)
            log_error "不支持的系统架构: $ARCH"
            exit 1
            ;;
    esac
    
    # 下载并安装cloudflared
    cd /tmp
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        wget "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH_SUFFIX}.deb" -O cloudflared.deb
        dpkg -i cloudflared.deb || apt-get install -f -y
    else
        wget "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH_SUFFIX}" -O cloudflared
        chmod +x cloudflared
        mv cloudflared /usr/local/bin/
    fi
    
    # 创建cloudflared用户
    if ! id cloudflared &>/dev/null; then
        useradd -r -M -s /usr/sbin/nologin cloudflared
    fi
    
    # 创建配置目录
    mkdir -p /etc/cloudflared
    chown cloudflared:cloudflared /etc/cloudflared
    
    log_success "cloudflared安装完成"
}

# 配置cloudflared
configure_cloudflared() {
    log_info "配置cloudflared..."
    
    # 创建cloudflared配置文件
    cat > /etc/cloudflared/config.yml << EOF
# PT站DoH代理配置
proxy-dns: true
proxy-dns-port: 5053
proxy-dns-address: 127.0.0.1

# 上游DoH服务器
proxy-dns-upstream: $DOH_SERVERS

# 日志配置
loglevel: info

# 性能优化
proxy-dns-upstream-timeout: 10s
proxy-dns-max-upstream-conns: 5
EOF
    
    chown cloudflared:cloudflared /etc/cloudflared/config.yml
    chmod 644 /etc/cloudflared/config.yml
    
    # 创建systemd服务文件
    cat > /etc/systemd/system/cloudflared.service << 'EOF'
[Unit]
Description=Cloudflared DoH Proxy
After=network.target
Wants=network.target

[Service]
Type=simple
User=cloudflared
Group=cloudflared
ExecStart=/usr/local/bin/cloudflared --config /etc/cloudflared/config.yml
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable cloudflared
    
    log_success "cloudflared配置完成"
}

# 配置dnsmasq
configure_dnsmasq() {
    log_info "配置dnsmasq..."
    
    # 备份原配置
    if [[ -f /etc/dnsmasq.conf ]]; then
        cp /etc/dnsmasq.conf "/etc/dnsmasq.conf.backup.$(date +%Y%m%d_%H%M%S)"
        log_info "原配置文件已备份"
    fi
    
    # 创建新配置文件
    cat > /etc/dnsmasq.conf << EOF
# PT站DoH DNS服务器配置
# 生成时间: $(date)

# 基本设置
port=53
interface=$INTERFACE
bind-interfaces
no-dhcp-interface=$INTERFACE

# PT站域名解析 (内网直接解析，不走DoH)
address=/pt.local/$PT_SERVER_IP
address=/www.pt.local/$PT_SERVER_IP
address=/tracker.pt.local/$PT_SERVER_IP
address=/api.pt.local/$PT_SERVER_IP
address=/admin.pt.local/$PT_SERVER_IP
address=/.pt.local/$PT_SERVER_IP

# 外网域名通过cloudflared转发到DoH
server=127.0.0.1#5053

# 禁用系统resolv.conf
no-resolv

# 缓存和性能优化
cache-size=3000
no-negcache
dns-forward-max=150
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

# EDNS支持
edns-packet-max=4096

# 日志设置（生产环境可关闭log-queries）
log-queries
log-facility=/var/log/dnsmasq.log
EOF
    
    log_success "dnsmasq配置完成"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    # Ubuntu/Debian (UFW)
    if command -v ufw &> /dev/null; then
        ufw allow 53/udp
        ufw allow 53/tcp
        log_success "UFW防火墙规则已添加"
    
    # CentOS/RHEL (firewalld)
    elif command -v firewall-cmd &> /dev/null && systemctl is-active --quiet firewalld; then
        firewall-cmd --permanent --add-port=53/udp
        firewall-cmd --permanent --add-port=53/tcp
        firewall-cmd --reload
        log_success "firewalld防火墙规则已添加"
    
    # iptables (通用)
    elif command -v iptables &> /dev/null; then
        iptables -I INPUT -p udp --dport 53 -j ACCEPT
        iptables -I INPUT -p tcp --dport 53 -j ACCEPT
        log_warning "已添加iptables规则，但可能在重启后丢失"
    
    else
        log_warning "未检测到防火墙，可能需要手动配置"
    fi
}

# 处理端口冲突
handle_port_conflicts() {
    log_info "检查端口冲突..."
    
    # 检查端口53
    if lsof -i :53 &> /dev/null; then
        log_warning "端口53被占用："
        lsof -i :53
        
        if systemctl is-active --quiet systemd-resolved; then
            log_warning "停用systemd-resolved服务"
            systemctl stop systemd-resolved
            systemctl disable systemd-resolved
            
            # 创建静态resolv.conf
            echo "nameserver 127.0.0.1" > /etc/resolv.conf
            chattr +i /etc/resolv.conf  # 防止被覆盖
        fi
    fi
    
    # 检查端口5053
    if lsof -i :5053 &> /dev/null; then
        log_error "端口5053被占用，cloudflared无法启动"
        lsof -i :5053
        exit 1
    fi
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 先启动cloudflared
    systemctl start cloudflared
    sleep 3
    
    if systemctl is-active --quiet cloudflared; then
        log_success "cloudflared启动成功"
    else
        log_error "cloudflared启动失败"
        journalctl -u cloudflared --no-pager -n 20
        exit 1
    fi
    
    # 测试配置语法
    if dnsmasq --test; then
        log_success "dnsmasq配置语法正确"
    else
        log_error "dnsmasq配置语法错误"
        exit 1
    fi
    
    # 启动dnsmasq
    systemctl restart dnsmasq
    systemctl enable dnsmasq
    
    if systemctl is-active --quiet dnsmasq; then
        log_success "dnsmasq启动成功"
    else
        log_error "dnsmasq启动失败"
        journalctl -u dnsmasq --no-pager -n 20
        exit 1
    fi
}

# 测试DoH DNS
test_doh_dns() {
    log_info "测试DoH DNS服务器..."
    
    sleep 2
    
    echo "1. 测试内网域名解析:"
    if nslookup pt.local 127.0.0.1 > /dev/null 2>&1; then
        IP=$(nslookup pt.local 127.0.0.1 | grep "Address:" | tail -1 | awk '{print $2}')
        log_success "pt.local → $IP"
    else
        log_error "pt.local解析失败"
    fi
    
    echo
    echo "2. 测试外网域名解析 (通过DoH):"
    if nslookup baidu.com 127.0.0.1 > /dev/null 2>&1; then
        log_success "外网域名解析正常 (通过DoH加密)"
    else
        log_error "外网域名解析失败"
    fi
    
    echo
    echo "3. 测试DoH连通性:"
    local first_doh_server=$(echo $DOH_SERVERS | cut -d',' -f1)
    if curl -s --connect-timeout 5 "$first_doh_server" > /dev/null; then
        log_success "DoH服务器连通正常"
    else
        log_error "DoH服务器连通失败"
    fi
    
    echo
    echo "4. 检查服务状态:"
    netstat -tuln 2>/dev/null | grep -E ":53|:5053" || ss -tuln 2>/dev/null | grep -E ":53|:5053"
}

# 创建管理工具
create_management_tools() {
    log_info "创建管理工具..."
    
    # 创建状态检查脚本
    cat > /usr/local/bin/doh-status << 'EOF'
#!/bin/bash
echo "=== DoH DNS服务器状态 ==="
echo "时间: $(date)"
echo

echo "服务状态:"
systemctl is-active dnsmasq && echo "✓ dnsmasq: 运行中" || echo "✗ dnsmasq: 停止"
systemctl is-active cloudflared && echo "✓ cloudflared: 运行中" || echo "✗ cloudflared: 停止"

echo
echo "端口监听:"
ss -tuln | grep ':53 ' && echo "✓ DNS端口53监听正常" || echo "✗ DNS端口53未监听"
ss -tuln | grep ':5053 ' && echo "✓ cloudflared端口5053监听正常" || echo "✗ cloudflared端口5053未监听"

echo
echo "最近的查询日志:"
tail -5 /var/log/dnsmasq.log 2>/dev/null || echo "无日志文件"
EOF
    
    chmod +x /usr/local/bin/doh-status
    
    # 创建重启脚本
    cat > /usr/local/bin/doh-restart << 'EOF'
#!/bin/bash
echo "重启DoH DNS服务器..."
systemctl restart cloudflared
sleep 2
systemctl restart dnsmasq
echo "重启完成"
/usr/local/bin/doh-status
EOF
    
    chmod +x /usr/local/bin/doh-restart
    
    log_success "管理工具创建完成"
}

# 显示完成信息
show_completion() {
    echo
    echo "========================================"
    log_success "DoH DNS服务器安装完成！"
    echo "========================================"
    echo
    echo "服务器配置:"
    echo "  - DNS服务器IP: $LOCAL_IP"
    echo "  - PT站服务器IP: $PT_SERVER_IP"
    echo "  - DoH提供商: $DOH_PROVIDER"
    echo "  - 网络接口: $INTERFACE"
    echo
    echo "安全特性:"
    echo "  ✓ 内网域名直接解析 (*.pt.local)"
    echo "  ✓ 外网查询通过HTTPS加密 (DoH)"
    echo "  ✓ 防DNS劫持和污染"
    echo "  ✓ 隐私保护增强"
    echo
    echo "配置文件:"
    echo "  - dnsmasq: /etc/dnsmasq.conf"
    echo "  - cloudflared: /etc/cloudflared/config.yml"
    echo "  - 日志: /var/log/dnsmasq.log"
    echo
    echo "管理命令:"
    echo "  - 查看状态: doh-status"
    echo "  - 重启服务: doh-restart"
    echo "  - 查看日志: journalctl -u dnsmasq -f"
    echo "  - 查看DoH日志: journalctl -u cloudflared -f"
    echo
    echo "客户端配置:"
    echo "  在路由器或设备中将DNS设为: $LOCAL_IP"
    echo "  然后访问: https://pt.local"
    echo
    log_success "DoH DNS服务器已就绪，享受安全的DNS解析体验！"
}

# 主函数
main() {
    echo "========================================"
    echo "PT站DoH DNS服务器安装脚本"
    echo "========================================"
    echo "此脚本将安装配置："
    echo "- dnsmasq (DNS服务器)"
    echo "- cloudflared (DoH代理)"
    echo "- 安全的DNS over HTTPS解析"
    echo
    
    read -p "按回车键继续安装，或Ctrl+C取消..."
    
    check_root
    detect_os
    get_network_info
    choose_doh_provider
    install_dnsmasq
    install_cloudflared
    handle_port_conflicts
    configure_cloudflared
    configure_dnsmasq
    configure_firewall
    start_services
    test_doh_dns
    create_management_tools
    show_completion
}

# 运行主函数
main "$@"

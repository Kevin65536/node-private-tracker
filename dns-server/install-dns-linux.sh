#!/bin/bash

# PT站Linux DNS服务器安装脚本
# 支持Ubuntu/Debian和CentOS/RHEL系统

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        log_info "请使用: sudo $0"
        exit 1
    fi
}

# 检测Linux发行版
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
    
    # 获取主要网络接口
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
    if [[ -z "$INTERFACE" ]]; then
        INTERFACE="eth0"
        log_warning "无法自动检测网络接口，使用默认: $INTERFACE"
    fi
    
    # 获取本机IP地址
    LOCAL_IP=$(ip addr show $INTERFACE | grep "inet " | awk '{print $2}' | cut -d/ -f1 | head -n1)
    if [[ -z "$LOCAL_IP" ]]; then
        log_warning "无法自动检测IP地址"
        read -p "请输入服务器IP地址: " LOCAL_IP
    fi
    
    log_success "网络接口: $INTERFACE"
    log_success "服务器IP: $LOCAL_IP"
    
    # 询问PT站服务器IP
    echo
    read -p "请输入PT站服务器IP地址 (默认: $LOCAL_IP): " PT_SERVER_IP
    PT_SERVER_IP=${PT_SERVER_IP:-$LOCAL_IP}
    
    log_success "PT站服务器IP: $PT_SERVER_IP"
}

# 安装dnsmasq
install_dnsmasq() {
    log_info "开始安装dnsmasq..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt update
        apt install -y dnsmasq
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
        if command -v dnf &> /dev/null; then
            dnf install -y dnsmasq
        else
            yum install -y dnsmasq
        fi
    else
        log_error "不支持的Linux发行版: $OS"
        exit 1
    fi
    
    log_success "dnsmasq安装完成"
}

# 配置dnsmasq
configure_dnsmasq() {
    log_info "配置dnsmasq..."
    
    # 备份原配置文件
    if [[ -f /etc/dnsmasq.conf ]]; then
        cp /etc/dnsmasq.conf /etc/dnsmasq.conf.backup
        log_info "原配置文件已备份到 /etc/dnsmasq.conf.backup"
    fi
    
    # 创建新配置文件
    cat > /etc/dnsmasq.conf << EOF
# PT站DNS服务器配置
# 自动生成于 $(date)

# 基本设置
port=53
interface=$INTERFACE
bind-interfaces
no-dhcp-interface=$INTERFACE

# 上游DNS服务器
server=223.5.5.5
server=223.6.6.6
server=119.29.29.29
server=114.114.114.114
server=8.8.8.8
server=1.1.1.1
no-resolv

# PT站域名解析
address=/pt.lan/$PT_SERVER_IP
address=/www.pt.lan/$PT_SERVER_IP
address=/tracker.pt.lan/$PT_SERVER_IP
address=/api.pt.lan/$PT_SERVER_IP
address=/admin.pt.lan/$PT_SERVER_IP
address=/.pt.lan/$PT_SERVER_IP

# 缓存和性能
cache-size=3000
no-negcache
dns-forward-max=150
strict-order

# 安全设置
bogus-priv
domain-needed
no-hosts

# 日志设置（生产环境可关闭）
log-queries

# 域名设置
domain=pt.lan
expand-hosts
local-ttl=600
auth-ttl=600

# EDNS支持
edns-packet-max=4096
EOF
    
    log_success "dnsmasq配置文件已创建"
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
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-port=53/udp
        firewall-cmd --permanent --add-port=53/tcp
        firewall-cmd --reload
        log_success "firewalld防火墙规则已添加"
    
    # iptables (通用)
    elif command -v iptables &> /dev/null; then
        iptables -I INPUT -p udp --dport 53 -j ACCEPT
        iptables -I INPUT -p tcp --dport 53 -j ACCEPT
        log_warning "已添加iptables规则，但可能在重启后丢失"
        log_warning "请考虑使用iptables-persistent保存规则"
    
    else
        log_warning "未检测到防火墙，可能需要手动配置"
    fi
}

# 处理端口冲突
handle_port_conflict() {
    log_info "检查端口53占用情况..."
    
    if lsof -i :53 &> /dev/null; then
        log_warning "端口53被其他进程占用："
        lsof -i :53
        
        # 检查systemd-resolved
        if systemctl is-active --quiet systemd-resolved; then
            log_warning "检测到systemd-resolved占用端口53"
            read -p "是否停用systemd-resolved? (y/n): " DISABLE_RESOLVED
            
            if [[ "$DISABLE_RESOLVED" == "y" || "$DISABLE_RESOLVED" == "Y" ]]; then
                systemctl stop systemd-resolved
                systemctl disable systemd-resolved
                
                # 创建静态resolv.conf
                echo "nameserver 223.5.5.5" > /etc/resolv.conf
                echo "nameserver 8.8.8.8" >> /etc/resolv.conf
                
                log_success "systemd-resolved已停用"
            fi
        fi
    else
        log_success "端口53未被占用"
    fi
}

# 启动服务
start_service() {
    log_info "启动dnsmasq服务..."
    
    # 测试配置文件
    if dnsmasq --test; then
        log_success "配置文件语法检查通过"
    else
        log_error "配置文件语法错误"
        exit 1
    fi
    
    # 启动并设置开机自启
    systemctl start dnsmasq
    systemctl enable dnsmasq
    
    # 检查服务状态
    if systemctl is-active --quiet dnsmasq; then
        log_success "dnsmasq服务启动成功"
    else
        log_error "dnsmasq服务启动失败"
        systemctl status dnsmasq
        exit 1
    fi
}

# 测试DNS解析
test_dns() {
    log_info "测试DNS解析..."
    
    echo
    echo "测试pt.lan解析:"
    if nslookup pt.lan 127.0.0.1; then
        log_success "pt.lan解析成功"
    else
        log_error "pt.lan解析失败"
    fi
    
    echo
    echo "测试外部域名解析:"
    if nslookup baidu.com 127.0.0.1; then
        log_success "外部域名解析成功"
    else
        log_error "外部域名解析失败"
    fi
    
    echo
    echo "检查DNS服务监听状态:"
    netstat -tuln | grep :53 || ss -tuln | grep :53
}

# 显示完成信息
show_completion() {
    echo
    echo "========================================"
    log_success "PT站DNS服务器安装完成！"
    echo "========================================"
    echo
    echo "服务器信息:"
    echo "  - DNS服务器IP: $LOCAL_IP"
    echo "  - PT站服务器IP: $PT_SERVER_IP"
    echo "  - 网络接口: $INTERFACE"
    echo "  - 配置文件: /etc/dnsmasq.conf"
    echo
    echo "下一步操作："
    echo "1. 在路由器DHCP设置中将DNS服务器设为: $LOCAL_IP"
    echo "2. 或在客户端手动配置DNS为: $LOCAL_IP"
    echo "3. 测试访问: https://pt.lan"
    echo
    echo "管理命令："
    echo "  - 查看状态: systemctl status dnsmasq"
    echo "  - 重启服务: systemctl restart dnsmasq"
    echo "  - 查看日志: journalctl -u dnsmasq -f"
    echo "  - 测试配置: dnsmasq --test"
    echo
}

# 主函数
main() {
    echo "========================================"
    echo "PT站Linux DNS服务器安装脚本"
    echo "========================================"
    echo
    
    check_root
    detect_os
    get_network_info
    install_dnsmasq
    handle_port_conflict
    configure_dnsmasq
    configure_firewall
    start_service
    test_dns
    show_completion
}

# 运行主函数
main "$@"

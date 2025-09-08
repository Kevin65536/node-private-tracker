#!/bin/bash

# PT站DNS服务器测试脚本
# 用于测试Linux DNS服务器是否正常工作

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
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 获取服务器信息
get_server_info() {
    log_info "获取服务器信息..."
    
    # 获取主要网络接口和IP
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
    LOCAL_IP=$(ip addr show $INTERFACE | grep "inet " | awk '{print $2}' | cut -d/ -f1 | head -n1)
    
    if [[ -z "$LOCAL_IP" ]]; then
        LOCAL_IP="127.0.0.1"
        log_warning "无法获取IP地址，使用localhost测试"
    fi
    
    log_info "DNS服务器IP: $LOCAL_IP"
    log_info "网络接口: $INTERFACE"
}

# 测试系统状态
test_system_status() {
    echo
    echo "========================================"
    log_info "系统状态检查"
    echo "========================================"
    
    # 检查dnsmasq服务状态
    if systemctl is-active --quiet dnsmasq; then
        log_success "dnsmasq服务运行正常"
        systemctl status dnsmasq --no-pager -l
    else
        log_error "dnsmasq服务未运行"
        systemctl status dnsmasq --no-pager -l
        return 1
    fi
    
    echo
    # 检查端口监听状态
    log_info "检查端口53监听状态..."
    if netstat -tuln 2>/dev/null | grep -q :53 || ss -tuln 2>/dev/null | grep -q :53; then
        log_success "端口53正在监听"
        netstat -tuln 2>/dev/null | grep :53 || ss -tuln 2>/dev/null | grep :53
    else
        log_error "端口53未监听"
        return 1
    fi
}

# 测试DNS解析
test_dns_resolution() {
    echo
    echo "========================================"
    log_info "DNS解析测试"
    echo "========================================"
    
    # 测试PT站域名
    local domains=("pt.lan" "www.pt.lan" "tracker.pt.lan" "api.pt.lan")
    
    for domain in "${domains[@]}"; do
        echo
        log_info "测试域名: $domain"
        if nslookup $domain $LOCAL_IP > /dev/null 2>&1; then
            local ip=$(nslookup $domain $LOCAL_IP | grep "Address:" | tail -n1 | awk '{print $2}')
            log_success "$domain -> $ip"
        else
            log_error "$domain 解析失败"
        fi
    done
    
    echo
    # 测试外部域名解析
    log_info "测试外部域名解析..."
    local external_domains=("baidu.com" "google.com" "github.com")
    
    for domain in "${external_domains[@]}"; do
        if nslookup $domain $LOCAL_IP > /dev/null 2>&1; then
            log_success "$domain 解析成功"
        else
            log_error "$domain 解析失败"
        fi
    done
}

# 测试DNS性能
test_dns_performance() {
    echo
    echo "========================================"
    log_info "DNS性能测试"
    echo "========================================"
    
    # 测试查询速度
    log_info "测试查询响应时间..."
    
    # 使用dig测试（如果可用）
    if command -v dig &> /dev/null; then
        echo "使用dig测试pt.lan查询时间:"
        dig @$LOCAL_IP pt.lan | grep "Query time"
        
        echo "使用dig测试外部域名查询时间:"
        dig @$LOCAL_IP baidu.com | grep "Query time"
    else
        log_warning "dig命令不可用，跳过性能测试"
    fi
    
    # 并发查询测试
    log_info "并发查询测试（10个并发请求）..."
    for i in {1..10}; do
        nslookup pt.lan $LOCAL_IP > /dev/null 2>&1 &
    done
    wait
    log_success "并发查询测试完成"
}

# 检查配置文件
check_configuration() {
    echo
    echo "========================================"
    log_info "配置文件检查"
    echo "========================================"
    
    # 检查配置文件语法
    if dnsmasq --test > /dev/null 2>&1; then
        log_success "配置文件语法正确"
    else
        log_error "配置文件语法错误"
        dnsmasq --test
    fi
    
    # 显示关键配置
    echo
    log_info "当前配置摘要:"
    echo "监听端口: $(grep "^port=" /etc/dnsmasq.conf || echo "默认53")"
    echo "监听接口: $(grep "^interface=" /etc/dnsmasq.conf || echo "所有接口")"
    echo "上游DNS: $(grep "^server=" /etc/dnsmasq.conf | head -3)"
    echo "PT域名配置: $(grep "pt.lan" /etc/dnsmasq.conf | head -2)"
}

# 检查防火墙状态
check_firewall() {
    echo
    echo "========================================"
    log_info "防火墙状态检查"
    echo "========================================"
    
    # Ubuntu/Debian (UFW)
    if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
        log_info "UFW防火墙状态:"
        ufw status | grep "53"
        
    # CentOS/RHEL (firewalld)
    elif command -v firewall-cmd &> /dev/null && systemctl is-active --quiet firewalld; then
        log_info "firewalld防火墙状态:"
        firewall-cmd --list-ports | grep -E "(53/tcp|53/udp)" || log_warning "端口53可能未开放"
        
    # iptables
    elif command -v iptables &> /dev/null; then
        log_info "iptables规则（端口53相关）:"
        iptables -L INPUT | grep -E "(53|domain)" || log_warning "未找到端口53相关规则"
        
    else
        log_warning "未检测到活动的防火墙"
    fi
}

# 查看日志
show_logs() {
    echo
    echo "========================================"
    log_info "最近的DNS查询日志"
    echo "========================================"
    
    # 显示最近的日志
    if journalctl -u dnsmasq --no-pager -n 20 2>/dev/null; then
        log_success "日志显示正常"
    elif grep -i dnsmasq /var/log/syslog 2>/dev/null | tail -20; then
        log_success "syslog中的dnsmasq日志"
    elif grep -i dnsmasq /var/log/messages 2>/dev/null | tail -20; then
        log_success "messages中的dnsmasq日志"
    else
        log_warning "无法获取dnsmasq日志"
    fi
}

# 网络连通性测试
test_network_connectivity() {
    echo
    echo "========================================"
    log_info "网络连通性测试"
    echo "========================================"
    
    # 测试到上游DNS的连通性
    local dns_servers=("223.5.5.5" "8.8.8.8" "114.114.114.114")
    
    for dns in "${dns_servers[@]}"; do
        if ping -c 2 -W 3 $dns > /dev/null 2>&1; then
            log_success "到 $dns 连通正常"
        else
            log_error "到 $dns 连通失败"
        fi
    done
}

# 客户端配置建议
show_client_config() {
    echo
    echo "========================================"
    log_info "客户端配置建议"
    echo "========================================"
    
    echo "Windows客户端配置:"
    echo "1. 打开网络设置 → 更改适配器设置"
    echo "2. 右键网络连接 → 属性 → IPv4属性"
    echo "3. 设置DNS服务器为: $LOCAL_IP"
    echo
    
    echo "Linux客户端配置:"
    echo "临时配置: echo 'nameserver $LOCAL_IP' | sudo tee /etc/resolv.conf"
    echo "永久配置: 编辑NetworkManager或systemd-resolved配置"
    echo
    
    echo "路由器配置（推荐）:"
    echo "在路由器DHCP设置中将主DNS设为: $LOCAL_IP"
    echo "这样局域网内所有设备会自动使用此DNS服务器"
    echo
    
    echo "测试命令:"
    echo "nslookup pt.lan $LOCAL_IP"
    echo "curl -k https://pt.lan (忽略SSL证书警告)"
}

# 故障排除建议
troubleshooting_tips() {
    echo
    echo "========================================"
    log_info "故障排除建议"
    echo "========================================"
    
    echo "如果遇到问题，请检查："
    echo "1. 服务状态: systemctl status dnsmasq"
    echo "2. 配置语法: dnsmasq --test"
    echo "3. 端口占用: lsof -i :53 或 ss -tuln | grep :53"
    echo "4. 防火墙规则: 确保端口53已开放"
    echo "5. 网络连通: ping上游DNS服务器"
    echo "6. 日志检查: journalctl -u dnsmasq -f"
    echo
    
    echo "常用管理命令:"
    echo "重启服务: sudo systemctl restart dnsmasq"
    echo "重新加载配置: sudo systemctl reload dnsmasq"
    echo "实时日志: sudo journalctl -u dnsmasq -f"
    echo "测试配置: sudo dnsmasq --test"
}

# 主函数
main() {
    echo "========================================"
    echo "PT站DNS服务器测试脚本"
    echo "========================================"
    
    get_server_info
    
    # 运行所有测试
    test_system_status && \
    test_dns_resolution && \
    test_dns_performance
    
    check_configuration
    check_firewall
    show_logs
    test_network_connectivity
    show_client_config
    troubleshooting_tips
    
    echo
    echo "========================================"
    log_success "DNS服务器测试完成"
    echo "========================================"
}

# 如果有参数，可以单独运行某个测试
case "$1" in
    "status")
        get_server_info
        test_system_status
        ;;
    "dns")
        get_server_info
        test_dns_resolution
        ;;
    "perf")
        get_server_info
        test_dns_performance
        ;;
    "config")
        check_configuration
        ;;
    "firewall")
        check_firewall
        ;;
    "logs")
        show_logs
        ;;
    *)
        main
        ;;
esac

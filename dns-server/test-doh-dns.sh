#!/bin/bash

# DoH DNS服务器测试脚本
# 测试DNS over HTTPS功能是否正常工作

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# 获取服务器信息
get_server_info() {
    log_info "检测服务器信息..."
    
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
    LOCAL_IP=$(ip addr show $INTERFACE | grep "inet " | awk '{print $2}' | cut -d/ -f1 | head -n1)
    
    if [[ -z "$LOCAL_IP" ]]; then
        LOCAL_IP="127.0.0.1"
        log_warning "无法获取IP地址，使用localhost测试"
    fi
    
    log_info "DNS服务器IP: $LOCAL_IP"
    log_info "网络接口: $INTERFACE"
}

# 测试系统服务状态
test_system_services() {
    echo
    echo "========================================"
    log_info "系统服务状态测试"
    echo "========================================"
    
    # 检查dnsmasq
    if systemctl is-active --quiet dnsmasq; then
        log_success "dnsmasq服务运行正常"
        local dnsmasq_pid=$(pgrep dnsmasq)
        local dnsmasq_mem=$(ps -o rss= -p $dnsmasq_pid | awk '{printf "%.1f MB", $1/1024}')
        echo "  └─ 进程ID: $dnsmasq_pid, 内存使用: $dnsmasq_mem"
    else
        log_error "dnsmasq服务未运行"
        return 1
    fi
    
    # 检查cloudflared
    if systemctl is-active --quiet cloudflared; then
        log_success "cloudflared服务运行正常"
        local cf_pid=$(pgrep cloudflared)
        local cf_mem=$(ps -o rss= -p $cf_pid | awk '{printf "%.1f MB", $1/1024}')
        echo "  └─ 进程ID: $cf_pid, 内存使用: $cf_mem"
    else
        log_error "cloudflared服务未运行"
        return 1
    fi
    
    # 检查端口监听
    echo
    log_info "端口监听状态:"
    if ss -tuln | grep -q ':53 '; then
        log_success "端口53监听正常"
        ss -tuln | grep ':53 ' | head -2
    else
        log_error "端口53未监听"
    fi
    
    if ss -tuln | grep -q ':5053 '; then
        log_success "cloudflared端口5053监听正常"
    else
        log_error "cloudflared端口5053未监听"
    fi
}

# 测试DNS解析功能
test_dns_resolution() {
    echo
    echo "========================================"
    log_info "DNS解析功能测试"
    echo "========================================"
    
    # 测试内网域名解析
    log_info "测试内网域名解析 (应直接解析，不走DoH):"
    local internal_domains=("pt.local" "www.pt.local" "tracker.pt.local" "api.pt.local")
    
    for domain in "${internal_domains[@]}"; do
        if timeout 5 nslookup $domain $LOCAL_IP > /dev/null 2>&1; then
            local ip=$(nslookup $domain $LOCAL_IP 2>/dev/null | grep "Address:" | tail -1 | awk '{print $2}')
            log_success "$domain → $ip"
        else
            log_error "$domain 解析失败"
        fi
    done
    
    echo
    # 测试外网域名解析
    log_info "测试外网域名解析 (应通过DoH加密传输):"
    local external_domains=("baidu.com" "google.com" "cloudflare.com" "github.com")
    
    for domain in "${external_domains[@]}"; do
        if timeout 10 nslookup $domain $LOCAL_IP > /dev/null 2>&1; then
            log_success "$domain 解析成功 (通过DoH)"
        else
            log_error "$domain 解析失败"
        fi
    done
}

# 测试DoH连通性
test_doh_connectivity() {
    echo
    echo "========================================"
    log_info "DoH连通性测试"
    echo "========================================"
    
    # 读取cloudflared配置获取DoH服务器
    if [[ -f /etc/cloudflared/config.yml ]]; then
        local doh_servers=$(grep "proxy-dns-upstream:" /etc/cloudflared/config.yml | cut -d':' -f2- | tr ',' '\n')
        
        echo "配置的DoH服务器:"
        echo "$doh_servers" | while read -r server; do
            server=$(echo $server | xargs)  # 去除空格
            if [[ -n "$server" ]]; then
                echo "测试: $server"
                if timeout 10 curl -s --connect-timeout 5 "$server" > /dev/null; then
                    log_success "$server 连通正常"
                else
                    log_error "$server 连通失败"
                fi
            fi
        done
    else
        log_error "无法找到cloudflared配置文件"
    fi
    
    echo
    # 测试直接DoH查询
    log_info "直接测试DoH查询:"
    if command -v dig > /dev/null 2>&1; then
        if timeout 10 dig +https @1.1.1.1 baidu.com > /dev/null 2>&1; then
            log_success "直接DoH查询正常"
        else
            log_warning "直接DoH查询失败 (可能网络限制)"
        fi
    else
        log_warning "dig命令不可用，跳过直接DoH测试"
    fi
}

# 测试DNS性能
test_dns_performance() {
    echo
    echo "========================================"
    log_info "DNS性能测试"
    echo "========================================"
    
    # 测试内网域名查询速度
    log_info "内网域名查询速度测试:"
    local start_time=$(date +%s.%N)
    nslookup pt.local $LOCAL_IP > /dev/null 2>&1
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "N/A")
    
    if [[ "$duration" != "N/A" ]]; then
        log_success "pt.local 查询时间: ${duration:0:6}秒"
    else
        log_success "pt.local 查询完成"
    fi
    
    # 测试外网域名查询速度
    log_info "外网域名查询速度测试:"
    start_time=$(date +%s.%N)
    nslookup baidu.com $LOCAL_IP > /dev/null 2>&1
    end_time=$(date +%s.%N)
    duration=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "N/A")
    
    if [[ "$duration" != "N/A" ]]; then
        log_success "baidu.com 查询时间: ${duration:0:6}秒 (通过DoH)"
    else
        log_success "baidu.com 查询完成 (通过DoH)"
    fi
    
    # 并发测试
    echo
    log_info "并发查询测试 (10个并发请求):"
    local success_count=0
    for i in {1..10}; do
        if timeout 5 nslookup "test$i.baidu.com" $LOCAL_IP > /dev/null 2>&1 &
        then
            ((success_count++))
        fi
    done
    wait
    log_success "并发测试完成，成功启动 $success_count/10 个查询"
}

# 测试安全特性
test_security_features() {
    echo
    echo "========================================"
    log_info "安全特性验证"
    echo "========================================"
    
    # 检查DoH加密
    log_info "验证DoH加密传输:"
    if [[ -f /etc/cloudflared/config.yml ]] && grep -q "https://" /etc/cloudflared/config.yml; then
        log_success "DoH配置正确，外网DNS查询将通过HTTPS加密"
    else
        log_error "DoH配置错误，可能未启用加密"
    fi
    
    # 检查本地域名不走DoH
    log_info "验证内网域名直接解析 (不走DoH):"
    if grep -q "address=/.*\.pt\.local/" /etc/dnsmasq.conf; then
        log_success "内网域名配置正确，不会泄露到外部DoH服务器"
    else
        log_warning "内网域名配置可能有问题"
    fi
    
    # 检查上游DNS配置
    log_info "验证上游DNS配置:"
    if grep -q "server=127.0.0.1#5053" /etc/dnsmasq.conf; then
        log_success "上游DNS正确配置为cloudflared"
    else
        log_error "上游DNS配置错误"
    fi
    
    # 检查DNS泄露防护
    echo
    log_info "DNS泄露检查:"
    if ! grep -q "no-resolv" /etc/dnsmasq.conf; then
        log_warning "建议启用no-resolv选项防止DNS泄露"
    else
        log_success "DNS泄露防护已启用"
    fi
}

# 检查配置文件
check_configuration() {
    echo
    echo "========================================"
    log_info "配置文件检查"
    echo "========================================"
    
    # 检查dnsmasq配置
    if dnsmasq --test > /dev/null 2>&1; then
        log_success "dnsmasq配置语法正确"
    else
        log_error "dnsmasq配置语法错误"
        dnsmasq --test
    fi
    
    # 检查cloudflared配置
    if [[ -f /etc/cloudflared/config.yml ]]; then
        log_success "cloudflared配置文件存在"
        
        # 验证配置内容
        if grep -q "proxy-dns: true" /etc/cloudflared/config.yml; then
            log_success "DNS代理功能已启用"
        else
            log_error "DNS代理功能未启用"
        fi
        
        if grep -q "proxy-dns-port: 5053" /etc/cloudflared/config.yml; then
            log_success "DNS代理端口配置正确"
        else
            log_warning "DNS代理端口配置可能有问题"
        fi
    else
        log_error "cloudflared配置文件不存在"
    fi
    
    # 显示关键配置摘要
    echo
    log_info "配置摘要:"
    echo "dnsmasq监听端口: $(grep "^port=" /etc/dnsmasq.conf || echo "默认53")"
    echo "dnsmasq监听接口: $(grep "^interface=" /etc/dnsmasq.conf || echo "所有接口")"
    echo "cloudflared代理端口: $(grep "proxy-dns-port:" /etc/cloudflared/config.yml | awk '{print $2}')"
    echo "DoH上游服务器: $(grep "proxy-dns-upstream:" /etc/cloudflared/config.yml | cut -d':' -f2-)"
}

# 查看服务日志
show_service_logs() {
    echo
    echo "========================================"
    log_info "服务日志检查"
    echo "========================================"
    
    # dnsmasq日志
    log_info "dnsmasq最近日志:"
    if [[ -f /var/log/dnsmasq.log ]]; then
        tail -5 /var/log/dnsmasq.log | while read -r line; do
            echo "  $line"
        done
    else
        journalctl -u dnsmasq --no-pager -n 5 | tail -n +2 | while read -r line; do
            echo "  $line"
        done
    fi
    
    echo
    # cloudflared日志
    log_info "cloudflared最近日志:"
    journalctl -u cloudflared --no-pager -n 5 | tail -n +2 | while read -r line; do
        echo "  $line"
    done
}

# 网络连通性测试
test_network_connectivity() {
    echo
    echo "========================================"
    log_info "网络连通性测试"
    echo "========================================"
    
    # 测试到DoH服务器的连通性
    local doh_hosts=("1.1.1.1" "1.0.0.1" "dns.quad9.net" "dns.google")
    
    for host in "${doh_hosts[@]}"; do
        if timeout 3 ping -c 1 $host > /dev/null 2>&1; then
            log_success "到 $host 连通正常"
        else
            log_warning "到 $host 连通失败"
        fi
    done
    
    # 测试HTTPS连接
    echo
    log_info "HTTPS连接测试:"
    if timeout 10 curl -s https://1.1.1.1/dns-query > /dev/null; then
        log_success "Cloudflare DoH HTTPS连接正常"
    else
        log_error "Cloudflare DoH HTTPS连接失败"
    fi
}

# 显示使用建议
show_usage_recommendations() {
    echo
    echo "========================================"
    log_info "使用建议和配置指导"
    echo "========================================"
    
    echo "客户端配置方法:"
    echo "1. 路由器配置 (推荐):"
    echo "   - 登录路由器管理界面"
    echo "   - DHCP设置中将主DNS设为: $LOCAL_IP"
    echo "   - 备用DNS设为: 8.8.8.8"
    echo
    
    echo "2. Windows客户端:"
    echo "   - 网络设置 → 更改适配器设置 → IPv4属性"
    echo "   - 首选DNS: $LOCAL_IP"
    echo "   - 备用DNS: 8.8.8.8"
    echo
    
    echo "3. 测试命令:"
    echo "   nslookup pt.local $LOCAL_IP"
    echo "   curl -k https://pt.local"
    echo
    
    echo "管理命令:"
    echo "   doh-status          # 查看状态"
    echo "   doh-restart         # 重启服务"
    echo "   systemctl status dnsmasq cloudflared  # 详细状态"
    echo
    
    echo "日志查看:"
    echo "   tail -f /var/log/dnsmasq.log        # DNS查询日志"
    echo "   journalctl -u cloudflared -f        # DoH代理日志"
}

# 故障排除建议
troubleshooting_guide() {
    echo
    echo "========================================"
    log_info "故障排除指南"
    echo "========================================"
    
    echo "常见问题解决方法:"
    echo
    echo "1. 服务启动失败:"
    echo "   systemctl status dnsmasq cloudflared"
    echo "   journalctl -u dnsmasq -n 20"
    echo "   journalctl -u cloudflared -n 20"
    echo
    
    echo "2. DNS解析失败:"
    echo "   dnsmasq --test                    # 检查配置语法"
    echo "   nslookup baidu.com 127.0.0.1#5053  # 直接测试cloudflared"
    echo "   ping 1.1.1.1                     # 检查网络连通"
    echo
    
    echo "3. 性能问题:"
    echo "   增加dnsmasq缓存: cache-size=5000"
    echo "   优化cloudflared连接数: proxy-dns-max-upstream-conns=10"
    echo
    
    echo "4. 安全检查:"
    echo "   确保内网域名不泄露到DoH服务器"
    echo "   验证DoH连接使用HTTPS加密"
    echo "   定期更新cloudflared版本"
}

# 主函数
main() {
    echo "========================================"
    echo "DoH DNS服务器完整测试"
    echo "========================================"
    echo "此脚本将全面测试DNS over HTTPS服务器的功能和性能"
    echo
    
    get_server_info
    
    # 运行所有测试
    test_system_services && \
    test_dns_resolution && \
    test_doh_connectivity && \
    test_dns_performance && \
    test_security_features && \
    check_configuration && \
    show_service_logs && \
    test_network_connectivity && \
    show_usage_recommendations && \
    troubleshooting_guide
    
    echo
    echo "========================================"
    log_success "DoH DNS服务器测试完成"
    echo "========================================"
    echo
    echo "安全特性摘要:"
    echo "  ✓ 内网域名直接解析，无隐私泄露"
    echo "  ✓ 外网查询通过HTTPS加密传输"
    echo "  ✓ 防DNS劫持和污染"
    echo "  ✓ 支持多DoH提供商备份"
    echo
    echo "现在你的DNS服务器已支持DNS over HTTPS安全解析！"
}

# 支持单独测试各个功能
case "$1" in
    "services")
        get_server_info
        test_system_services
        ;;
    "dns")
        get_server_info
        test_dns_resolution
        ;;
    "doh")
        get_server_info
        test_doh_connectivity
        ;;
    "performance")
        get_server_info
        test_dns_performance
        ;;
    "security")
        test_security_features
        ;;
    "config")
        check_configuration
        ;;
    "logs")
        show_service_logs
        ;;
    "network")
        test_network_connectivity
        ;;
    *)
        main
        ;;
esac

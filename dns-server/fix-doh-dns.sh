#!/bin/bash

# DoH DNS服务器问题修复脚本
# 解决cloudflared启动失败和管理命令缺失问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查root权限
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        log_info "请使用: sudo $0"
        exit 1
    fi
}

# 修复cloudflared路径问题
fix_cloudflared_path() {
    log_info "修复cloudflared路径问题..."
    
    # 查找cloudflared可执行文件
    local cf_path=""
    if [[ -f /usr/local/bin/cloudflared ]]; then
        cf_path="/usr/local/bin/cloudflared"
    elif [[ -f /usr/bin/cloudflared ]]; then
        cf_path="/usr/bin/cloudflared"
    elif which cloudflared >/dev/null 2>&1; then
        cf_path=$(which cloudflared)
    else
        log_error "找不到cloudflared可执行文件"
        return 1
    fi
    
    log_success "找到cloudflared: $cf_path"
    
    # 更新systemd服务文件
    cat > /etc/systemd/system/cloudflared.service << EOF
[Unit]
Description=Cloudflared DoH Proxy
After=network.target
Wants=network.target

[Service]
Type=simple
User=cloudflared
Group=cloudflared
ExecStart=$cf_path --config /etc/cloudflared/config.yml
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    log_success "cloudflared服务文件已更新"
}

# 修复cloudflared配置
fix_cloudflared_config() {
    log_info "检查cloudflared配置..."
    
    if [[ ! -f /etc/cloudflared/config.yml ]]; then
        log_warning "cloudflared配置文件不存在，创建默认配置"
        
        mkdir -p /etc/cloudflared
        cat > /etc/cloudflared/config.yml << 'EOF'
# PT站DoH代理配置
proxy-dns: true
proxy-dns-port: 5053
proxy-dns-address: 127.0.0.1

# 上游DoH服务器
upstream:
  - https://1.1.1.1/dns-query
  - https://1.0.0.1/dns-query

# 日志配置
loglevel: info

# 性能优化
proxy-dns-upstream-timeout: 10s
EOF
        
        chown -R cloudflared:cloudflared /etc/cloudflared
        chmod 644 /etc/cloudflared/config.yml
        log_success "cloudflared配置文件已创建"
    fi
    
    # 验证配置语法
    local cf_path=$(which cloudflared)
    if $cf_path tunnel --config /etc/cloudflared/config.yml --dry-run >/dev/null 2>&1; then
        log_success "cloudflared配置语法正确"
    else
        log_warning "配置验证失败，使用简化配置"
        cat > /etc/cloudflared/config.yml << 'EOF'
proxy-dns: true
proxy-dns-port: 5053
proxy-dns-address: 127.0.0.1
proxy-dns-upstream: https://1.1.1.1/dns-query,https://1.0.0.1/dns-query
EOF
        chown cloudflared:cloudflared /etc/cloudflared/config.yml
    fi
}

# 修复用户和权限
fix_permissions() {
    log_info "修复用户和权限..."
    
    # 确保cloudflared用户存在
    if ! id cloudflared >/dev/null 2>&1; then
        useradd -r -M -s /usr/sbin/nologin cloudflared
        log_success "cloudflared用户已创建"
    fi
    
    # 设置正确的权限
    chown -R cloudflared:cloudflared /etc/cloudflared
    chmod 755 /etc/cloudflared
    chmod 644 /etc/cloudflared/config.yml
    
    log_success "权限设置完成"
}

# 创建管理命令
create_management_commands() {
    log_info "创建管理命令..."
    
    # 创建doh-status命令
    cat > /usr/local/bin/doh-status << 'EOF'
#!/bin/bash
echo "=== DoH DNS服务器状态 ==="
echo "时间: $(date)"
echo

echo "服务状态:"
if systemctl is-active --quiet dnsmasq; then
    echo "✓ dnsmasq: 运行中"
else
    echo "✗ dnsmasq: 停止"
fi

if systemctl is-active --quiet cloudflared; then
    echo "✓ cloudflared: 运行中"
else
    echo "✗ cloudflared: 停止"
fi

echo
echo "端口监听:"
if ss -tuln | grep -q ':53 '; then
    echo "✓ DNS端口53监听正常"
else
    echo "✗ DNS端口53未监听"
fi

if ss -tuln | grep -q ':5053 '; then
    echo "✓ cloudflared端口5053监听正常"
else
    echo "✗ cloudflared端口5053未监听"
fi

echo
echo "最近的查询日志:"
if [[ -f /var/log/dnsmasq.log ]]; then
    tail -5 /var/log/dnsmasq.log
else
    journalctl -u dnsmasq --no-pager -n 5 | tail -n +2
fi
EOF
    
    chmod +x /usr/local/bin/doh-status
    
    # 创建doh-restart命令
    cat > /usr/local/bin/doh-restart << 'EOF'
#!/bin/bash
echo "重启DoH DNS服务器..."
systemctl restart cloudflared
sleep 3
systemctl restart dnsmasq
echo "重启完成"
/usr/local/bin/doh-status
EOF
    
    chmod +x /usr/local/bin/doh-restart
    
    # 创建doh-logs命令
    cat > /usr/local/bin/doh-logs << 'EOF'
#!/bin/bash
echo "=== DoH DNS服务器日志 ==="
echo
echo "dnsmasq日志:"
if [[ -f /var/log/dnsmasq.log ]]; then
    tail -20 /var/log/dnsmasq.log
else
    journalctl -u dnsmasq --no-pager -n 20
fi

echo
echo "cloudflared日志:"
journalctl -u cloudflared --no-pager -n 20
EOF
    
    chmod +x /usr/local/bin/doh-logs
    
    log_success "管理命令已创建: doh-status, doh-restart, doh-logs"
}

# 测试cloudflared手动启动
test_cloudflared_manual() {
    log_info "测试cloudflared手动启动..."
    
    local cf_path=$(which cloudflared)
    
    # 停止服务
    systemctl stop cloudflared >/dev/null 2>&1 || true
    
    # 手动测试启动
    log_info "手动测试cloudflared配置..."
    if timeout 10 sudo -u cloudflared $cf_path --config /etc/cloudflared/config.yml --loglevel debug &
    then
        local test_pid=$!
        sleep 5
        
        # 测试DNS查询
        if nslookup baidu.com 127.0.0.1#5053 >/dev/null 2>&1; then
            log_success "cloudflared手动测试成功"
            kill $test_pid >/dev/null 2>&1
            return 0
        else
            log_error "cloudflared DNS查询测试失败"
            kill $test_pid >/dev/null 2>&1
            return 1
        fi
    else
        log_error "cloudflared手动启动失败"
        return 1
    fi
}

# 修复dnsmasq配置
fix_dnsmasq_config() {
    log_info "检查dnsmasq配置..."
    
    # 检查配置语法
    if ! dnsmasq --test >/dev/null 2>&1; then
        log_warning "dnsmasq配置语法有问题，修复中..."
        
        # 备份当前配置
        cp /etc/dnsmasq.conf /etc/dnsmasq.conf.backup.$(date +%Y%m%d_%H%M%S)
        
        # 创建简化的工作配置
        cat > /etc/dnsmasq.conf << 'EOF'
# PT站DoH DNS服务器配置（修复版）

# 基本设置
port=53
bind-interfaces
no-dhcp-interface=*

# PT站域名解析
address=/pt.local/192.168.1.100
address=/.pt.local/192.168.1.100

# 转发到cloudflared
server=127.0.0.1#5053
no-resolv

# 缓存设置
cache-size=1000
no-negcache

# 安全设置
bogus-priv
domain-needed
EOF
        
        log_success "dnsmasq配置已修复"
    fi
}

# 重新启动服务
restart_services() {
    log_info "重新启动服务..."
    
    # 先启动cloudflared
    systemctl enable cloudflared
    systemctl start cloudflared
    
    # 等待cloudflared就绪
    sleep 5
    
    if systemctl is-active --quiet cloudflared; then
        log_success "cloudflared启动成功"
    else
        log_error "cloudflared启动失败，查看详细日志："
        journalctl -u cloudflared --no-pager -n 10
        return 1
    fi
    
    # 启动dnsmasq
    systemctl restart dnsmasq
    
    if systemctl is-active --quiet dnsmasq; then
        log_success "dnsmasq启动成功"
    else
        log_error "dnsmasq启动失败，查看详细日志："
        journalctl -u dnsmasq --no-pager -n 10
        return 1
    fi
}

# 最终测试
final_test() {
    log_info "进行最终测试..."
    
    sleep 3
    
    # 测试内网域名
    if nslookup pt.local 127.0.0.1 >/dev/null 2>&1; then
        log_success "内网域名解析正常"
    else
        log_error "内网域名解析失败"
    fi
    
    # 测试外网域名
    if nslookup baidu.com 127.0.0.1 >/dev/null 2>&1; then
        log_success "外网域名解析正常 (通过DoH)"
    else
        log_error "外网域名解析失败"
    fi
    
    # 测试DoH连通性
    if curl -s --connect-timeout 5 https://1.1.1.1/dns-query >/dev/null; then
        log_success "DoH连通性正常"
    else
        log_warning "DoH连通性测试失败"
    fi
}

# 显示修复结果
show_fix_results() {
    echo
    echo "========================================"
    log_success "DoH DNS服务器修复完成"
    echo "========================================"
    echo
    echo "可用的管理命令:"
    echo "  doh-status    - 查看服务状态"
    echo "  doh-restart   - 重启服务"
    echo "  doh-logs      - 查看服务日志"
    echo
    echo "服务状态检查:"
    /usr/local/bin/doh-status
    echo
    echo "如果仍有问题，请运行:"
    echo "  doh-logs              # 查看详细日志"
    echo "  systemctl status cloudflared dnsmasq  # 查看服务状态"
    echo "  journalctl -u cloudflared -f  # 实时查看cloudflared日志"
}

# 主函数
main() {
    echo "========================================"
    echo "DoH DNS服务器问题修复脚本"
    echo "========================================"
    echo "此脚本将修复以下问题:"
    echo "- cloudflared服务启动失败"
    echo "- 管理命令缺失"
    echo "- 配置文件问题"
    echo "- 权限问题"
    echo
    
    check_root
    
    log_info "开始修复过程..."
    
    fix_cloudflared_path
    fix_permissions
    fix_cloudflared_config
    create_management_commands
    
    if test_cloudflared_manual; then
        fix_dnsmasq_config
        restart_services
        final_test
        show_fix_results
    else
        log_error "cloudflared仍然无法正常工作"
        echo
        echo "请检查以下几点:"
        echo "1. 网络连接是否正常 (ping 1.1.1.1)"
        echo "2. 防火墙是否阻止了HTTPS连接"
        echo "3. 系统时间是否正确"
        echo "4. cloudflared版本是否兼容"
        echo
        echo "查看详细错误日志:"
        echo "journalctl -u cloudflared --no-pager -n 20"
    fi
}

# 运行主函数
main "$@"

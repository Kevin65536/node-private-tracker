#!/bin/bash

# PT站DNS服务器管理脚本
# 用于日常管理和监控Linux DNS服务器

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

# 显示帮助信息
show_help() {
    echo "PT站DNS服务器管理脚本"
    echo
    echo "用法: $0 [命令]"
    echo
    echo "命令:"
    echo "  status          - 显示服务状态"
    echo "  start           - 启动DNS服务"
    echo "  stop            - 停止DNS服务"
    echo "  restart         - 重启DNS服务"
    echo "  reload          - 重新加载配置"
    echo "  test            - 测试配置文件"
    echo "  logs            - 查看实时日志"
    echo "  stats           - 显示统计信息"
    echo "  monitor         - 实时监控DNS查询"
    echo "  backup          - 备份配置文件"
    echo "  restore         - 恢复配置文件"
    echo "  update-ip       - 更新PT服务器IP地址"
    echo "  add-domain      - 添加新域名"
    echo "  remove-domain   - 删除域名"
    echo "  help            - 显示此帮助信息"
    echo
}

# 检查权限
check_permission() {
    if [[ $EUID -ne 0 ]] && [[ "$1" != "status" ]] && [[ "$1" != "logs" ]] && [[ "$1" != "stats" ]] && [[ "$1" != "monitor" ]]; then
        log_error "此操作需要root权限"
        log_info "请使用: sudo $0 $1"
        exit 1
    fi
}

# 显示服务状态
show_status() {
    echo "========================================"
    log_info "DNS服务器状态"
    echo "========================================"
    
    # 服务状态
    if systemctl is-active --quiet dnsmasq; then
        log_success "dnsmasq服务: 运行中"
    else
        log_error "dnsmasq服务: 未运行"
    fi
    
    # 端口状态
    if netstat -tuln 2>/dev/null | grep -q :53 || ss -tuln 2>/dev/null | grep -q :53; then
        log_success "端口53: 正在监听"
        netstat -tuln 2>/dev/null | grep :53 || ss -tuln 2>/dev/null | grep :53
    else
        log_error "端口53: 未监听"
    fi
    
    # 显示详细状态
    echo
    systemctl status dnsmasq --no-pager -l
}

# 启动服务
start_service() {
    log_info "启动dnsmasq服务..."
    if systemctl start dnsmasq; then
        log_success "dnsmasq服务启动成功"
    else
        log_error "dnsmasq服务启动失败"
        exit 1
    fi
}

# 停止服务
stop_service() {
    log_info "停止dnsmasq服务..."
    if systemctl stop dnsmasq; then
        log_success "dnsmasq服务停止成功"
    else
        log_error "dnsmasq服务停止失败"
        exit 1
    fi
}

# 重启服务
restart_service() {
    log_info "重启dnsmasq服务..."
    if systemctl restart dnsmasq; then
        log_success "dnsmasq服务重启成功"
    else
        log_error "dnsmasq服务重启失败"
        exit 1
    fi
}

# 重新加载配置
reload_service() {
    log_info "重新加载dnsmasq配置..."
    if systemctl reload dnsmasq; then
        log_success "配置重新加载成功"
    else
        log_warning "reload失败，尝试restart..."
        restart_service
    fi
}

# 测试配置
test_config() {
    log_info "测试dnsmasq配置..."
    if dnsmasq --test; then
        log_success "配置文件语法正确"
    else
        log_error "配置文件语法错误"
        exit 1
    fi
}

# 查看日志
show_logs() {
    log_info "显示dnsmasq实时日志（Ctrl+C退出）..."
    if command -v journalctl &> /dev/null; then
        journalctl -u dnsmasq -f
    else
        tail -f /var/log/syslog | grep dnsmasq
    fi
}

# 显示统计信息
show_stats() {
    echo "========================================"
    log_info "DNS服务器统计信息"
    echo "========================================"
    
    # 获取进程信息
    local pid=$(pgrep dnsmasq)
    if [[ -n "$pid" ]]; then
        echo "进程ID: $pid"
        echo "启动时间: $(ps -o lstart= -p $pid)"
        echo "运行时间: $(ps -o etime= -p $pid)"
        echo "内存使用: $(ps -o rss= -p $pid | awk '{printf "%.2f MB", $1/1024}')"
        echo "CPU使用: $(ps -o %cpu= -p $pid)%"
    fi
    
    echo
    # 连接统计
    echo "端口连接统计:"
    netstat -an 2>/dev/null | grep :53 | awk '{print $6}' | sort | uniq -c || \
    ss -an 2>/dev/null | grep :53 | awk '{print $2}' | sort | uniq -c
    
    echo
    # 查询统计（从日志中分析）
    if [[ -f /var/log/syslog ]]; then
        echo "今日查询统计（前10个域名）:"
        grep "$(date '+%b %d')" /var/log/syslog | grep dnsmasq | grep "query" | \
        awk '{print $NF}' | sort | uniq -c | sort -nr | head -10
    fi
}

# 实时监控DNS查询
monitor_queries() {
    log_info "实时监控DNS查询（Ctrl+C退出）..."
    if command -v journalctl &> /dev/null; then
        journalctl -u dnsmasq -f | grep --line-buffered "query"
    else
        tail -f /var/log/syslog | grep --line-buffered "dnsmasq.*query"
    fi
}

# 备份配置
backup_config() {
    local backup_dir="/etc/dnsmasq.backup"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$backup_dir/dnsmasq.conf.$timestamp"
    
    log_info "备份配置文件..."
    
    # 创建备份目录
    mkdir -p "$backup_dir"
    
    # 备份配置文件
    if cp /etc/dnsmasq.conf "$backup_file"; then
        log_success "配置文件已备份到: $backup_file"
        
        # 保留最近10个备份
        ls -t "$backup_dir"/dnsmasq.conf.* | tail -n +11 | xargs -r rm
        log_info "已清理旧备份文件"
    else
        log_error "备份失败"
        exit 1
    fi
}

# 恢复配置
restore_config() {
    local backup_dir="/etc/dnsmasq.backup"
    
    if [[ ! -d "$backup_dir" ]]; then
        log_error "备份目录不存在: $backup_dir"
        exit 1
    fi
    
    echo "可用的备份文件:"
    ls -lt "$backup_dir"/dnsmasq.conf.* 2>/dev/null | head -10
    
    read -p "请输入要恢复的备份文件名: " backup_file
    
    if [[ -f "$backup_dir/$backup_file" ]]; then
        cp "$backup_dir/$backup_file" /etc/dnsmasq.conf
        log_success "配置文件已恢复"
        
        # 测试配置
        if dnsmasq --test; then
            log_success "恢复的配置文件语法正确"
            restart_service
        else
            log_error "恢复的配置文件语法错误，请检查"
        fi
    else
        log_error "备份文件不存在"
        exit 1
    fi
}

# 更新PT服务器IP地址
update_pt_ip() {
    read -p "请输入新的PT服务器IP地址: " new_ip
    
    if [[ ! $new_ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        log_error "IP地址格式不正确"
        exit 1
    fi
    
    log_info "备份当前配置..."
    backup_config
    
    log_info "更新PT服务器IP地址为: $new_ip"
    sed -i "s|address=/.*\.pt\.local/.*|address=/.pt.local/$new_ip|g" /etc/dnsmasq.conf
    sed -i "s|address=/pt\.local/.*|address=/pt.local/$new_ip|g" /etc/dnsmasq.conf
    
    # 测试配置
    if dnsmasq --test; then
        log_success "配置更新成功"
        restart_service
        
        # 测试新配置
        sleep 2
        if nslookup pt.local 127.0.0.1 | grep -q "$new_ip"; then
            log_success "新IP地址解析正常"
        else
            log_error "新IP地址解析失败"
        fi
    else
        log_error "配置文件语法错误，请检查"
        exit 1
    fi
}

# 添加新域名
add_domain() {
    read -p "请输入要添加的域名: " domain
    read -p "请输入域名对应的IP地址: " ip
    
    if [[ -z "$domain" || -z "$ip" ]]; then
        log_error "域名和IP地址不能为空"
        exit 1
    fi
    
    if [[ ! $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        log_error "IP地址格式不正确"
        exit 1
    fi
    
    log_info "备份当前配置..."
    backup_config
    
    log_info "添加域名: $domain -> $ip"
    echo "address=/$domain/$ip" >> /etc/dnsmasq.conf
    
    # 测试配置
    if dnsmasq --test; then
        log_success "域名添加成功"
        restart_service
        
        # 测试新域名
        sleep 2
        if nslookup "$domain" 127.0.0.1 | grep -q "$ip"; then
            log_success "新域名解析正常"
        else
            log_error "新域名解析失败"
        fi
    else
        log_error "配置文件语法错误，请检查"
        exit 1
    fi
}

# 删除域名
remove_domain() {
    read -p "请输入要删除的域名: " domain
    
    if [[ -z "$domain" ]]; then
        log_error "域名不能为空"
        exit 1
    fi
    
    # 检查域名是否存在
    if ! grep -q "address=/$domain/" /etc/dnsmasq.conf; then
        log_error "域名不存在于配置文件中"
        exit 1
    fi
    
    log_info "备份当前配置..."
    backup_config
    
    log_info "删除域名: $domain"
    sed -i "/address=\/$domain\//d" /etc/dnsmasq.conf
    
    # 测试配置
    if dnsmasq --test; then
        log_success "域名删除成功"
        restart_service
    else
        log_error "配置文件语法错误，请检查"
        exit 1
    fi
}

# 主函数
main() {
    case "$1" in
        "status")
            show_status
            ;;
        "start")
            check_permission "$1"
            start_service
            ;;
        "stop")
            check_permission "$1"
            stop_service
            ;;
        "restart")
            check_permission "$1"
            restart_service
            ;;
        "reload")
            check_permission "$1"
            reload_service
            ;;
        "test")
            check_permission "$1"
            test_config
            ;;
        "logs")
            show_logs
            ;;
        "stats")
            show_stats
            ;;
        "monitor")
            monitor_queries
            ;;
        "backup")
            check_permission "$1"
            backup_config
            ;;
        "restore")
            check_permission "$1"
            restore_config
            ;;
        "update-ip")
            check_permission "$1"
            update_pt_ip
            ;;
        "add-domain")
            check_permission "$1"
            add_domain
            ;;
        "remove-domain")
            check_permission "$1"
            remove_domain
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 运行主函数
main "$@"

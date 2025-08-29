#!/bin/bash

# PT站 Nginx 配置路径动态设置脚本 (Linux/macOS版)
# 自动检测项目路径并更新pt-site.conf中的硬编码路径

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

# 路径配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NGINX_DIR="/etc/nginx"

# 配置文件路径
TEMPLATE_CONF="$SCRIPT_DIR/pt-site.conf"
PRODUCTION_TEMPLATE="$SCRIPT_DIR/pt-site-production.conf"
BACKUP_CONF="$SCRIPT_DIR/pt-site.conf.backup"

echo "===================================="
echo "PT站 Nginx 路径配置工具"
echo "===================================="
echo
log_info "项目根目录: $PROJECT_ROOT"
log_info "脚本目录: $SCRIPT_DIR"
echo

show_help() {
    echo "使用方法: $0 [命令]"
    echo
    echo "命令:"
    echo "  detect        检测当前路径配置"
    echo "  apply         应用动态路径到开发环境配置"
    echo "  production    设置生产环境配置并应用动态路径"
    echo "  restore       恢复备份的配置文件"
    echo "  help          显示此帮助信息"
    echo
    echo "示例:"
    echo "  $0 detect       # 检测当前路径"
    echo "  $0 apply        # 应用动态路径到开发配置"
    echo "  $0 production   # 切换到生产环境并设置路径"
    echo "  $0 restore      # 恢复备份"
    echo
}

detect_paths() {
    log_info "检测当前路径配置..."
    echo
    echo "检测到的路径:"
    echo "  项目根目录: $PROJECT_ROOT"
    echo "  前端构建目录: $PROJECT_ROOT/frontend/build"
    echo "  后端上传目录: $PROJECT_ROOT/backend/uploads"
    echo "  Nginx日志目录: $NGINX_DIR/logs"
    echo

    # 检查关键目录是否存在
    if [ -d "$PROJECT_ROOT/frontend" ]; then
        log_success "前端目录存在"
    else
        log_error "前端目录不存在: $PROJECT_ROOT/frontend"
    fi

    if [ -d "$PROJECT_ROOT/backend" ]; then
        log_success "后端目录存在"
    else
        log_error "后端目录不存在: $PROJECT_ROOT/backend"
    fi

    if [ -d "$PROJECT_ROOT/backend/uploads" ]; then
        log_success "上传目录存在"
    else
        log_warning "上传目录不存在: $PROJECT_ROOT/backend/uploads"
        log_info "将自动创建上传目录"
        mkdir -p "$PROJECT_ROOT/backend/uploads"
    fi
}

apply_paths() {
    log_info "应用动态路径到pt-site.conf..."

    if [ ! -f "$TEMPLATE_CONF" ]; then
        log_error "配置模板文件不存在: $TEMPLATE_CONF"
        exit 1
    fi

    # 备份原文件
    if [ -f "$BACKUP_CONF" ]; then
        rm "$BACKUP_CONF"
    fi
    cp "$TEMPLATE_CONF" "$BACKUP_CONF"
    log_info "已备份原配置文件: $BACKUP_CONF"

    log_info "替换路径变量..."
    echo "  源路径模式: C:/Users/qdsxh/Desktop/toys/pt"
    echo "  目标路径: $PROJECT_ROOT"

    # 使用sed进行路径替换 (处理Windows风格路径到Unix路径的转换)
    sed "s|C:/Users/qdsxh/Desktop/toys/pt|$PROJECT_ROOT|g" "$BACKUP_CONF" > "$TEMPLATE_CONF"
    
    if [ $? -eq 0 ]; then
        log_success "路径替换完成"
        log_info "应用的路径: $PROJECT_ROOT"
    else
        log_error "路径替换失败"
        if [ -f "$BACKUP_CONF" ]; then
            cp "$BACKUP_CONF" "$TEMPLATE_CONF"
            log_info "已恢复原配置文件"
        fi
        exit 1
    fi
}

setup_production() {
    log_info "设置生产环境配置..."

    if [ ! -f "$PRODUCTION_TEMPLATE" ]; then
        log_error "生产环境模板不存在: $PRODUCTION_TEMPLATE"
        exit 1
    fi

    # 备份当前开发环境配置
    if [ -f "$BACKUP_CONF" ]; then
        rm "$BACKUP_CONF"
    fi
    cp "$TEMPLATE_CONF" "$BACKUP_CONF"

    # 复制生产环境模板
    cp "$PRODUCTION_TEMPLATE" "$TEMPLATE_CONF"
    log_info "已切换到生产环境配置模板"

    # 应用动态路径到生产环境配置
    sed "s|/path/to/pt|$PROJECT_ROOT|g" "$TEMPLATE_CONF" > "$TEMPLATE_CONF.tmp"
    mv "$TEMPLATE_CONF.tmp" "$TEMPLATE_CONF"

    if [ $? -eq 0 ]; then
        log_success "生产环境配置完成"
    else
        log_error "生产环境路径替换失败"
        exit 1
    fi
}

restore_backup() {
    log_info "恢复备份配置..."

    if [ ! -f "$BACKUP_CONF" ]; then
        log_error "备份文件不存在: $BACKUP_CONF"
        exit 1
    fi

    cp "$BACKUP_CONF" "$TEMPLATE_CONF"
    log_success "已恢复备份配置"
}

# 主程序逻辑
case "$1" in
    detect)
        detect_paths
        ;;
    apply)
        apply_paths
        ;;
    production)
        setup_production
        ;;
    restore)
        restore_backup
        ;;
    help|--help|"")
        show_help
        ;;
    *)
        log_error "未知的操作: $1"
        show_help
        exit 1
        ;;
esac
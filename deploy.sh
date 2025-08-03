#!/bin/bash

# PT站部署辅助脚本
# 使用方法: ./deploy.sh [目标服务器IP]

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

# 检查参数
if [ -z "$1" ]; then
    log_error "请提供目标服务器IP地址"
    echo "使用方法: $0 <目标服务器IP>"
    echo "例如: $0 192.168.1.100"
    exit 1
fi

TARGET_IP="$1"

log_info "开始PT站部署流程..."
log_info "目标服务器IP: $TARGET_IP"

# 1. 环境检查
log_info "检查环境..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js 未安装"
    exit 1
fi

NODE_VERSION=$(node --version)
log_success "Node.js 已安装: $NODE_VERSION"

# 检查npm
if ! command -v npm &> /dev/null; then
    log_error "npm 未安装"
    exit 1
fi

NPM_VERSION=$(npm --version)
log_success "npm 已安装: $NPM_VERSION"

# 检查PostgreSQL (可选)
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    log_success "PostgreSQL 已安装: $PSQL_VERSION"
else
    log_warning "PostgreSQL 未找到，请确保已安装并配置"
fi

# 2. 创建.env文件
log_info "配置环境变量..."

if [ ! -f "backend/.env" ]; then
    log_info "创建.env文件..."
    cat > backend/.env << EOF
# 服务器配置
NODE_ENV=production
PORT=3001

# 数据库配置 - PostgreSQL
DB_NAME=pt_database
DB_USER=postgres
DB_PASSWORD=请修改为您的密码
DB_HOST=localhost
DB_PORT=5432
DB_DIALECT=postgres

# SQLite备选配置（如果PostgreSQL不可用）
FALLBACK_TO_SQLITE=true

# JWT密钥 (生产环境请更换为随机字符串)
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "请手动生成32位随机字符串")

# 文件上传配置
MAX_FILE_SIZE=100000000
UPLOAD_PATH=./uploads

# PT站配置
SITE_NAME=LZU PT站
ANNOUNCE_URL=http://$TARGET_IP:3001
FRONTEND_URL=http://$TARGET_IP:3000
MIN_RATIO=0.5
SIGNUP_ENABLED=true
INVITE_ONLY=false

# 管理员邮箱
ADMIN_EMAIL=admin@your-school.edu.cn
EOF
    log_success ".env文件已创建"
else
    log_warning ".env文件已存在，请手动检查ANNOUNCE_URL和FRONTEND_URL配置"
fi

# 3. 安装依赖
log_info "安装后端依赖..."
cd backend
npm install
log_success "后端依赖安装完成"

cd ../frontend
log_info "安装前端依赖..."
npm install
log_success "前端依赖安装完成"

cd ..

# 4. 创建必要目录
log_info "创建必要目录..."
mkdir -p backend/uploads
mkdir -p backend/logs
log_success "目录创建完成"

# 5. 数据库初始化提示
log_info "数据库初始化提示:"
echo "请手动执行以下步骤:"
echo "1. 确保PostgreSQL服务正在运行"
echo "2. 创建数据库: createdb -U postgres pt_database"
echo "3. 如果有备份文件，导入数据: psql -U postgres -d pt_database < backup.sql"
echo "4. 运行初始化脚本: cd backend && node init-db.js"

# 6. 网络配置提示
log_info "网络配置提示:"
echo "请确保以下端口已开放:"
echo "- 3000 (前端)"
echo "- 3001 (后端/API/Tracker)"
echo "- 5432 (PostgreSQL，如果允许远程连接)"

# 7. 启动提示
log_info "启动服务:"
echo "后端: cd backend && npm start"
echo "前端: cd frontend && npm start"

# 8. 验证链接
log_info "部署完成后请访问以下链接验证:"
echo "前端: http://$TARGET_IP:3000"
echo "API: http://$TARGET_IP:3001/health"
echo "Tracker测试: http://$TARGET_IP:3001/tracker/announce/test"

log_success "部署脚本执行完成！"
log_warning "请按照上述提示完成剩余配置步骤"

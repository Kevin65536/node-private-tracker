@echo off
setlocal enabledelayedexpansion

:: PT站部署辅助脚本 (Windows版)
:: 使用方法: deploy.bat [目标服务器IP]

if "%1"=="" (
    echo [ERROR] 请提供目标服务器IP地址
    echo 使用方法: %0 ^<目标服务器IP^>
    echo 例如: %0 192.168.1.100
    exit /b 1
)

set TARGET_IP=%1

echo [INFO] 开始PT站部署流程...
echo [INFO] 目标服务器IP: %TARGET_IP%

:: 1. 环境检查
echo [INFO] 检查环境...

:: 检查Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js 未安装
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js 已安装: %NODE_VERSION%

:: 检查npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm 未安装
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [SUCCESS] npm 已安装: %NPM_VERSION%

:: 检查PostgreSQL
psql --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('psql --version') do set PSQL_VERSION=%%i
    echo [SUCCESS] PostgreSQL 已安装: !PSQL_VERSION!
) else (
    echo [WARNING] PostgreSQL 未找到，请确保已安装并配置
)

:: 2. 创建.env文件
echo [INFO] 配置环境变量...

if not exist "backend\.env" (
    echo [INFO] 创建.env文件...
    (
        echo # 服务器配置
        echo NODE_ENV=production
        echo PORT=3001
        echo.
        echo # 数据库配置 - PostgreSQL
        echo DB_NAME=pt_database
        echo DB_USER=postgres
        echo DB_PASSWORD=请修改为您的密码
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_DIALECT=postgres
        echo.
        echo # SQLite备选配置（如果PostgreSQL不可用）
        echo FALLBACK_TO_SQLITE=true
        echo.
        echo # JWT密钥 ^(生产环境请更换为随机字符串^)
        echo JWT_SECRET=请手动生成32位随机字符串
        echo.
        echo # 文件上传配置
        echo MAX_FILE_SIZE=100000000
        echo UPLOAD_PATH=./uploads
        echo.
        echo # PT站配置
        echo SITE_NAME=LZU PT站
        echo ANNOUNCE_URL=http://%TARGET_IP%:3001
        echo FRONTEND_URL=http://%TARGET_IP%:3000
        echo MIN_RATIO=0.5
        echo SIGNUP_ENABLED=true
        echo INVITE_ONLY=false
        echo.
        echo # 管理员邮箱
        echo ADMIN_EMAIL=admin@your-school.edu.cn
    ) > backend\.env
    echo [SUCCESS] .env文件已创建
) else (
    echo [WARNING] .env文件已存在，请手动检查ANNOUNCE_URL和FRONTEND_URL配置
)

:: 3. 安装依赖
echo [INFO] 安装后端依赖...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] 后端依赖安装失败
    exit /b 1
)
echo [SUCCESS] 后端依赖安装完成

cd ..\frontend
echo [INFO] 安装前端依赖...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] 前端依赖安装失败
    exit /b 1
)
echo [SUCCESS] 前端依赖安装完成

cd ..

:: 4. 创建必要目录
echo [INFO] 创建必要目录...
if not exist "backend\uploads" mkdir backend\uploads
if not exist "backend\logs" mkdir backend\logs
echo [SUCCESS] 目录创建完成

:: 5. 防火墙配置
echo [INFO] 配置防火墙...
netsh advfirewall firewall add rule name="PT-Site-Frontend" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="PT-Site-Backend" dir=in action=allow protocol=TCP localport=3001 >nul 2>&1
echo [SUCCESS] 防火墙规则已添加

:: 6. 数据库初始化提示
echo.
echo [INFO] 数据库初始化提示:
echo 请手动执行以下步骤:
echo 1. 确保PostgreSQL服务正在运行
echo 2. 创建数据库: createdb -U postgres pt_database
echo 3. 如果有备份文件，导入数据: psql -U postgres -d pt_database ^< backup.sql
echo 4. 运行初始化脚本: cd backend ^&^& node init-db.js

:: 7. 启动提示
echo.
echo [INFO] 启动服务:
echo 后端: cd backend ^&^& npm start
echo 前端: cd frontend ^&^& npm start

:: 8. 验证链接
echo.
echo [INFO] 部署完成后请访问以下链接验证:
echo 前端: http://%TARGET_IP%:3000
echo API: http://%TARGET_IP%:3001/health
echo Tracker测试: http://%TARGET_IP%:3001/tracker/announce/test

echo.
echo [SUCCESS] 部署脚本执行完成！
echo [WARNING] 请按照上述提示完成剩余配置步骤

pause

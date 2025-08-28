@echo off
setlocal enabledelayedexpansion

:: PT站 Nginx 配置脚本 (Windows版)
:: 功能：安装、配置和管理Nginx服务

echo ====================================
echo PT站 Nginx 配置脚本
echo ====================================

set "PROJECT_ROOT=%~dp0..\"
set "NGINX_DIR=C:\nginx"
set "NGINX_CONF_DIR=%NGINX_DIR%\conf"
set "NGINX_LOG_DIR=%NGINX_DIR%\logs"

if "%1"=="help" goto :show_help
if "%1"=="--help" goto :show_help
if "%1"=="/?" goto :show_help

:main
echo [INFO] 检查Nginx安装状态...

:: 检查Nginx是否已安装
if exist "%NGINX_DIR%\nginx.exe" (
    echo [SUCCESS] Nginx 已安装在: %NGINX_DIR%
    goto :configure_nginx
) else (
    echo [INFO] Nginx 未安装，开始安装...
    goto :install_nginx
)

:install_nginx
echo [INFO] 开始安装Nginx...

:: 检查是否有下载工具
where curl >nul 2>&1
if %errorlevel% equ 0 (
    set DOWNLOAD_TOOL=curl
) else (
    where powershell >nul 2>&1
    if %errorlevel% equ 0 (
        set DOWNLOAD_TOOL=powershell
    ) else (
        echo [ERROR] 需要curl或PowerShell来下载Nginx
        echo 请手动下载Nginx: http://nginx.org/en/download.html
        pause
        exit /b 1
    )
)

echo [INFO] 创建Nginx目录...
if not exist "C:\nginx" mkdir "C:\nginx"

echo [INFO] 检查Nginx安装包...
if not exist "C:\nginx\nginx.zip" (
    echo [INFO] 下载Nginx...
    if "%DOWNLOAD_TOOL%"=="curl" (
        curl -L -o "C:\nginx\nginx.zip" "http://nginx.org/download/nginx-1.24.0.zip"
    ) else (
        powershell -Command "Invoke-WebRequest -Uri 'http://nginx.org/download/nginx-1.24.0.zip' -OutFile 'C:\nginx\nginx.zip'"
    )
    
    if not exist "C:\nginx\nginx.zip" (
        echo [ERROR] Nginx下载失败
        echo 请手动下载并解压到 C:\nginx
        pause
        exit /b 1
    )
) else (
    echo [SUCCESS] 发现已存在的nginx.zip文件
)

echo [INFO] 解压Nginx...
powershell -Command "Expand-Archive -Path 'C:\nginx\nginx.zip' -DestinationPath 'C:\nginx\temp' -Force"
if exist "C:\nginx\temp\nginx-1.24.0" (
    xcopy "C:\nginx\temp\nginx-1.24.0\*" "C:\nginx" /E /H /Y
) else (
    :: 处理不同版本的解压目录
    for /d %%i in (C:\nginx\temp\nginx-*) do (
        xcopy "%%i\*" "C:\nginx" /E /H /Y
    )
)
rmdir /S /Q "C:\nginx\temp" >nul 2>&1
del "C:\nginx\nginx.zip" >nul 2>&1

echo [SUCCESS] Nginx安装完成

:configure_nginx
echo [INFO] 配置Nginx...

:: 备份原配置文件
if exist "%NGINX_CONF_DIR%\nginx.conf" (
    copy "%NGINX_CONF_DIR%\nginx.conf" "%NGINX_CONF_DIR%\nginx.conf.backup" >nul
    echo [INFO] 原配置文件已备份
)

:: 复制我们的配置文件
copy "%~dp0pt-site.conf" "%NGINX_CONF_DIR%\pt-site.conf" >nul

:: 创建主配置文件
echo [INFO] 创建主配置文件...
(
echo # PT站 Nginx 主配置文件
echo.
echo worker_processes auto;
echo error_log "C:/nginx/logs/error.log";
echo pid "C:/nginx/logs/nginx.pid";
echo.
echo events {
echo     worker_connections 1024;
echo }
echo.
echo http {
echo     include       mime.types;
echo     default_type  application/octet-stream;
echo.
echo     # 日志格式
echo     log_format main '$remote_addr - $remote_user [$time_local] "$request" '
echo                     '$status $body_bytes_sent "$http_referer" '
echo                     '"$http_user_agent" "$http_x_forwarded_for"';
echo.
echo     # 性能优化
echo     sendfile on;
echo     tcp_nopush on;
echo     tcp_nodelay on;
echo     keepalive_timeout 65;
echo     types_hash_max_size 2048;
echo.
echo     # Gzip压缩
echo     gzip on;
echo     gzip_vary on;
echo     gzip_min_length 1024;
echo     gzip_proxied any;
echo     gzip_comp_level 6;
echo     gzip_types
echo         text/plain
echo         text/css
echo         text/xml
echo         text/javascript
echo         application/json
echo         application/javascript
echo         application/xml+rss
echo         application/atom+xml
echo         image/svg+xml;
echo.
echo     # 包含站点配置
echo     include pt-site.conf;
echo }
) > "%NGINX_CONF_DIR%\nginx.conf"

echo [SUCCESS] 配置文件创建完成

:test_config
echo [INFO] 测试Nginx配置...
"%NGINX_DIR%\nginx.exe" -t -c "%NGINX_CONF_DIR%\nginx.conf"
if %errorlevel% neq 0 (
    echo [ERROR] Nginx配置文件有错误
    echo 请检查配置文件: %NGINX_CONF_DIR%\pt-site.conf
    pause
    exit /b 1
)
echo [SUCCESS] Nginx配置测试通过

:start_nginx
echo [INFO] 启动Nginx...

:: 检查是否已在运行
tasklist | find "nginx.exe" >nul
if %errorlevel% equ 0 (
    echo [INFO] 停止现有的Nginx进程...
    taskkill /f /im nginx.exe >nul 2>&1
    timeout /t 2 >nul
)

echo [INFO] 启动Nginx服务...
:: 切换到nginx目录并启动
pushd "%NGINX_DIR%"
start /B "" "%NGINX_DIR%\nginx.exe"
popd
timeout /t 3 >nul

:: 验证启动
tasklist | find "nginx.exe" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Nginx启动成功
) else (
    echo [ERROR] Nginx启动失败
    echo 请检查错误日志: %NGINX_LOG_DIR%\error.log
    pause
    exit /b 1
)

:firewall_config
echo [INFO] 配置防火墙规则...
netsh advfirewall firewall show rule name="Nginx-HTTP" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="Nginx-HTTP" dir=in action=allow protocol=TCP localport=80 >nul
    echo [SUCCESS] 已添加HTTP防火墙规则
)

:show_status
echo.
echo ====================================
echo PT站 Nginx 配置完成
echo ====================================
echo.
echo [状态检查]

:: 检查Nginx进程
tasklist | find "nginx.exe" >nul
if %errorlevel% equ 0 (
    echo ✅ Nginx服务: 正在运行
) else (
    echo ❌ Nginx服务: 未运行
)

:: 检查端口
netstat -an | find ":80 " | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ✅ HTTP端口80: 正在监听
) else (
    echo ❌ HTTP端口80: 未监听
)

:: 检查后端服务
netstat -an | find ":3001 " | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ✅ 后端服务3001: 正在运行
) else (
    echo ⚠️  后端服务3001: 未运行（请先启动后端服务）
)

:: 检查前端服务
netstat -an | find ":3000 " | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ✅ 前端服务3000: 正在运行
) else (
    echo ⚠️  前端服务3000: 未运行（请先启动前端服务）
)

echo.
echo [访问链接]
echo 🌐 PT站首页: http://localhost
echo 🔧 API健康检查: http://localhost/health
echo 📊 Tracker测试: http://localhost/announce
echo.
echo [管理命令]
echo 停止Nginx: "%NGINX_DIR%\nginx.exe" -s stop
echo 重启Nginx: "%NGINX_DIR%\nginx.exe" -s reload
echo 检查配置: "%NGINX_DIR%\nginx.exe" -t
echo.
echo [日志文件]
echo 访问日志: %NGINX_LOG_DIR%\pt_access.log
echo 错误日志: %NGINX_LOG_DIR%\pt_error.log
echo.

goto :end

:show_help
echo 使用方法: %0 [选项]
echo.
echo 选项:
echo   help, --help, /?    显示帮助信息
echo   (无参数)            自动安装和配置Nginx
echo.
echo 功能:
echo   - 自动下载和安装Nginx
echo   - 配置PT站专用的Nginx设置
echo   - 设置反向代理和负载均衡
echo   - 配置防火墙规则
echo   - 启动Nginx服务
echo.
echo 注意事项:
echo   1. 需要管理员权限运行
echo   2. 确保端口80未被占用
echo   3. 先启动后端(3001)和前端(3000)服务
echo.

:end
pause

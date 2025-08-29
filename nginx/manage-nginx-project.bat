@echo off
setlocal enabledelayedexpansion

:: PT站 Nginx 项目内配置管理脚本
:: 支持使用项目内的配置文件管理nginx

set "NGINX_DIR=C:\nginx"
set "NGINX_EXE=%NGINX_DIR%\nginx.exe"
set "PROJECT_DIR=%~dp0.."
set "PROJECT_NGINX_CONF=%~dp0pt-site.conf"
set "MAIN_NGINX_CONF=%~dp0nginx.conf"

if "%1"=="" goto :show_help
if "%1"=="help" goto :show_help
if "%1"=="--help" goto :show_help

:main
if "%1"=="status" goto :show_status
if "%1"=="start" goto :start_nginx
if "%1"=="stop" goto :stop_nginx
if "%1"=="restart" goto :restart_nginx
if "%1"=="reload" goto :reload_nginx
if "%1"=="test" goto :test_config
if "%1"=="deploy" goto :deploy_config
if "%1"=="production" goto :deploy_production
if "%1"=="logs" goto :show_logs

echo [ERROR] 未知的操作: %1
goto :show_help

:show_status
echo ====================================
echo PT站 Nginx 服务状态
echo ====================================

:: 检查Nginx进程
tasklist | find "nginx.exe" >nul
if %errorlevel% equ 0 (
    echo ✅ Nginx进程: 正在运行
    for /f "tokens=2" %%i in ('tasklist /fi "imagename eq nginx.exe" /fo table ^| find "nginx.exe"') do (
        echo    PID: %%i
    )
) else (
    echo ❌ Nginx进程: 未运行
)

:: 检查端口监听
netstat -an | find ":80 " | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ✅ HTTP端口80: 正在监听
) else (
    echo ❌ HTTP端口80: 未监听
)

echo.
echo [配置文件状态]
if exist "%PROJECT_NGINX_CONF%" (
    echo ✅ 项目配置文件: %PROJECT_NGINX_CONF%
) else (
    echo ❌ 项目配置文件: 不存在
)

if exist "%MAIN_NGINX_CONF%" (
    echo ✅ 主配置文件: %MAIN_NGINX_CONF%
) else (
    echo ❌ 主配置文件: 不存在
)

goto :end

:start_nginx
echo [INFO] 启动Nginx服务...

tasklist | find "nginx.exe" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Nginx已在运行
    goto :end
)

if not exist "%NGINX_EXE%" (
    echo [ERROR] Nginx未安装，请先安装nginx到 %NGINX_DIR%
    goto :end
)

:: 确保配置文件已部署
call :deploy_config_silent

:: 从nginx安装目录启动
cd /d "%NGINX_DIR%"
start "" "%NGINX_EXE%"
timeout /t 3 >nul

tasklist | find "nginx.exe" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Nginx启动成功
) else (
    echo [ERROR] Nginx启动失败
)
goto :end

:stop_nginx
echo [INFO] 停止Nginx服务...

tasklist | find "nginx.exe" >nul
if %errorlevel% neq 0 (
    echo [INFO] Nginx未在运行
    goto :end
)

cd /d "%NGINX_DIR%"
"%NGINX_EXE%" -s stop
if %errorlevel% equ 0 (
    echo [SUCCESS] Nginx停止成功
) else (
    echo [WARNING] 正常停止失败，强制结束进程...
    taskkill /f /im nginx.exe >nul 2>&1
    echo [SUCCESS] Nginx已强制停止
)
goto :end

:restart_nginx
echo [INFO] 重启Nginx服务...
call :stop_nginx
timeout /t 2 >nul
call :start_nginx
goto :end

:reload_nginx
echo [INFO] 重新加载Nginx配置...

tasklist | find "nginx.exe" >nul
if %errorlevel% neq 0 (
    echo [ERROR] Nginx未在运行，无法重新加载配置
    echo 请先启动Nginx: %0 start
    goto :end
)

:: 确保配置文件已部署
call :deploy_config_silent

cd /d "%NGINX_DIR%"
"%NGINX_EXE%" -s reload
if %errorlevel% equ 0 (
    echo [SUCCESS] 配置重新加载成功
) else (
    echo [ERROR] 配置重新加载失败，请检查配置语法
    call :test_config
)
goto :end

:test_config
echo [INFO] 检查项目内配置文件语法...

if not exist "%NGINX_EXE%" (
    echo [ERROR] Nginx未安装
    goto :end
)

if not exist "%PROJECT_NGINX_CONF%" (
    echo [ERROR] 项目配置文件不存在: %PROJECT_NGINX_CONF%
    goto :end
)

if not exist "%MAIN_NGINX_CONF%" (
    echo [ERROR] 主配置文件不存在: %MAIN_NGINX_CONF%
    echo 请运行: %0 deploy
    goto :end
)

:: 从nginx目录测试配置
cd /d "%NGINX_DIR%"
"%NGINX_EXE%" -t -c "%MAIN_NGINX_CONF%"
if %errorlevel% equ 0 (
    echo [SUCCESS] 配置文件语法正确
) else (
    echo [ERROR] 配置文件有语法错误
)
goto :end

:deploy_config
echo [INFO] 部署项目配置文件到nginx目录...
:: 首先应用动态路径配置
call "%~dp0configure-paths.bat" apply
if %errorlevel% neq 0 (
    echo [ERROR] 路径配置应用失败
    goto :end
)
call :deploy_config_internal
goto :end

:deploy_production
echo [INFO] 部署生产环境配置...
echo [WARNING] 这将切换到生产环境配置，请确保已构建前端！
pause
:: 应用生产环境路径配置
call "%~dp0configure-paths.bat" production
if %errorlevel% neq 0 (
    echo [ERROR] 生产环境配置失败
    goto :end
)
call :deploy_config_internal
echo [SUCCESS] 生产环境部署完成
echo [INFO] 请运行以下命令重启nginx: %0 restart
goto :end

:deploy_config_silent
call :deploy_config_internal >nul 2>&1
goto :eof

:deploy_config_internal
if not exist "%PROJECT_NGINX_CONF%" (
    echo [ERROR] 项目配置文件不存在: %PROJECT_NGINX_CONF%
    exit /b 1
)

:: 创建完整的nginx.conf文件
echo # PT站 Nginx 主配置文件 - 项目内生成 > "%MAIN_NGINX_CONF%"
echo # 生成时间: %date% %time% >> "%MAIN_NGINX_CONF%"
echo. >> "%MAIN_NGINX_CONF%"
echo worker_processes auto; >> "%MAIN_NGINX_CONF%"
echo error_log "C:/nginx/logs/error.log"; >> "%MAIN_NGINX_CONF%"
echo pid "C:/nginx/logs/nginx.pid"; >> "%MAIN_NGINX_CONF%"
echo. >> "%MAIN_NGINX_CONF%"
echo events { >> "%MAIN_NGINX_CONF%"
echo     worker_connections 1024; >> "%MAIN_NGINX_CONF%"
echo } >> "%MAIN_NGINX_CONF%"
echo. >> "%MAIN_NGINX_CONF%"
echo http { >> "%MAIN_NGINX_CONF%"
echo     include       "C:/nginx/conf/mime.types"; >> "%MAIN_NGINX_CONF%"
echo     default_type  application/octet-stream; >> "%MAIN_NGINX_CONF%"
echo. >> "%MAIN_NGINX_CONF%"
echo     # 日志格式 >> "%MAIN_NGINX_CONF%"
echo     log_format main '$remote_addr - $remote_user [$time_local] "$request" ' >> "%MAIN_NGINX_CONF%"
echo                     '$status $body_bytes_sent "$http_referer" ' >> "%MAIN_NGINX_CONF%"
echo                     '"$http_user_agent" "$http_x_forwarded_for"'; >> "%MAIN_NGINX_CONF%"
echo. >> "%MAIN_NGINX_CONF%"
echo     # 性能优化 >> "%MAIN_NGINX_CONF%"
echo     sendfile on; >> "%MAIN_NGINX_CONF%"
echo     tcp_nopush on; >> "%MAIN_NGINX_CONF%"
echo     tcp_nodelay on; >> "%MAIN_NGINX_CONF%"
echo     keepalive_timeout 65; >> "%MAIN_NGINX_CONF%"
echo     types_hash_max_size 2048; >> "%MAIN_NGINX_CONF%"
echo. >> "%MAIN_NGINX_CONF%"
echo     # 临时文件路径 >> "%MAIN_NGINX_CONF%"
echo     client_body_temp_path "C:/nginx/temp/client_body_temp"; >> "%MAIN_NGINX_CONF%"
echo     proxy_temp_path "C:/nginx/temp/proxy_temp"; >> "%MAIN_NGINX_CONF%"
echo     fastcgi_temp_path "C:/nginx/temp/fastcgi_temp"; >> "%MAIN_NGINX_CONF%"
echo     uwsgi_temp_path "C:/nginx/temp/uwsgi_temp"; >> "%MAIN_NGINX_CONF%"
echo     scgi_temp_path "C:/nginx/temp/scgi_temp"; >> "%MAIN_NGINX_CONF%"
echo. >> "%MAIN_NGINX_CONF%"
echo     # Gzip压缩 >> "%MAIN_NGINX_CONF%"
echo     gzip on; >> "%MAIN_NGINX_CONF%"
echo     gzip_vary on; >> "%MAIN_NGINX_CONF%"
echo     gzip_min_length 1024; >> "%MAIN_NGINX_CONF%"
echo     gzip_proxied any; >> "%MAIN_NGINX_CONF%"
echo     gzip_comp_level 6; >> "%MAIN_NGINX_CONF%"
echo     gzip_types >> "%MAIN_NGINX_CONF%"
echo         text/plain >> "%MAIN_NGINX_CONF%"
echo         text/css >> "%MAIN_NGINX_CONF%"
echo         text/xml >> "%MAIN_NGINX_CONF%"
echo         text/javascript >> "%MAIN_NGINX_CONF%"
echo         application/json >> "%MAIN_NGINX_CONF%"
echo         application/javascript >> "%MAIN_NGINX_CONF%"
echo         application/xml+rss >> "%MAIN_NGINX_CONF%"
echo         application/atom+xml >> "%MAIN_NGINX_CONF%"
echo         image/svg+xml; >> "%MAIN_NGINX_CONF%"
echo. >> "%MAIN_NGINX_CONF%"

:: 包含PT站配置
type "%PROJECT_NGINX_CONF%" >> "%MAIN_NGINX_CONF%"
echo } >> "%MAIN_NGINX_CONF%"

:: 复制到nginx配置目录
copy "%MAIN_NGINX_CONF%" "%NGINX_DIR%\conf\nginx.conf" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] 配置文件已部署到: %NGINX_DIR%\conf\nginx.conf
) else (
    echo [ERROR] 配置文件部署失败
    exit /b 1
)

:: 创建临时目录
if not exist "%NGINX_DIR%\temp" mkdir "%NGINX_DIR%\temp"
if not exist "%NGINX_DIR%\temp\client_body_temp" mkdir "%NGINX_DIR%\temp\client_body_temp"
if not exist "%NGINX_DIR%\temp\proxy_temp" mkdir "%NGINX_DIR%\temp\proxy_temp"
if not exist "%NGINX_DIR%\temp\fastcgi_temp" mkdir "%NGINX_DIR%\temp\fastcgi_temp"
if not exist "%NGINX_DIR%\temp\uwsgi_temp" mkdir "%NGINX_DIR%\temp\uwsgi_temp"
if not exist "%NGINX_DIR%\temp\scgi_temp" mkdir "%NGINX_DIR%\temp\scgi_temp"

goto :eof

:show_logs
if "%2"=="" set LOG_TYPE=access
if "%2"=="access" set LOG_TYPE=access
if "%2"=="error" set LOG_TYPE=error

echo [INFO] 显示Nginx %LOG_TYPE% 日志 (最近50行)...

if "%LOG_TYPE%"=="access" (
    if exist "%NGINX_DIR%\logs\access.log" (
        powershell -Command "Get-Content '%NGINX_DIR%\logs\access.log' -Tail 50"
    ) else (
        echo [INFO] 访问日志文件不存在
    )
) else (
    if exist "%NGINX_DIR%\logs\error.log" (
        powershell -Command "Get-Content '%NGINX_DIR%\logs\error.log' -Tail 50"
    ) else (
        echo [INFO] 错误日志文件不存在
    )
)
goto :end

:show_help
echo ====================================
echo PT站 Nginx 项目内配置管理脚本
echo ====================================
echo.
echo 使用方法: "%~nx0" [命令] [选项]
echo.
echo 命令:
echo   status          显示Nginx和相关服务状态
echo   start           启动Nginx服务
echo   stop            停止Nginx服务
echo   restart         重启Nginx服务
echo   reload          重新加载配置文件
echo   test            检查配置文件语法
echo   deploy          部署开发环境配置到nginx目录
echo   production      部署生产环境配置到nginx目录
echo   logs [type]     显示日志 (access/error)
echo   help            显示此帮助信息
echo.
echo 示例:
echo   "%~nx0" status       # 查看服务状态
echo   "%~nx0" deploy       # 部署开发环境配置
echo   "%~nx0" production   # 部署生产环境配置
echo   "%~nx0" start        # 启动Nginx
echo   "%~nx0" test         # 检查配置语法
echo   "%~nx0" logs error   # 查看错误日志
echo.
echo 配置文件位置:
echo   项目配置: %PROJECT_NGINX_CONF%
echo   生成的主配置: %MAIN_NGINX_CONF%
echo   Nginx目录: %NGINX_DIR%
goto :end

:end

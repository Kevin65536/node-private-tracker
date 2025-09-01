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

:: 检查nginx进程数量
for /f %%i in ('tasklist /fi "imagename eq nginx.exe" 2^>nul ^| find /c "nginx.exe"') do set nginx_count=%%i

if !nginx_count! gtr 0 (
    echo [WARNING] 发现 !nginx_count! 个Nginx进程正在运行
    echo [INFO] 停止现有进程后重新启动...
    call :stop_nginx
    timeout /t 2 >nul
)

if not exist "%NGINX_EXE%" (
    echo [ERROR] Nginx未安装，请先安装nginx到 %NGINX_DIR%
    goto :end
)

:: 确保配置文件已部署
call :deploy_config_silent

:: 切换到nginx安装目录并启动nginx
cd /d "%NGINX_DIR%"
echo [INFO] 从目录启动: %NGINX_DIR%
echo [INFO] 使用配置文件: %NGINX_DIR%\conf\nginx.conf

:: 启动nginx
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

:: 切换到nginx目录并重新加载配置
cd /d "%NGINX_DIR%"
echo [INFO] 从目录重新加载: %NGINX_DIR%
"%NGINX_EXE%" -s reload
if %errorlevel% equ 0 (
    echo [SUCCESS] 配置重新加载成功
) else (
    echo [ERROR] 配置重新加载失败，请检查配置语法
    call :test_config
)
goto :end

:test_config
echo [INFO] 检查项目内nginx.conf配置文件语法...

if not exist "%NGINX_EXE%" (
    echo [ERROR] Nginx未安装
    goto :end
)

if not exist "%MAIN_NGINX_CONF%" (
    echo [ERROR] 项目内nginx.conf文件不存在: %MAIN_NGINX_CONF%
    echo [INFO] 请确保项目nginx目录下有nginx.conf文件
    goto :end
)

:: 先部署配置文件
call :deploy_config_silent

:: 从nginx目录测试配置
cd /d "%NGINX_DIR%"
echo [INFO] 测试配置文件: %NGINX_DIR%\conf\nginx.conf
"%NGINX_EXE%" -t
if %errorlevel% equ 0 (
    echo [SUCCESS] 配置文件语法正确
) else (
    echo [ERROR] 配置文件有语法错误
)
goto :end

:deploy_config
echo [INFO] 部署项目配置文件到nginx目录...
call :deploy_config_internal
goto :end

:deploy_config_silent
call :deploy_config_internal >nul 2>&1
goto :eof

:deploy_config_internal
:: 检查项目内的nginx.conf是否存在
if not exist "%MAIN_NGINX_CONF%" (
    echo [ERROR] 项目内nginx.conf文件不存在: %MAIN_NGINX_CONF%
    echo [INFO] 请确保项目目录下的nginx子目录中有nginx.conf文件
    exit /b 1
)

:: 直接使用项目内的nginx.conf文件，复制到nginx安装目录
copy "%MAIN_NGINX_CONF%" "%NGINX_DIR%\conf\nginx.conf" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] 配置文件已部署到: %NGINX_DIR%\conf\nginx.conf
) else (
    echo [ERROR] 配置文件部署失败
    exit /b 1
)

:: 创建必要的临时目录
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
echo   deploy          部署项目配置到nginx目录
echo   logs [type]     显示日志 (access/error)
echo   help            显示此帮助信息
echo.
echo 示例:
echo   "%~nx0" status       # 查看服务状态
echo   "%~nx0" deploy       # 部署项目配置文件
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

@echo off
setlocal enabledelayedexpansion

:: PT站 Nginx 配置路径动态设置脚本
:: 自动检测项目路径并更新pt-site.conf中的硬编码路径

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
set "NGINX_DIR=C:\nginx"

:: 转换为绝对路径 (去掉相对路径符号)
for %%i in ("%PROJECT_ROOT%") do set "PROJECT_ROOT=%%~fi"

:: 配置文件路径
set "TEMPLATE_CONF=%SCRIPT_DIR%pt-site.conf"
set "PRODUCTION_TEMPLATE=%SCRIPT_DIR%pt-site-production.conf"
set "BACKUP_CONF=%SCRIPT_DIR%pt-site.conf.backup"

echo ====================================
echo PT站 Nginx 路径配置工具
echo ====================================
echo.
echo [INFO] 项目根目录: %PROJECT_ROOT%
echo [INFO] 脚本目录: %SCRIPT_DIR%
echo.

if "%1"=="" goto :show_help
if "%1"=="help" goto :show_help
if "%1"=="--help" goto :show_help

:main
if "%1"=="detect" goto :detect_paths
if "%1"=="apply" goto :apply_paths
if "%1"=="production" goto :setup_production
if "%1"=="restore" goto :restore_backup

echo [ERROR] 未知的操作: %1
goto :show_help

:detect_paths
echo [INFO] 检测当前路径配置...
echo.
echo 检测到的路径:
echo   项目根目录: %PROJECT_ROOT%
echo   前端构建目录: %PROJECT_ROOT%\frontend\build
echo   后端上传目录: %PROJECT_ROOT%\backend\uploads
echo   Nginx日志目录: %NGINX_DIR%\logs
echo.

:: 检查关键目录是否存在
if exist "%PROJECT_ROOT%\frontend" (
    echo ✅ 前端目录存在
) else (
    echo ❌ 前端目录不存在: %PROJECT_ROOT%\frontend
)

if exist "%PROJECT_ROOT%\backend" (
    echo ✅ 后端目录存在
) else (
    echo ❌ 后端目录不存在: %PROJECT_ROOT%\backend
)

if exist "%PROJECT_ROOT%\backend\uploads" (
    echo ✅ 上传目录存在
) else (
    echo ❌ 上传目录不存在: %PROJECT_ROOT%\backend\uploads
    echo [INFO] 将自动创建上传目录
    mkdir "%PROJECT_ROOT%\backend\uploads" 2>nul
)

goto :end

:apply_paths
echo [INFO] 应用动态路径到pt-site.conf...

if not exist "%TEMPLATE_CONF%" (
    echo [ERROR] 配置模板文件不存在: %TEMPLATE_CONF%
    goto :end
)

:: 备份原文件
if exist "%BACKUP_CONF%" del "%BACKUP_CONF%"
copy "%TEMPLATE_CONF%" "%BACKUP_CONF%" >nul
echo [INFO] 已备份原配置文件: %BACKUP_CONF%

:: 创建临时文件用于路径替换
set "TEMP_CONF=%TEMP%\pt-site-temp.conf"

:: 准备替换路径 (Windows路径需要转义反斜杠)
set "ESCAPED_PROJECT_ROOT=%PROJECT_ROOT:\=/%"

echo [INFO] 替换路径变量...
echo   源路径模式: C:/Users/qdsxh/Desktop/toys/pt
echo   目标路径: %ESCAPED_PROJECT_ROOT%

:: 使用PowerShell进行路径替换
powershell -Command "(Get-Content '%TEMPLATE_CONF%') -replace 'C:/Users/qdsxh/Desktop/toys/pt', '%ESCAPED_PROJECT_ROOT%' | Set-Content '%TEMP_CONF%'"

if %errorlevel% equ 0 (
    move "%TEMP_CONF%" "%TEMPLATE_CONF%"
    echo [SUCCESS] 路径替换完成
    echo [INFO] 应用的路径: %ESCAPED_PROJECT_ROOT%
) else (
    echo [ERROR] 路径替换失败
    if exist "%BACKUP_CONF%" (
        copy "%BACKUP_CONF%" "%TEMPLATE_CONF%" >nul
        echo [INFO] 已恢复原配置文件
    )
    goto :end
)

goto :end

:setup_production
echo [INFO] 设置生产环境配置...

if not exist "%PRODUCTION_TEMPLATE%" (
    echo [ERROR] 生产环境模板不存在: %PRODUCTION_TEMPLATE%
    goto :end
)

:: 备份当前开发环境配置
if exist "%BACKUP_CONF%" del "%BACKUP_CONF%"
copy "%TEMPLATE_CONF%" "%BACKUP_CONF%" >nul

:: 复制生产环境模板
copy "%PRODUCTION_TEMPLATE%" "%TEMPLATE_CONF%" >nul
echo [INFO] 已切换到生产环境配置模板

:: 应用动态路径
call :apply_paths_internal

echo [SUCCESS] 生产环境配置完成
goto :end

:apply_paths_internal
set "TEMP_CONF=%TEMP%\pt-site-temp.conf"
set "ESCAPED_PROJECT_ROOT=%PROJECT_ROOT:\=/%"

powershell -Command "(Get-Content '%TEMPLATE_CONF%') -replace '/path/to/pt', '%ESCAPED_PROJECT_ROOT%' | Set-Content '%TEMP_CONF%'"
if %errorlevel% equ 0 (
    move "%TEMP_CONF%" "%TEMPLATE_CONF%"
) else (
    echo [ERROR] 生产环境路径替换失败
)
goto :eof

:restore_backup
echo [INFO] 恢复备份配置...

if not exist "%BACKUP_CONF%" (
    echo [ERROR] 备份文件不存在: %BACKUP_CONF%
    goto :end
)

copy "%BACKUP_CONF%" "%TEMPLATE_CONF%" >nul
echo [SUCCESS] 已恢复备份配置

goto :end

:show_help
echo 使用方法: "%~nx0" [命令]
echo.
echo 命令:
echo   detect        检测当前路径配置
echo   apply         应用动态路径到开发环境配置
echo   production    设置生产环境配置并应用动态路径
echo   restore       恢复备份的配置文件
echo   help          显示此帮助信息
echo.
echo 示例:
echo   "%~nx0" detect       # 检测当前路径
echo   "%~nx0" apply        # 应用动态路径到开发配置
echo   "%~nx0" production   # 切换到生产环境并设置路径
echo   "%~nx0" restore      # 恢复备份
echo.
goto :end

:end
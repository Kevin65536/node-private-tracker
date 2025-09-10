@echo off
setlocal enabledelayedexpansion

REM PT站客户端启动器（简化版）
REM 自动获取最新服务器地址并提供访问入口

echo =====================================
echo PT站客户端启动器
echo =====================================
echo.

REM 固定配置（无需配置文件）
set "IP_SOURCE_URL_BASE=https://gist.githubusercontent.com/Kevin65536/1cdd60ebfa68d6af5302b87f391be522/raw/pt-server-ip.json"
set "DOMAIN=pt.lan"
set "TEMP_IP_FILE=%TEMP%\pt-server-ip.json"

REM 添加时间戳参数绕过GitHub CDN缓存
for /f "tokens=*" %%i in ('powershell -Command "Get-Date -Format 'yyyyMMddHHmmss'"') do (
    set "TIMESTAMP=%%i"
)
set "IP_SOURCE_URL=%IP_SOURCE_URL_BASE%?t=%TIMESTAMP%"

echo 配置信息:
echo   IP源地址: %IP_SOURCE_URL_BASE%
echo   实际请求: %IP_SOURCE_URL%
echo   域名: %DOMAIN%
echo.

REM 检查管理员权限
echo 正在检查管理员权限...
net session >nul 2>&1
if %errorLevel% == 0 (
    set "IS_ADMIN=1"
    echo ✓ 检测到管理员权限（可以更新hosts文件）
) else (
    set "IS_ADMIN=0"
    echo ⚠ 未检测到管理员权限（无法更新hosts文件）
    echo   要更新hosts文件，请右键以管理员身份运行此脚本
)
echo.

REM 获取最新服务器IP信息
echo 正在获取最新服务器信息...
powershell -Command "try { Invoke-RestMethod -Uri '%IP_SOURCE_URL%' -OutFile '%TEMP_IP_FILE%' -TimeoutSec 10; Write-Output 'SUCCESS' } catch { Write-Output 'FAILED' }" >nul 2>&1

if not exist "%TEMP_IP_FILE%" (
    echo ✗ 无法获取服务器信息！
    echo   请检查网络连接
    echo   IP源地址: %IP_SOURCE_URL%
    pause
    exit /b 1
)

REM 解析服务器信息
for /f "tokens=*" %%i in ('powershell -Command "try { $data = Get-Content '%TEMP_IP_FILE%' | ConvertFrom-Json; Write-Output $data.ip } catch { Write-Output 'ERROR' }"') do (
    set "SERVER_IP=%%i"
)

for /f "tokens=*" %%i in ('powershell -Command "try { $data = Get-Content '%TEMP_IP_FILE%' | ConvertFrom-Json; Write-Output $data.timestamp } catch { Write-Output '' }"') do (
    set "TIMESTAMP=%%i"
)

for /f "tokens=*" %%i in ('powershell -Command "try { $data = Get-Content '%TEMP_IP_FILE%' | ConvertFrom-Json; Write-Output $data.server.name } catch { Write-Output '未知服务器' }"') do (
    set "SERVER_NAME=%%i"
)

if "%SERVER_IP%"=="ERROR" (
    echo ✗ 无法解析服务器信息！
    echo   服务器响应格式可能不正确
    pause
    exit /b 1
)

if "%SERVER_IP%"=="" (
    echo ✗ 服务器IP地址为空！
    pause
    exit /b 1
)

echo ✓ 服务器信息获取成功
echo   服务器名称: %SERVER_NAME%
echo   IP地址: %SERVER_IP%
if not "%TIMESTAMP%"=="" (
    echo   更新时间: %TIMESTAMP%
)
echo.

REM 更新hosts文件（如果有管理员权限）
if "%IS_ADMIN%"=="1" (
    echo 正在更新hosts文件...
    
    REM 备份hosts文件
    copy /Y "C:\Windows\System32\drivers\etc\hosts" "C:\Windows\System32\drivers\etc\hosts.backup.%date:~0,4%%date:~5,2%%date:~8,2%" >nul 2>&1
    
    REM 移除旧的PT站域名条目
    powershell -Command "try { $content = Get-Content 'C:\Windows\System32\drivers\etc\hosts' | Where-Object { $_ -notmatch '%DOMAIN%' -and $_ -notmatch '# PT-Client-Launcher' }; Set-Content 'C:\Windows\System32\drivers\etc\hosts' -Value $content; Write-Output 'SUCCESS' } catch { Write-Output 'FAILED' }" >nul 2>&1
    
    REM 添加新的域名条目
    echo.>> "C:\Windows\System32\drivers\etc\hosts"
    echo # PT-Client-Launcher - Auto Generated>> "C:\Windows\System32\drivers\etc\hosts"
    echo %SERVER_IP% %DOMAIN%>> "C:\Windows\System32\drivers\etc\hosts"
    echo # End PT-Client-Launcher>> "C:\Windows\System32\drivers\etc\hosts"
    
    echo ✓ hosts文件已更新
    echo   %SERVER_IP% %DOMAIN%
    echo.
    
    REM 刷新DNS缓存
    echo 正在刷新DNS缓存...
    ipconfig /flushdns >nul 2>&1
    echo ✓ DNS缓存已刷新
    echo.
)

REM 清理临时文件
del "%TEMP_IP_FILE%" >nul 2>&1

REM 显示访问信息
echo =====================================
echo 服务器访问信息
echo =====================================
echo.
echo 服务器IP: %SERVER_IP%
if "%IS_ADMIN%"=="1" (
    echo 域名访问: %DOMAIN%
)
echo.
echo 可用的访问地址：
echo.
echo 1. 前端界面：
echo    http://%SERVER_IP%:3000
if "%IS_ADMIN%"=="1" (
    echo    http://%DOMAIN%:3000
)
echo.
echo 2. 后端API：
echo    http://%SERVER_IP%:3001
if "%IS_ADMIN%"=="1" (
    echo    http://%DOMAIN%:3001
)
echo.
echo 3. Nginx入口：
echo    HTTP:  http://%SERVER_IP%/
echo    HTTPS: https://%SERVER_IP%/
if "%IS_ADMIN%"=="1" (
    echo    HTTP:  http://%DOMAIN%/
    echo    HTTPS: https://%DOMAIN%/
)
echo.
echo 4. Tracker地址：
echo    http://%SERVER_IP%:3001/announce
if "%IS_ADMIN%"=="1" (
    echo    http://%DOMAIN%:3001/announce
)
echo.

REM 提供选项菜单
:menu
echo =====================================
echo 请选择操作：
echo =====================================
echo.
echo 1. 在浏览器中打开前端界面
echo 2. 在浏览器中打开Nginx入口
echo 3. 复制前端地址到剪贴板
echo 4. 复制Nginx地址到剪贴板
echo 5. 刷新服务器信息
if not "%IS_ADMIN%"=="1" (
    echo 6. 以管理员身份重新运行
)
echo 0. 退出
echo.
set /p "choice=请输入选项 (0-6): "

if "%choice%"=="1" goto open_frontend
if "%choice%"=="2" goto open_nginx
if "%choice%"=="3" goto copy_frontend
if "%choice%"=="4" goto copy_nginx
if "%choice%"=="5" goto refresh
if "%choice%"=="6" goto run_as_admin
if "%choice%"=="0" goto exit_script

echo 无效选项，请重新选择。
echo.
goto menu

:open_frontend
echo 正在打开前端界面...
if "%IS_ADMIN%"=="1" (
    start http://%DOMAIN%:3000
) else (
    start http://%SERVER_IP%:3000
)
goto menu

:open_nginx
echo 正在打开Nginx入口...
if "%IS_ADMIN%"=="1" (
    start http://%DOMAIN%/
) else (
    start http://%SERVER_IP%/
)
goto menu

:copy_frontend
if "%IS_ADMIN%"=="1" (
    echo http://%DOMAIN%:3000 | clip
    echo ✓ 前端地址已复制到剪贴板: http://%DOMAIN%:3000
) else (
    echo http://%SERVER_IP%:3000 | clip
    echo ✓ 前端地址已复制到剪贴板: http://%SERVER_IP%:3000
)
goto menu

:copy_nginx
if "%IS_ADMIN%"=="1" (
    echo http://%DOMAIN%/ | clip
    echo ✓ Nginx地址已复制到剪贴板: http://%DOMAIN%/
) else (
    echo http://%SERVER_IP%/ | clip
    echo ✓ Nginx地址已复制到剪贴板: http://%SERVER_IP%/
)
goto menu

:refresh
echo.
echo 正在刷新服务器信息...
REM 重新生成时间戳绕过缓存
for /f "tokens=*" %%i in ('powershell -Command "Get-Date -Format 'yyyyMMddHHmmss'"') do (
    set "TIMESTAMP=%%i"
)
set "IP_SOURCE_URL=%IP_SOURCE_URL_BASE%?t=%TIMESTAMP%"
echo 使用新的时间戳: %TIMESTAMP%
REM 重新开始获取IP信息的过程
powershell -Command "try { Invoke-RestMethod -Uri '%IP_SOURCE_URL%' -OutFile '%TEMP_IP_FILE%' -TimeoutSec 10; Write-Output 'SUCCESS' } catch { Write-Output 'FAILED' }" >nul 2>&1

if not exist "%TEMP_IP_FILE%" (
    echo ✗ 无法获取服务器信息！
    goto menu
)

REM 重新解析服务器信息
for /f "tokens=*" %%i in ('powershell -Command "try { $data = Get-Content '%TEMP_IP_FILE%' | ConvertFrom-Json; Write-Output $data.ip } catch { Write-Output 'ERROR' }"') do (
    set "SERVER_IP=%%i"
)

for /f "tokens=*" %%i in ('powershell -Command "try { $data = Get-Content '%TEMP_IP_FILE%' | ConvertFrom-Json; Write-Output $data.timestamp } catch { Write-Output '' }"') do (
    set "TIMESTAMP=%%i"
)

for /f "tokens=*" %%i in ('powershell -Command "try { $data = Get-Content '%TEMP_IP_FILE%' | ConvertFrom-Json; Write-Output $data.server.name } catch { Write-Output '未知服务器' }"') do (
    set "SERVER_NAME=%%i"
)

echo ✓ 服务器信息已刷新
echo   服务器名称: %SERVER_NAME%
echo   IP地址: %SERVER_IP%
if not "%TIMESTAMP%"=="" (
    echo   更新时间: %TIMESTAMP%
)
echo.

REM 如果有管理员权限，更新hosts
if "%IS_ADMIN%"=="1" (
    REM 移除旧的PT站域名条目
    powershell -Command "try { $content = Get-Content 'C:\Windows\System32\drivers\etc\hosts' | Where-Object { $_ -notmatch '%DOMAIN%' -and $_ -notmatch '# PT-Client-Launcher' }; Set-Content 'C:\Windows\System32\drivers\etc\hosts' -Value $content; Write-Output 'SUCCESS' } catch { Write-Output 'FAILED' }" >nul 2>&1
    
    REM 添加新的域名条目
    echo.>> "C:\Windows\System32\drivers\etc\hosts"
    echo # PT-Client-Launcher - Auto Generated>> "C:\Windows\System32\drivers\etc\hosts"
    echo %SERVER_IP% %DOMAIN%>> "C:\Windows\System32\drivers\etc\hosts"
    echo # End PT-Client-Launcher>> "C:\Windows\System32\drivers\etc\hosts"
    
    echo ✓ hosts文件已更新
    ipconfig /flushdns >nul 2>&1
)

del "%TEMP_IP_FILE%" >nul 2>&1
goto menu

:run_as_admin
if "%IS_ADMIN%"=="1" (
    echo 当前已经是管理员权限。
    goto menu
)
echo 正在以管理员身份重新启动...
powershell -Command "Start-Process '%~f0' -Verb RunAs"
exit /b 0

:exit_script
echo.
echo 感谢使用PT站客户端启动器！
timeout /t 2 >nul
exit /b 0

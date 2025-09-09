@echo off
setlocal enabledelayedexpansion

REM ========================================
REM PT站系统一键启动脚本
REM ========================================
REM 功能：自动配置IP地址并启动所有必要的服务
REM 版本：2.0 - 结构化重构版本
REM 更新：2025年9月9日
REM ========================================

echo ========================================
echo PT站系统一键启动脚本 v2.0
echo ========================================
echo.

REM 初始化变量
set "PROJECT_DIR=%~dp0"
set "LOCAL_IP="
set "HOSTNAME="
set "HOSTNAME_LOCAL="
set "DEPLOY_SUCCESS=0"
set "DEPLOY_WARNING=0"
set "DEPLOY_ERROR=0"

REM ========================================
REM 第一阶段：环境检测
REM ========================================
echo [阶段 1/4] 正在检测系统环境...
call :detect_environment
if !errorlevel! neq 0 (
    echo ❌ 环境检测失败！
    pause
    exit /b 1
)
echo ✅ 环境检测完成

echo.
REM ========================================
REM 第二阶段：配置文件管理
REM ========================================
echo [阶段 2/4] 正在管理配置文件...
call :manage_configurations
if !errorlevel! neq 0 (
    echo ❌ 配置管理失败！
    pause
    exit /b 1
)
echo ✅ 配置管理完成

echo.
REM ========================================
REM 第三阶段：SSL证书检查
REM ========================================
echo [阶段 3/4] 正在检查SSL证书...
call :check_ssl_certificates
echo ✅ SSL证书检查完成

echo.
REM ========================================
REM 第四阶段：服务启动
REM ========================================
echo [阶段 4/4] 正在启动系统服务...
call :start_services
call :final_status_check

echo.
echo ========================================
echo PT站系统启动完成！
echo ========================================
call :display_access_info

echo.
echo 按任意键退出启动脚本...
pause >NUL
exit /b 0

REM ========================================
REM 函数定义区域
REM ========================================

:detect_environment
echo   检测IP地址和主机名...

REM 优先查找172.21网段
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4" ^| findstr "172.21"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set LOCAL_IP=%%j
        echo   ✓ 检测到172.21网段IP: !LOCAL_IP!
        goto :ip_detected
    )
)

REM 查找其他网段（排除本地回环）
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set LOCAL_IP=%%j
        echo   ✓ 检测到IP地址: !LOCAL_IP!
        goto :ip_detected
    )
)

echo   ❌ 错误：无法检测到有效IP地址
exit /b 1

:ip_detected
REM 检测主机名
for /f "tokens=*" %%i in ('hostname') do set HOSTNAME=%%i
set HOSTNAME_LOCAL=!HOSTNAME!.local
echo   ✓ 主机名: !HOSTNAME!
echo   ✓ 域名: !HOSTNAME_LOCAL!

echo   检查项目结构...
if not exist "backend\.env" (
    echo   ❌ backend\.env 文件不存在！
    exit /b 1
)
if not exist "nginx\nginx.conf" (
    echo   ❌ nginx\nginx.conf 文件不存在！
    exit /b 1
)
if not exist "nginx\pt-site.conf" (
    echo   ❌ nginx\pt-site.conf 文件不存在！
    exit /b 1
)
echo   ✓ 项目结构检查通过
exit /b 0

:manage_configurations
echo   创建配置备份...
if not exist "backup" mkdir backup

REM 生成时间戳
for /f "tokens=1-3 delims=/" %%a in ('date /t') do set BACKUP_DATE=%%c%%a%%b
for /f "tokens=1-2 delims=:" %%a in ('time /t') do set BACKUP_TIME=%%a%%b
set "BACKUP_TIMESTAMP=!BACKUP_DATE!-!BACKUP_TIME!"
set "BACKUP_TIMESTAMP=!BACKUP_TIMESTAMP: =!"
set "BACKUP_TIMESTAMP=!BACKUP_TIMESTAMP::=!"

copy "backend\.env" "backup\.env.backup.!BACKUP_TIMESTAMP!" >NUL 2>&1
copy "nginx\nginx.conf" "backup\nginx.conf.backup.!BACKUP_TIMESTAMP!" >NUL 2>&1
copy "nginx\pt-site.conf" "backup\pt-site.conf.backup.!BACKUP_TIMESTAMP!" >NUL 2>&1
echo   ✓ 配置文件已备份

echo   更新后端配置...
powershell -Command "try { (Get-Content 'backend\.env' -ErrorAction Stop) -replace 'ANNOUNCE_URL=http://[0-9.]+:3001', 'ANNOUNCE_URL=http://!LOCAL_IP!:3001' -replace 'FRONTEND_URL=http://[0-9.]+:3000', 'FRONTEND_URL=http://!LOCAL_IP!:3000' | Set-Content 'backend\.env' -ErrorAction Stop; Write-Host '   ✓ 后端配置更新成功' } catch { Write-Host '   ⚠ 后端配置更新失败：' + $_.Exception.Message }"

echo   更新Nginx配置...
node IP-management/update-ip-configs.js 2>NUL
if !errorlevel! equ 0 (
    echo   ✓ Nginx配置通过脚本更新成功
) else (
    echo   使用备用方案更新Nginx配置...
    powershell -Command "try { (Get-Content 'nginx\nginx.conf' -ErrorAction Stop) -replace 'server_name [0-9.]+;', 'server_name !LOCAL_IP!;' -replace 'https://[0-9.]+', 'https://!LOCAL_IP!' -replace 'return 301 https://[0-9.]+\$', 'return 301 https://!LOCAL_IP!$' -replace 'server_name pt\.lan \*\.local [0-9.]+', 'server_name pt.lan *.local !LOCAL_IP!' | Set-Content 'nginx\nginx.conf' -ErrorAction Stop; Write-Host '   ✓ 备用方案执行成功' } catch { Write-Host '   ⚠ 备用方案失败：' + $_.Exception.Message }"
)

echo   添加主机名域名...
powershell -Command "try { $content = Get-Content 'nginx\nginx.conf' -Raw -ErrorAction Stop; if ($content -notmatch '!HOSTNAME_LOCAL!') { $content = $content -replace '(server_name pt\.lan \*\.local[^;]*)', ('$1 !HOSTNAME_LOCAL!'); Set-Content 'nginx\nginx.conf' -Value $content -NoNewline -ErrorAction Stop; Write-Host '   ✓ 已添加主机名域名' } else { Write-Host '   ✓ 主机名域名已存在' } } catch { Write-Host '   ⚠ 更新主机名时出错：' + $_.Exception.Message }"

echo   更新站点配置路径...
set "UPLOAD_PATH=!PROJECT_DIR!\backend\uploads"
set "UPLOAD_PATH=!UPLOAD_PATH:\=/!"
powershell -Command "try { $content = Get-Content 'nginx\pt-site.conf' -Raw -ErrorAction Stop; $newContent = $content -replace 'alias [^;]+/uploads/;', 'alias !UPLOAD_PATH!/;'; Set-Content 'nginx\pt-site.conf' -Value $newContent -NoNewline -ErrorAction Stop; Write-Host '   ✓ 站点配置路径已更新' } catch { Write-Host '   ⚠ 站点配置更新失败：' + $_.Exception.Message }"

if exist "C:\nginx" (
    echo   复制配置到Nginx目录...
    copy /Y "nginx\nginx.conf" "C:\nginx\conf\nginx.conf" >NUL
    copy /Y "nginx\pt-site.conf" "C:\nginx\conf\pt-site.conf" >NUL
    echo   ✓ 配置文件已更新到Nginx目录
) else (
    echo   ⚠ 警告：C:\nginx 目录不存在
)
exit /b 0

:check_ssl_certificates
if exist "C:\nginx\ssl\pt.lan.crt" (
    echo   ✓ 发现现有SSL证书
    
    echo   检查证书支持的域名...
    powershell -Command "try { $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2('C:\nginx\ssl\pt.lan.crt'); Write-Host ('   证书主题: ' + $cert.Subject); $sans = $cert.Extensions | Where-Object { $_.Oid.Value -eq '2.5.29.17' }; if ($sans) { $sanString = $sans.Format($true); $hostname = '!HOSTNAME!'; $hostnameLocal = '!HOSTNAME_LOCAL!'; if ($sanString -match [regex]::Escape($hostnameLocal) -or $sanString -match [regex]::Escape($hostname) -or $sanString -match '\*\.local') { Write-Host '   ✅ 证书完美支持当前主机名域名访问！' } else { Write-Host ('   ⚠ 证书不包含当前主机名域名：' + $hostnameLocal) } } else { Write-Host '   ⚠ 证书没有Subject Alternative Name扩展' } } catch { Write-Host ('   ❌ 证书读取失败: ' + $_.Exception.Message) }"
    
    echo.
    set /p "REGEN_CERT=   是否重新生成SSL证书以包含最新主机名？(推荐: y/N): "
    if /i "!REGEN_CERT!"=="y" (
        echo   正在重新生成SSL证书...
        cd /d "nginx"
        call generate-ssl-cert.bat
        cd /d "!PROJECT_DIR!"
        echo   ✓ SSL证书已重新生成
    ) else (
        echo   ✓ 保持现有SSL证书
    )
) else (
    echo   ⚠ 未找到SSL证书
    set /p "GEN_CERT=   是否现在生成SSL证书？(Y/n): "
    if /i not "!GEN_CERT!"=="n" (
        echo   正在生成SSL证书...
        cd /d "nginx"
        call generate-ssl-cert.bat
        cd /d "!PROJECT_DIR!"
        echo   ✓ SSL证书已生成
    ) else (
        echo   ⚠ 跳过SSL证书生成
    )
)
exit /b 0

:start_services
echo   停止现有服务...
tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I /N "nginx.exe">NUL
if "%ERRORLEVEL%"=="0" (
    taskkill /F /IM nginx.exe >NUL 2>&1
    timeout /t 2 >NUL
    echo   ✓ 已停止现有Nginx进程
)

echo   [1/3] 启动后端API服务...
cd /d "backend"
start "PT后端服务" cmd /k "echo 后端服务启动中... && npm start"
cd /d "!PROJECT_DIR!"
timeout /t 5 >NUL
echo   ✓ 后端服务启动命令已执行

echo   [2/3] 启动前端React服务...
cd /d "frontend"
start "PT前端服务" cmd /k "echo 前端服务启动中... && npm start"
cd /d "!PROJECT_DIR!"
timeout /t 5 >NUL
echo   ✓ 前端服务启动命令已执行

echo   [3/3] 启动Nginx HTTPS服务...
call :validate_nginx_config
if !errorlevel! equ 0 (
    cd /d "nginx"
    call manage-nginx.bat start >NUL 2>&1
    cd /d "!PROJECT_DIR!"
    timeout /t 2 >NUL
    
    tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I /N "nginx.exe">NUL
    if "!ERRORLEVEL!"=="0" (
        echo   ✓ Nginx服务启动成功
    ) else (
        echo   ❌ Nginx服务启动失败
        set /a DEPLOY_ERROR+=1
    )
) else (
    echo   ❌ Nginx配置验证失败，跳过启动
    set /a DEPLOY_ERROR+=1
)

echo   上传IP地址到远程服务...
node IP-management/upload-ip.js >NUL 2>&1
if !errorlevel! equ 0 (
    echo   ✓ IP地址上传成功
) else (
    echo   ⚠ IP地址上传失败
    set /a DEPLOY_WARNING+=1
)
exit /b 0

:validate_nginx_config
if exist "C:\nginx\nginx.exe" (
    cd /d "C:\nginx"
    nginx.exe -t >NUL 2>&1
    if !errorlevel! equ 0 (
        set /a DEPLOY_SUCCESS+=1
        cd /d "!PROJECT_DIR!"
        exit /b 0
    ) else (
        set /a DEPLOY_ERROR+=1
        cd /d "!PROJECT_DIR!"
        exit /b 1
    )
) else (
    echo   ❌ Nginx未安装
    set /a DEPLOY_ERROR+=1
    exit /b 1
)

:final_status_check
echo   最终服务状态检查...
timeout /t 3 >NUL

netstat -an | findstr ":3000 " >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    echo   ✓ 前端服务 (端口3000) - 运行中
) else (
    echo   ❌ 前端服务 (端口3000) - 未启动
)

netstat -an | findstr ":3001 " >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    echo   ✓ 后端服务 (端口3001) - 运行中
) else (
    echo   ❌ 后端服务 (端口3001) - 未启动
)

tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I /N "nginx.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo   ✓ Nginx服务 - 运行中
) else (
    echo   ❌ Nginx服务 - 未启动
)
exit /b 0

:display_access_info
echo 当前配置信息：
echo   IP地址：!LOCAL_IP!
echo   主机名：!HOSTNAME!
echo   域名：!HOSTNAME_LOCAL!
echo.
echo 服务访问地址：
echo   后端API：    http://!LOCAL_IP!:3001
echo   前端界面：   http://!LOCAL_IP!:3000
if exist "C:\nginx\ssl\pt.lan.crt" (
    echo   HTTPS入口：  https://!LOCAL_IP!/ (推荐)
    echo   HTTPS入口：  https://!HOSTNAME_LOCAL!/
    echo   HTTP入口：   http://!LOCAL_IP!/ (自动重定向)
    echo   HTTP入口：   http://!HOSTNAME_LOCAL!/ (自动重定向)
) else (
    echo   HTTP入口：   http://!LOCAL_IP!/
    echo   HTTP入口：   http://!HOSTNAME_LOCAL!/
)
echo.
echo Tracker服务：
echo   Announce：   http://!LOCAL_IP!:3001/announce
echo.
echo 状态信息：
if !DEPLOY_ERROR! equ 0 (
    if !DEPLOY_WARNING! equ 0 (
        echo   ✅ 所有服务正常启动
    ) else (
        echo   ⚠️ 基本正常但有 !DEPLOY_WARNING! 个警告
    )
) else (
    echo   ❌ 发现 !DEPLOY_ERROR! 个问题需要解决
)
echo.
echo 日志位置：
echo   - 后端日志：backend目录的终端窗口
echo   - 前端日志：frontend目录的终端窗口  
echo   - Nginx日志：C:\nginx\logs\
echo   - Nginx管理：nginx\manage-nginx.bat
exit /b 0

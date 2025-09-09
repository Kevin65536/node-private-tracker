@echo off
setlocal enabledelayedexpansion

REM PT站一键启动脚本
REM 自动配置IP地址并启动所有必要的服务

echo =====================================
echo PT站系统一键启动脚本
echo =====================================
echo.

REM 获取本机IP地址
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4" ^| findstr "172.21"') do (
    for /f "tokens=1" %%j in ("%%i") do (
        set LOCAL_IP=%%j
    )
)

REM 如果没有找到172.21网段的IP，尝试其他网段
if "!LOCAL_IP!"=="" (
    for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
        for /f "tokens=1" %%j in ("%%i") do (
            set LOCAL_IP=%%j
            goto :found_ip
        )
    )
)

:found_ip
if "!LOCAL_IP!"=="" (
    echo 错误：无法获取本机IP地址！
    pause
    exit /b 1
)

echo 检测到本机IP地址：!LOCAL_IP!

REM 获取本机主机名
for /f "tokens=*" %%i in ('hostname') do set HOSTNAME=%%i
echo 检测到主机名：!HOSTNAME!
set HOSTNAME_LOCAL=!HOSTNAME!.local
echo 将配置主机名域名：!HOSTNAME_LOCAL!
echo.

REM 检查必要的目录和文件
echo 正在检查项目结构...
if not exist "backend\.env" (
    echo 错误：backend\.env 文件不存在！
    pause
    exit /b 1
)

if not exist "nginx\nginx.conf" (
    echo 错误：nginx\nginx.conf 文件不存在！
    pause
    exit /b 1
)

if not exist "nginx\pt-site.conf" (
    echo 错误：nginx\pt-site.conf 文件不存在！
    pause
    exit /b 1
)

REM 创建备份目录
if not exist "backup" mkdir backup

REM 备份原始配置文件
echo 正在备份配置文件...
REM 获取安全的时间戳格式
for /f "tokens=1-3 delims=/" %%a in ('date /t') do (
    set BACKUP_DATE=%%c%%a%%b
)
for /f "tokens=1-2 delims=:" %%a in ('time /t') do (
    set BACKUP_TIME=%%a%%b
)
set "BACKUP_TIMESTAMP=!BACKUP_DATE!-!BACKUP_TIME!"
set "BACKUP_TIMESTAMP=!BACKUP_TIMESTAMP: =!"
set "BACKUP_TIMESTAMP=!BACKUP_TIMESTAMP::=!"
copy "backend\.env" "backup\.env.backup.!BACKUP_TIMESTAMP!" >NUL
copy "nginx\nginx.conf" "backup\nginx.conf.backup.!BACKUP_TIMESTAMP!" >NUL
copy "nginx\pt-site.conf" "backup\pt-site.conf.backup.!BACKUP_TIMESTAMP!" >NUL

REM 更新backend\.env文件中的IP地址
echo 正在更新后端配置...
powershell -Command "try { (Get-Content 'backend\.env' -ErrorAction Stop) -replace 'ANNOUNCE_URL=http://[0-9.]+:3001', 'ANNOUNCE_URL=http://!LOCAL_IP!:3001' -replace 'FRONTEND_URL=http://[0-9.]+:3000', 'FRONTEND_URL=http://!LOCAL_IP!:3000' | Set-Content 'backend\.env' -ErrorAction Stop; Write-Host '✓ 后端配置更新成功' } catch { Write-Host '⚠ 后端配置更新失败：' + $_.Exception.Message }"

REM 更新nginx.conf中的IP地址
echo 正在更新Nginx主配置...
node IP-management/update-ip-configs.js
if !errorlevel! equ 0 (
    echo ✓ Nginx配置更新成功
) else (
    echo ⚠ Nginx配置更新失败，使用备用方案
    powershell -Command "try { (Get-Content 'nginx\nginx.conf' -ErrorAction Stop) -replace 'server_name [0-9.]+;', 'server_name !LOCAL_IP!;' -replace 'https://[0-9.]+', 'https://!LOCAL_IP!' -replace 'return 301 https://[0-9.]+\$', 'return 301 https://!LOCAL_IP!$' -replace 'server_name pt\.lan \*\.local [0-9.]+;', 'server_name pt.lan *.local !LOCAL_IP!;' | Set-Content 'nginx\nginx.conf' -ErrorAction Stop; Write-Host '✓ 备用方案执行成功' } catch { Write-Host '⚠ 备用方案也失败了：' + $_.Exception.Message }"
)

REM 更新主机名.local到nginx配置
echo 正在添加主机名域名到Nginx配置...
powershell -Command "try { $content = Get-Content 'nginx\nginx.conf' -Raw -ErrorAction Stop; if ($content -notmatch '!HOSTNAME_LOCAL!') { $content = $content -replace '(server_name pt\.lan \*\.local[^;]*)', ('$1 !HOSTNAME_LOCAL!'); $content = $content -replace '(server_name pt\.lan \*\.local [0-9.]+ [^;]*)', ('$1 !HOSTNAME_LOCAL!'); Set-Content 'nginx\nginx.conf' -Value $content -NoNewline -ErrorAction Stop; Write-Host '✓ 已添加主机名域名 !HOSTNAME_LOCAL! 到nginx配置' } else { Write-Host '✓ 主机名域名 !HOSTNAME_LOCAL! 已存在于nginx配置中' } } catch { Write-Host '⚠ 更新nginx配置时出错：' + $_.Exception.Message }"

REM 更新pt-site.conf中的上传目录路径
echo 正在更新站点配置...
set "CURRENT_DIR=%CD%"
set "UPLOAD_PATH=!CURRENT_DIR!\backend\uploads"
set "UPLOAD_PATH=!UPLOAD_PATH:\=/!"
echo 原始路径: !CURRENT_DIR!\backend\uploads
echo 转换路径: !UPLOAD_PATH!
powershell -Command "try { $content = Get-Content 'nginx\pt-site.conf' -Raw -ErrorAction Stop; $newContent = $content -replace 'alias [^;]+/uploads/;', 'alias !UPLOAD_PATH!/;'; Set-Content 'nginx\pt-site.conf' -Value $newContent -NoNewline -ErrorAction Stop; Write-Host '✓ 站点配置更新成功' } catch { Write-Host '⚠ 站点配置更新失败：' + $_.Exception.Message }"

REM 检查并创建nginx目录结构
echo 正在检查Nginx安装...
if not exist "C:\nginx" (
    echo 警告：C:\nginx 目录不存在，请确保Nginx已正确安装！
    pause
)

if exist "C:\nginx" (
    echo 正在复制配置文件到Nginx目录...
    copy /Y "nginx\nginx.conf" "C:\nginx\conf\nginx.conf" >NUL
    copy /Y "nginx\pt-site.conf" "C:\nginx\conf\pt-site.conf" >NUL
    echo ✓ 配置文件已更新
)

REM 检查SSL证书并询问是否重新生成
echo.
echo 正在检查SSL证书...
if exist "C:\nginx\ssl\pt.lan.crt" (
    echo ✓ 发现现有SSL证书
    
    REM 检查证书是否包含当前主机名
    echo 当前主机名：!HOSTNAME!
    echo 主机名域名：!HOSTNAME_LOCAL!
    powershell -Command "try { $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2('C:\nginx\ssl\pt.lan.crt'); Write-Host ('✓ 证书主题: ' + $cert.Subject); $sans = $cert.Extensions | Where-Object { $_.Oid.Value -eq '2.5.29.17' }; if ($sans) { $sanString = $sans.Format($true); Write-Host ('✓ SAN扩展内容:'); Write-Host $sanString; $hostname = '!HOSTNAME!'; $hostnameLocal = '!HOSTNAME_LOCAL!'; if ($sanString -match [regex]::Escape($hostnameLocal) -or $sanString -match [regex]::Escape($hostname) -or $sanString -match '\*\.local') { Write-Host '✅ 证书完美支持当前主机名域名访问！' } else { Write-Host '⚠ 证书不包含当前主机名域名：' + $hostnameLocal } } else { Write-Host '⚠ 证书没有Subject Alternative Name扩展' } } catch { Write-Host ('❌ 证书读取失败: ' + $_.Exception.Message) }"
    
    echo.
    set /p "REGEN_CERT=是否重新生成SSL证书以包含最新主机名？(推荐: y/N): "
    if /i "!REGEN_CERT!"=="y" (
        echo 正在重新生成SSL证书...
        echo ℹ 新证书将包含 pt.lan 和 !HOSTNAME_LOCAL! 域名
        cd /d "nginx"
        call generate-ssl-cert.bat
        cd /d "%~dp0"
        echo ✓ SSL证书已重新生成
    ) else (
        echo ✓ 保持现有SSL证书
        echo ℹ 注意：通过 !HOSTNAME_LOCAL! 访问可能会显示证书警告
    )
) else (
    echo ⚠ 未找到SSL证书
    set /p "GEN_CERT=是否现在生成SSL证书？(Y/n): "
    if /i not "!GEN_CERT!"=="n" (
        echo 正在生成SSL证书...
        cd /d "nginx"
        call generate-ssl-cert.bat
        cd /d "%~dp0"
        echo ✓ SSL证书已生成
    ) else (
        echo ⚠ 跳过SSL证书生成，将使用HTTP模式
    )
)

echo.
echo =====================================
echo 正在停止现有服务...
echo =====================================
echo.

REM 停止可能正在运行的服务
echo 正在停止现有服务...
tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I /N "nginx.exe">NUL
if "%ERRORLEVEL%"=="0" (
    taskkill /F /IM nginx.exe >NUL 2>&1
    timeout /t 2 >NUL
)

tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo 检测到Node.js进程正在运行，请手动检查并停止不需要的进程
)

echo.
echo =====================================
echo 正在启动PT站系统服务...
echo =====================================
echo.

REM 启动后端服务
echo [1/3] 启动后端API服务...
cd /d "%~dp0backend"
start "PT后端服务" cmd /k "echo 后端服务启动中... && npm start"
cd /d "%~dp0"

REM 等待后端启动
timeout /t 5 >NUL

REM 启动前端服务
echo [2/3] 启动前端React服务...
cd /d "%~dp0frontend"
start "PT前端服务" cmd /k "echo 前端服务启动中... && npm start"
cd /d "%~dp0"

REM 等待前端启动
timeout /t 5 >NUL

REM 部署检查和启动Nginx HTTPS服务
echo [3/3] 部署检查并启动Nginx HTTPS服务...

echo 正在进行部署检查...
set "DEPLOY_SUCCESS=0"
set "DEPLOY_WARNING=0"
set "DEPLOY_ERROR=0"

REM 检查Nginx安装
if exist "C:\nginx\nginx.exe" (
    echo ✓ Nginx已安装
    set /a DEPLOY_SUCCESS+=1
) else (
    echo ✗ Nginx未安装
    set /a DEPLOY_ERROR+=1
    goto :skip_nginx_start
)

REM 检查配置文件语法
echo 正在检查配置文件语法...
cd /d "C:\nginx"
nginx.exe -t 2>&1
if !errorlevel! equ 0 (
    echo ✓ 配置语法正确
    set /a DEPLOY_SUCCESS+=1
) else (
    echo ✗ 配置语法错误
    echo.
    echo === 详细错误信息 ===
    nginx.exe -t
    echo === 错误信息结束 ===
    echo.
    set /a DEPLOY_ERROR+=1
)
cd /d "%~dp0"

REM 检查上传目录
if exist "backend\uploads" (
    echo ✓ 上传目录存在
    set /a DEPLOY_SUCCESS+=1
) else (
    echo ⚠ 上传目录不存在，正在创建...
    mkdir "backend\uploads"
    set /a DEPLOY_WARNING+=1
)

REM 检查SSL证书（可选）
if exist "C:\nginx\ssl\pt.lan.crt" (
    echo ✓ SSL证书存在
    set /a DEPLOY_SUCCESS+=1
) else (
    echo ⚠ SSL证书不存在（将使用HTTP模式）
    set /a DEPLOY_WARNING+=1
)

REM 启动Nginx服务
if !DEPLOY_ERROR! equ 0 (
    echo 正在启动Nginx服务...
    cd /d "%~dp0nginx"
    call manage-nginx.bat start
    cd /d "%~dp0"
    
    REM 验证Nginx启动状态
    timeout /t 2 >nul
    tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I /N "nginx.exe">NUL
    if "!ERRORLEVEL!"=="0" (
        echo ✓ Nginx服务启动成功
    ) else (
        echo ✗ Nginx服务启动失败
        set /a DEPLOY_ERROR+=1
    )
) else (
    :skip_nginx_start
    echo ✗ 由于检查失败，跳过Nginx服务启动
    echo.
    echo === 故障排除建议 ===
    echo 1. 检查配置文件：C:\nginx\conf\nginx.conf
    echo 2. 检查站点配置：C:\nginx\conf\pt-site.conf
    echo 3. 手动测试配置：cd C:\nginx ^&^& nginx.exe -t
    echo 4. 查看错误日志：C:\nginx\logs\error.log
    echo 5. 运行配置管理：nginx\manage-nginx.bat test
    echo === 建议结束 ===
)

echo.
echo =====================================
echo PT站系统启动完成！
echo =====================================
echo.
echo 当前配置的IP地址：!LOCAL_IP!
echo.

REM 上传IP地址到远程服务
echo 正在上传IP地址到远程服务...
node IP-management/upload-ip.js
if !errorlevel! equ 0 (
    echo ✓ IP地址上传成功
) else (
    echo ⚠ IP地址上传失败，请检查配置
)
echo.

echo 部署检查结果：
if !DEPLOY_ERROR! equ 0 (
    if !DEPLOY_WARNING! equ 0 (
        echo ✅ 所有检查通过 - 系统已准备就绪
    ) else (
        echo ⚠️ 基本通过但有 !DEPLOY_WARNING! 个警告项
    )
) else (
    echo ❌ 发现 !DEPLOY_ERROR! 个严重问题需要解决
)
echo.
echo 服务访问地址：
echo   后端API：    http://!LOCAL_IP!:3001
echo   前端界面：   http://!LOCAL_IP!:3000
if exist "C:\nginx\ssl\pt.lan.crt" (
    echo   HTTPS入口：  https://!LOCAL_IP!/ (推荐)
    echo   HTTPS入口：  https://!HOSTNAME_LOCAL!/ (主机名域名)
    echo   HTTP入口：   http://!LOCAL_IP!/ (自动重定向到HTTPS)
    echo   HTTP入口：   http://!HOSTNAME_LOCAL!/ (自动重定向到HTTPS)
) else (
    echo   HTTP入口：   http://!LOCAL_IP!/
    echo   HTTP入口：   http://!HOSTNAME_LOCAL!/
)
echo.
echo Tracker服务：
echo   Announce：   http://!LOCAL_IP!:3001/announce
echo.
echo 注意事项：
if exist "C:\nginx\ssl\pt.lan.crt" (
    echo - 首次HTTPS访问需要接受自签名证书警告
) else (
    echo - 如需HTTPS访问，请先生成SSL证书
)
echo - 确保防火墙已开放相应端口（3000, 3001, 80, 443）
echo - 如果IP地址变化，请重新运行此脚本
if !DEPLOY_WARNING! gtr 0 (
    echo - 建议解决警告项以获得更好的性能
)
if !DEPLOY_ERROR! gtr 0 (
    echo - ⚠️ 请解决检查发现的错误项
)
echo.
echo 日志位置：
echo - 后端日志：backend目录的终端窗口
echo - 前端日志：frontend目录的终端窗口  
echo - Nginx日志：C:\nginx\logs\
echo - Nginx管理：nginx\manage-nginx.bat
echo.

REM 检查服务状态
echo 正在检查服务状态...
timeout /t 3 >NUL

echo.
echo 最终服务状态检查：
REM 检查端口占用情况
netstat -an | findstr ":3000 " >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    echo ✓ 前端服务 (端口3000) - 运行中
) else (
    echo ✗ 前端服务 (端口3000) - 未启动
)

netstat -an | findstr ":3001 " >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    echo ✓ 后端服务 (端口3001) - 运行中
    
    REM 测试后端API连通性
    powershell -Command "try { Invoke-RestMethod -Uri 'http://localhost:3001/health' -TimeoutSec 3 | Out-Null; Write-Host '✓ 后端API连通性正常' } catch { Write-Host '⚠ 后端API连通性异常' }" 2>nul
) else (
    echo ✗ 后端服务 (端口3001) - 未启动
)

tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I /N "nginx.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ Nginx服务 - 运行中
    
    REM 检查HTTP端口
    netstat -an | findstr ":80 " >NUL 2>&1
    if "%ERRORLEVEL%"=="0" (
        echo ✓ HTTP端口(80) - 监听中
    ) else (
        echo ⚠ HTTP端口(80) - 未监听
    )
) else (
    echo ✗ Nginx服务 - 未启动
)

echo.
echo 按任意键退出启动脚本...
pause >NUL

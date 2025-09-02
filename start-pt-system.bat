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
copy "backend\.env" "backup\.env.backup.%date:~0,4%%date:~5,2%%date:~8,2%" >NUL
copy "nginx\nginx.conf" "backup\nginx.conf.backup.%date:~0,4%%date:~5,2%%date:~8,2%" >NUL
copy "nginx\pt-site.conf" "backup\pt-site.conf.backup.%date:~0,4%%date:~5,2%%date:~8,2%" >NUL

REM 更新backend\.env文件中的IP地址
echo 正在更新后端配置...
powershell -Command "(Get-Content 'backend\.env') -replace 'ANNOUNCE_URL=http://[0-9.]+:3001', 'ANNOUNCE_URL=http://!LOCAL_IP!:3001' -replace 'FRONTEND_URL=http://[0-9.]+:3000', 'FRONTEND_URL=http://!LOCAL_IP!:3000' | Set-Content 'backend\.env'"

REM 更新nginx.conf中的IP地址
echo 正在更新Nginx主配置...
powershell -Command "(Get-Content 'nginx\nginx.conf') -replace 'server_name [0-9.]+;', 'server_name !LOCAL_IP!;' -replace 'https://[0-9.]+', 'https://!LOCAL_IP!' | Set-Content 'nginx\nginx.conf'"

REM 更新pt-site.conf中的上传目录路径
echo 正在更新站点配置...
set "CURRENT_DIR=%CD%"
set "UPLOAD_PATH=!CURRENT_DIR!\backend\uploads"
set "UPLOAD_PATH=!UPLOAD_PATH:\=/!"
powershell -Command "(Get-Content 'nginx\pt-site.conf') -replace 'alias C:/Users/[^;]+/uploads/;', 'alias !UPLOAD_PATH!/;' | Set-Content 'nginx\pt-site.conf'"

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

REM 启动Nginx HTTPS服务
echo [3/3] 启动Nginx HTTPS服务...
cd /d "%~dp0nginx"
if exist "C:\nginx\nginx.exe" (
    call start-https-server.bat
) else (
    echo 警告：未找到Nginx安装，跳过HTTPS服务启动
    echo 请手动安装Nginx到C:\nginx目录
)
cd /d "%~dp0"

echo.
echo =====================================
echo PT站系统启动完成！
echo =====================================
echo.
echo 当前配置的IP地址：!LOCAL_IP!
echo.
echo 服务访问地址：
echo   后端API：    http://!LOCAL_IP!:3001
echo   前端界面：   http://!LOCAL_IP!:3000
echo   HTTPS入口：  https://!LOCAL_IP!/ (推荐)
echo   HTTP入口：   http://!LOCAL_IP!/ (自动重定向到HTTPS)
echo.
echo Tracker服务：
echo   Announce：   http://!LOCAL_IP!:3001/announce
echo.
echo 注意事项：
echo - 首次HTTPS访问需要接受自签名证书警告
echo - 确保防火墙已开放相应端口（3000, 3001, 80, 443）
echo - 如果IP地址变化，请重新运行此脚本
echo.
echo 日志位置：
echo - 后端日志：backend目录的终端窗口
echo - 前端日志：frontend目录的终端窗口
echo - Nginx日志：C:\nginx\logs\
echo.

REM 检查服务状态
echo 正在检查服务状态...
timeout /t 3 >NUL

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
) else (
    echo ✗ 后端服务 (端口3001) - 未启动
)

tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I /N "nginx.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ Nginx服务 - 运行中
) else (
    echo ✗ Nginx服务 - 未启动
)

echo.
echo 按任意键退出启动脚本...
pause >NUL

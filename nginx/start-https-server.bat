@echo off
REM PT站 HTTPS启动脚本

echo =====================================
echo PT站 HTTPS模式启动脚本
echo =====================================
echo.

REM 检查SSL证书是否存在
if not exist "C:\nginx\ssl\pt.local.crt" (
    echo 错误：SSL证书不存在！
    echo 请先运行 generate-ssl-cert-advanced.bat 生成SSL证书
    echo.
    pause
    exit /b 1
)

REM 检查nginx是否已安装
if not exist "C:\nginx\nginx.exe" (
    echo 错误：Nginx未安装或路径不正确！
    echo 请确保Nginx安装在 C:\nginx\ 目录下
    echo.
    pause
    exit /b 1
)

REM 停止现有的nginx进程（如果存在）
tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I /N "nginx.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo 正在停止现有的Nginx进程...
    taskkill /F /IM nginx.exe >NUL 2>&1
    timeout /t 2 >NUL
)

REM 复制配置文件到nginx目录
echo 正在更新Nginx配置...
copy /Y "nginx.conf" "C:\nginx\conf\nginx.conf" >NUL
copy /Y "pt-site.conf" "C:\nginx\conf\pt-site.conf" >NUL

REM 启动nginx
echo 正在启动Nginx HTTPS服务...
cd /d "C:\nginx"
start /B nginx.exe

REM 等待服务启动
timeout /t 3 >NUL

REM 检查nginx是否启动成功
tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I /N "nginx.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo.
    echo ✓ Nginx HTTPS服务启动成功！
    echo.
    echo 访问地址：
    echo   HTTPS: https://localhost/
    echo   HTTPS: https://pt.local/  ^(如果配置了hosts文件^)
    echo.
    echo 注意：
    echo - 首次访问会显示证书警告，点击"高级"→"继续访问"
    echo - HTTP请求会自动重定向到HTTPS
    echo - 确保前端^(3000端口^)和后端^(3001端口^)服务正在运行
    echo.
) else (
    echo.
    echo ✗ Nginx启动失败！
    echo.
    echo 请检查：
    echo 1. 配置文件语法是否正确
    echo 2. 端口是否被占用
    echo 3. 查看错误日志：C:\nginx\logs\error.log
    echo.
)

REM 显示nginx进程状态
echo 当前Nginx进程：
tasklist /FI "IMAGENAME eq nginx.exe"

echo.
echo 按任意键退出...
pause >NUL

@echo off
echo ========================================
echo PT站内网访问防火墙配置脚本
echo ========================================
echo.

echo 正在配置Windows防火墙规则...
echo.

echo 1. 添加前端端口3000的防火墙规则...
netsh advfirewall firewall add rule name="PT Site Frontend (Port 3000)" dir=in action=allow protocol=TCP localport=3000 profile=any
if %errorlevel% equ 0 (
    echo ✅ 前端端口3000防火墙规则添加成功
) else (
    echo ❌ 前端端口3000防火墙规则添加失败
)

echo.

echo 2. 添加后端端口3001的防火墙规则...
netsh advfirewall firewall add rule name="PT Site Backend API (Port 3001)" dir=in action=allow protocol=TCP localport=3001 profile=any
if %errorlevel% equ 0 (
    echo ✅ 后端端口3001防火墙规则添加成功
) else (
    echo ❌ 后端端口3001防火墙规则添加失败
)

echo.

echo 3. 验证防火墙规则...
netsh advfirewall firewall show rule name="PT Site Frontend (Port 3000)" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 前端防火墙规则验证成功
) else (
    echo ❌ 前端防火墙规则验证失败
)

netsh advfirewall firewall show rule name="PT Site Backend API (Port 3001)" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 后端防火墙规则验证成功
) else (
    echo ❌ 后端防火墙规则验证失败
)

echo.
echo ========================================
echo 配置完成！
echo ========================================
echo.
echo 现在内网中的其他设备可以访问：
echo 前端应用: http://172.21.101.2:3000
echo 后端API:  http://172.21.101.2:3001
echo.
echo 注意：如果仍然无法访问，请检查：
echo 1. 服务器是否正在运行
echo 2. 网络连接是否正常
echo 3. 杀毒软件是否阻止了连接
echo.
pause

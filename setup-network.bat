@echo off
setlocal enabledelayedexpansion

:: PT站内网访问配置脚本
:: 需要管理员权限运行

echo ===============================================
echo           PT站内网访问配置工具
echo ===============================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] 需要管理员权限！
    echo 请右键选择"以管理员身份运行"
    echo.
    pause
    exit /b 1
)

echo [INFO] 管理员权限验证通过
echo.

:: 1. 配置防火墙规则
echo [STEP 1] 配置防火墙规则...
echo.

:: 删除可能存在的旧规则
netsh advfirewall firewall delete rule name="PT-Site-Frontend" >nul 2>&1
netsh advfirewall firewall delete rule name="PT-Site-Backend" >nul 2>&1
netsh advfirewall firewall delete rule name="Node.js PT-Site" >nul 2>&1

:: 添加端口规则
echo 添加端口 3000 (前端)...
netsh advfirewall firewall add rule name="PT-Site-Frontend" dir=in action=allow protocol=TCP localport=3000
if %errorlevel% equ 0 (
    echo [SUCCESS] 端口 3000 已开放
) else (
    echo [ERROR] 端口 3000 配置失败
)

echo 添加端口 3001 (后端)...
netsh advfirewall firewall add rule name="PT-Site-Backend" dir=in action=allow protocol=TCP localport=3001
if %errorlevel% equ 0 (
    echo [SUCCESS] 端口 3001 已开放
) else (
    echo [ERROR] 端口 3001 配置失败
)

:: 添加Node.js程序规则
echo 查找并允许Node.js程序...
for /f "tokens=*" %%i in ('where node 2^>nul') do (
    echo 允许程序: %%i
    netsh advfirewall firewall add rule name="Node.js PT-Site" dir=in action=allow program="%%i"
    if !errorlevel! equ 0 (
        echo [SUCCESS] Node.js 程序已允许通过防火墙
    ) else (
        echo [WARNING] Node.js 程序配置可能失败
    )
)

echo.

:: 2. 检查网络配置
echo [STEP 2] 检查网络配置...
echo.

:: 获取本机IP地址
echo 检测服务器IP地址:
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4.*192.168\|IPv4.*172.16\|IPv4.*172.17\|IPv4.*172.18\|IPv4.*172.19\|IPv4.*172.20\|IPv4.*172.21\|IPv4.*172.22\|IPv4.*172.23\|IPv4.*172.24\|IPv4.*172.25\|IPv4.*172.26\|IPv4.*172.27\|IPv4.*172.28\|IPv4.*172.29\|IPv4.*172.30\|IPv4.*172.31\|IPv4.*10\."') do (
    set IP=%%i
    set IP=!IP: =!
    echo   内网IP: !IP!
)

if "!IP!"=="" (
    echo [WARNING] 未检测到内网IP地址
    echo 请手动检查网络配置
    ipconfig | findstr "IPv4"
) else (
    echo [SUCCESS] 检测到内网IP: !IP!
)

echo.

:: 3. 检查端口占用
echo [STEP 3] 检查端口占用情况...
echo.

echo 检查端口 3000:
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo [INFO] 端口 3000 正在使用中
    netstat -ano | findstr :3000
) else (
    echo [INFO] 端口 3000 可用
)

echo.
echo 检查端口 3001:
netstat -ano | findstr :3001 >nul
if %errorlevel% equ 0 (
    echo [INFO] 端口 3001 正在使用中
    netstat -ano | findstr :3001
) else (
    echo [INFO] 端口 3001 可用
)

echo.

:: 4. 测试本地连接
echo [STEP 4] 测试本地连接...
echo.

echo 测试本地连接 localhost:3001...
curl -s --connect-timeout 3 http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] 本地API服务正常
) else (
    echo [WARNING] 本地API服务未响应，请确保服务已启动
)

if not "!IP!"=="" (
    echo 测试内网连接 !IP!:3001...
    curl -s --connect-timeout 3 http://!IP!:3001/health >nul 2>&1
    if !errorlevel! equ 0 (
        echo [SUCCESS] 内网API服务正常
    ) else (
        echo [WARNING] 内网API服务未响应
    )
)

echo.

:: 5. 生成测试链接
echo [STEP 5] 生成访问链接...
echo.

if not "!IP!"=="" (
    echo 内网用户请使用以下链接访问:
    echo.
    echo   前端页面: http://!IP!:3000
    echo   API健康检查: http://!IP!:3001/health
    echo   管理后台: http://!IP!:3000/admin
    echo.
    echo 请将这些链接分享给内网其他用户
) else (
    echo 无法确定内网IP，请手动获取IP地址后访问
)

:: 6. 显示防火墙规则
echo [STEP 6] 验证防火墙规则...
echo.

netsh advfirewall firewall show rule name="PT-Site-Frontend" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] 前端防火墙规则已生效
) else (
    echo [ERROR] 前端防火墙规则配置失败
)

netsh advfirewall firewall show rule name="PT-Site-Backend" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] 后端防火墙规则已生效
) else (
    echo [ERROR] 后端防火墙规则配置失败
)

echo.

:: 7. 故障排除提示
echo [STEP 7] 故障排除提示...
echo.

echo 如果内网用户仍无法访问，请检查:
echo.
echo 1. 服务是否正在运行:
echo    cd backend ^&^& npm start
echo    cd frontend ^&^& npm start
echo.
echo 2. 应用是否绑定到 0.0.0.0 而非 localhost
echo.
echo 3. 杀毒软件是否阻止了连接
echo.
echo 4. 路由器是否启用了客户端隔离
echo.
echo 5. 企业网络是否有端口限制策略
echo.

:: 8. 创建快速测试脚本
echo [STEP 8] 创建测试脚本...
echo.

(
    echo @echo off
    echo echo 测试PT站内网访问...
    if not "!IP!"=="" (
        echo echo.
        echo echo 测试前端页面:
        echo start http://!IP!:3000
        echo echo.
        echo echo 测试API健康检查:
        echo curl http://!IP!:3001/health
        echo echo.
        echo echo 测试完成
    ) else (
        echo echo 请先运行 setup-network.bat 获取IP地址
    )
    echo pause
) > test-network-access.bat

echo [SUCCESS] 已创建测试脚本: test-network-access.bat
echo.

echo ===============================================
echo                配置完成！
echo ===============================================
echo.

if not "!IP!"=="" (
    echo 内网访问地址: http://!IP!:3000
    echo.
    echo 请在其他设备的浏览器中输入上述地址进行测试
) else (
    echo 请手动获取IP地址后进行测试
)

echo.
echo 如需重新配置，请再次运行此脚本
echo.

pause

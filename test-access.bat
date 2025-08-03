@echo off
chcp 65001 >nul
echo ========================================
echo PT站内网访问测试
echo ========================================
echo.

echo 检测本机内网IP地址...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr "IPv4"') do (
    for %%j in (%%i) do (
        echo 发现IP: %%j
        if "%%j" geq "172.21.0.0" if "%%j" leq "172.21.255.255" (
            set LOCAL_IP=%%j
            echo ✅ 内网IP: %%j
            goto :found_ip
        )
    )
)

:found_ip
if not defined LOCAL_IP (
    echo ❌ 未找到内网IP地址
    pause
    exit /b 1
)

echo.
echo 测试网络连接...
echo.

echo 1. 测试后端API...
curl -s -I http://%LOCAL_IP%:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 后端API可通过内网访问: http://%LOCAL_IP%:3001
) else (
    echo ❌ 后端API内网访问失败
)

echo.

echo 2. 测试前端应用...
curl -s -I http://%LOCAL_IP%:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 前端应用可通过内网访问: http://%LOCAL_IP%:3000
) else (
    echo ❌ 前端应用内网访问失败
)

echo.
echo ========================================
echo 内网访问地址汇总
echo ========================================
echo.
echo 📱 分享给其他设备的访问链接:
echo    http://%LOCAL_IP%:3000
echo.
echo 🔧 API接口地址:
echo    http://%LOCAL_IP%:3001/api
echo.
echo 💊 健康检查:
echo    http://%LOCAL_IP%:3001/api/health
echo.
echo 注意: 确保其他设备在同一内网 (172.21.x.x)
echo.
pause

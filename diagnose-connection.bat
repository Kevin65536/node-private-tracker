@echo off
setlocal enabledelayedexpansion

echo =====================================
echo     PT站网络连接问题诊断工具
echo =====================================
echo.

set TARGET_IP=172.21.134.69
set TARGET_PORT_FRONTEND=3000
set TARGET_PORT_BACKEND=3001

echo [INFO] 诊断目标: %TARGET_IP%
echo [INFO] 前端端口: %TARGET_PORT_FRONTEND%
echo [INFO] 后端端口: %TARGET_PORT_BACKEND%
echo.

:: 1. 基础连通性测试
echo [STEP 1] 基础网络连通性测试...
echo.

echo 测试 PING 连通性:
ping -n 4 %TARGET_IP% | findstr "TTL="
if %errorlevel% equ 0 (
    echo [SUCCESS] PING 测试成功 - 基础网络连通
) else (
    echo [ERROR] PING 测试失败 - 基础网络不通
    echo 可能原因: 网络断开、IP地址错误、ICMP被阻止
)
echo.

:: 2. 端口连通性测试
echo [STEP 2] 端口连通性测试...
echo.

echo 测试前端端口 %TARGET_PORT_FRONTEND%:
powershell -Command "try { $result = Test-NetConnection -ComputerName %TARGET_IP% -Port %TARGET_PORT_FRONTEND% -InformationLevel Quiet; if($result) { Write-Host '[SUCCESS] 端口 %TARGET_PORT_FRONTEND% 可达' } else { Write-Host '[ERROR] 端口 %TARGET_PORT_FRONTEND% 不可达' } } catch { Write-Host '[ERROR] 端口测试失败' }"

echo 测试后端端口 %TARGET_PORT_BACKEND%:
powershell -Command "try { $result = Test-NetConnection -ComputerName %TARGET_IP% -Port %TARGET_PORT_BACKEND% -InformationLevel Quiet; if($result) { Write-Host '[SUCCESS] 端口 %TARGET_PORT_BACKEND% 可达' } else { Write-Host '[ERROR] 端口 %TARGET_PORT_BACKEND% 不可达' } } catch { Write-Host '[ERROR] 端口测试失败' }"
echo.

:: 3. HTTP服务测试
echo [STEP 3] HTTP服务测试...
echo.

echo 测试前端HTTP服务:
curl -s --connect-timeout 5 http://%TARGET_IP%:%TARGET_PORT_FRONTEND% >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] 前端HTTP服务响应正常
) else (
    echo [ERROR] 前端HTTP服务无响应
)

echo 测试后端API服务:
curl -s --connect-timeout 5 http://%TARGET_IP%:%TARGET_PORT_BACKEND%/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] 后端API服务响应正常
) else (
    echo [ERROR] 后端API服务无响应
)
echo.

:: 4. 本机网络配置检查
echo [STEP 4] 本机网络配置检查...
echo.

echo 本机IP配置:
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4.*192.168\|IPv4.*172.16\|IPv4.*172.17\|IPv4.*172.18\|IPv4.*172.19\|IPv4.*172.20\|IPv4.*172.21\|IPv4.*172.22\|IPv4.*172.23\|IPv4.*172.24\|IPv4.*172.25\|IPv4.*172.26\|IPv4.*172.27\|IPv4.*172.28\|IPv4.*172.29\|IPv4.*172.30\|IPv4.*172.31\|IPv4.*10\."') do (
    set LOCAL_IP=%%i
    set LOCAL_IP=!LOCAL_IP: =!
    echo   本机内网IP: !LOCAL_IP!
)

echo.
echo 检查是否在同一网段:
if "!LOCAL_IP!"=="" (
    echo [WARNING] 未检测到本机内网IP
) else (
    for /f "tokens=1,2,3 delims=." %%a in ("!LOCAL_IP!") do set LOCAL_SEGMENT=%%a.%%b.%%c
    for /f "tokens=1,2,3 delims=." %%a in ("%TARGET_IP%") do set TARGET_SEGMENT=%%a.%%b.%%c
    
    if "!LOCAL_SEGMENT!"=="!TARGET_SEGMENT!" (
        echo [SUCCESS] 本机与目标在同一网段: !LOCAL_SEGMENT!.x
    ) else (
        echo [WARNING] 本机(!LOCAL_SEGMENT!.x) 与目标(!TARGET_SEGMENT!.x) 不在同一网段
    )
)
echo.

:: 5. 防火墙和代理检查
echo [STEP 5] 本机网络限制检查...
echo.

echo 检查Windows防火墙状态:
netsh advfirewall show allprofiles state | findstr "State"

echo.
echo 检查代理设置:
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable 2>nul | findstr "0x1"
if %errorlevel% equ 0 (
    echo [WARNING] 检测到代理已启用，可能影响访问
    reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer 2>nul
) else (
    echo [INFO] 未启用系统代理
)
echo.

:: 6. 路由检查
echo [STEP 6] 网络路由检查...
echo.

echo 检查到目标的路由:
route print | findstr %TARGET_IP% >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] 找到特定路由:
    route print | findstr %TARGET_IP%
) else (
    echo [INFO] 使用默认路由
    route print | findstr "0.0.0.0.*0.0.0.0" | head -1
)
echo.

:: 7. DNS解析测试
echo [STEP 7] DNS和网络服务测试...
echo.

echo 测试DNS解析:
nslookup %TARGET_IP% >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] DNS解析正常
) else (
    echo [INFO] 直接使用IP地址，无需DNS解析
)

:: 8. 网络服务可用性测试
echo 测试网络服务可用性:
powershell -Command "try { Invoke-WebRequest -Uri 'http://www.baidu.com' -TimeoutSec 5 -UseBasicParsing | Out-Null; Write-Host '[SUCCESS] 外网访问正常' } catch { Write-Host '[WARNING] 外网访问异常，可能影响诊断' }"
echo.

:: 9. 生成详细的浏览器测试建议
echo [STEP 8] 浏览器调试建议...
echo.

echo 请在浏览器中执行以下操作:
echo.
echo 1. 按 F12 打开开发者工具
echo 2. 切换到 Network(网络) 标签页
echo 3. 勾选 "Preserve log"(保留日志)
echo 4. 访问: http://%TARGET_IP%:%TARGET_PORT_FRONTEND%
echo 5. 观察以下信息:
echo.
echo    如果显示 "ERR_CONNECTION_TIMED_OUT":
echo    - 可能是防火墙阻止
echo    - 可能是网络路由问题
echo    - 可能是服务未启动
echo.
echo    如果显示 "ERR_CONNECTION_REFUSED":
echo    - 目标端口未监听
echo    - 服务已停止
echo.
echo    如果显示 "ERR_NETWORK_CHANGED":
echo    - 网络配置发生变化
echo    - 可能需要刷新网络连接
echo.

:: 10. 总结和建议
echo [总结] 诊断结果和建议...
echo.

echo 基于上述测试结果，请检查:
echo.
echo 1. 如果PING失败:
echo    - 检查网络连接
echo    - 确认IP地址正确
echo    - 检查网络设备(路由器/交换机)
echo.
echo 2. 如果PING成功但端口不通:
echo    - 目标主机防火墙可能阻止端口
echo    - 服务可能未启动
echo    - 端口可能被其他程序占用
echo.
echo 3. 如果端口通但HTTP失败:
echo    - Web服务配置问题
echo    - 本机浏览器/代理设置问题
echo    - 应用程序绑定地址问题
echo.
echo 4. 立即尝试的解决方案:
echo    - 暂时关闭本机防火墙测试
echo    - 尝试使用其他浏览器
echo    - 检查浏览器代理设置
echo    - 在目标主机上确认服务状态
echo.

echo =====================================
echo           诊断完成
echo =====================================
echo.
echo 如需更详细的诊断，请:
echo 1. 截图浏览器 F12 Network 面板的错误
echo 2. 运行: curl -v http://%TARGET_IP%:%TARGET_PORT_FRONTEND%
echo 3. 在目标主机上运行: netstat -an ^| findstr :%TARGET_PORT_FRONTEND%
echo.

pause

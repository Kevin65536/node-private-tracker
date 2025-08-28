@echo off
setlocal enabledelayedexpansion

:: PT站 Nginx 部署检查脚本
:: 验证Nginx配置是否正确工作

echo ====================================
echo PT站 Nginx 部署检查
echo ====================================

set "SUCCESS=0"
set "WARNING=0"
set "ERROR=0"

echo [INFO] 开始系统检查...
echo.

:: 1. 检查Nginx安装
echo [1/10] 检查Nginx安装...
if exist "C:\nginx\nginx.exe" (
    echo ✅ Nginx已安装
    set /a SUCCESS+=1
) else (
    echo ❌ Nginx未安装
    set /a ERROR+=1
)

:: 2. 检查配置文件
echo [2/10] 检查配置文件...
if exist "C:\nginx\conf\pt-site.conf" (
    echo ✅ PT站配置文件存在
    set /a SUCCESS+=1
) else (
    echo ❌ PT站配置文件不存在
    set /a ERROR+=1
)

:: 3. 测试配置语法
echo [3/10] 检查配置语法...
if exist "C:\nginx\nginx.exe" (
    "C:\nginx\nginx.exe" -t >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ 配置语法正确
        set /a SUCCESS+=1
    ) else (
        echo ❌ 配置语法错误
        set /a ERROR+=1
    )
) else (
    echo ⏭ 跳过（Nginx未安装）
)

:: 4. 检查端口占用
echo [4/10] 检查端口占用...
netstat -an | find ":80 " | find "LISTENING" >nul
if !errorlevel! equ 0 (
    echo ⚠️ 端口80已被占用（可能是Nginx或其他服务）
    set /a WARNING+=1
) else (
    echo ✅ 端口80可用
    set /a SUCCESS+=1
)

:: 5. 检查防火墙规则
echo [5/10] 检查防火墙规则...
netsh advfirewall firewall show rule name="Nginx-HTTP" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ HTTP防火墙规则已配置
    set /a SUCCESS+=1
) else (
    echo ⚠️ HTTP防火墙规则未配置
    set /a WARNING+=1
)

:: 6. 检查后端服务
echo [6/10] 检查后端服务...
netstat -an | find ":3001 " | find "LISTENING" >nul
if !errorlevel! equ 0 (
    echo ✅ 后端服务正在运行 (3001)
    set /a SUCCESS+=1
) else (
    echo ❌ 后端服务未运行 (3001)
    set /a ERROR+=1
)

:: 7. 检查前端构建
echo [7/10] 检查前端构建...
if exist "%~dp0..\frontend\build\index.html" (
    echo ✅ 前端已构建
    set /a SUCCESS+=1
) else (
    echo ⚠️ 前端未构建（开发模式需要3000端口运行）
    set /a WARNING+=1
)

:: 8. 检查上传目录
echo [8/10] 检查上传目录...
if exist "%~dp0..\backend\uploads" (
    echo ✅ 上传目录存在
    set /a SUCCESS+=1
) else (
    echo ❌ 上传目录不存在
    set /a ERROR+=1
)

:: 9. 检查日志目录
echo [9/10] 检查日志目录...
if exist "C:\nginx\logs" (
    echo ✅ Nginx日志目录存在
    set /a SUCCESS+=1
) else (
    echo ⚠️ Nginx日志目录不存在
    set /a WARNING+=1
)

:: 10. 网络连通性测试
echo [10/10] 网络连通性测试...
:: 尝试连接后端健康检查端点
curl -s http://localhost:3001/health >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 后端API连通性正常
    set /a SUCCESS+=1
) else (
    :: 尝试使用PowerShell
    powershell -Command "try { Invoke-RestMethod -Uri 'http://localhost:3001/health' -TimeoutSec 5 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ 后端API连通性正常
        set /a SUCCESS+=1
    ) else (
        echo ❌ 后端API连通性失败
        set /a ERROR+=1
    )
)

:: 输出检查结果
echo.
echo ====================================
echo 检查结果汇总
echo ====================================
echo ✅ 成功: !SUCCESS!/10
echo ⚠️ 警告: !WARNING!/10
echo ❌ 错误: !ERROR!/10
echo.

if !ERROR! equ 0 (
    if !WARNING! equ 0 (
        echo 🎉 所有检查都通过了！系统已准备就绪。
        echo.
        echo [启动建议]
        echo 1. 启动后端服务: cd backend ^&^& npm start
        echo 2. 启动前端服务: cd frontend ^&^& npm start  # 开发模式
        echo    或构建前端: cd frontend ^&^& npm run build  # 生产模式
        echo 3. 启动Nginx: nginx\manage-nginx.bat start
        echo 4. 访问网站: http://localhost
    ) else (
        echo ⚠️ 检查基本通过，但有一些警告需要注意。
        echo 系统可以运行，但建议解决警告项以获得更好的性能和安全性。
    )
) else (
    echo ❌ 检查发现严重问题，请解决错误项后重新检查。
    echo.
    echo [常见问题解决]
    echo - Nginx未安装: 运行 nginx\setup-nginx.bat
    echo - 后端未运行: cd backend ^&^& npm start
    echo - 配置错误: 检查 nginx\pt-site.conf 文件
    echo - 端口冲突: 停止占用端口80的其他服务
)

echo.
echo [详细信息]
echo 配置文件: %~dp0pt-site.conf
echo 管理脚本: %~dp0manage-nginx.bat
echo 日志查看: manage-nginx.bat logs
echo.

:: 提供快速操作选项
if !ERROR! equ 0 (
    echo 要立即启动Nginx吗？ (y/n)
    set /p "choice="
    if /i "!choice!"=="y" (
        echo [INFO] 启动Nginx...
        call "%~dp0manage-nginx.bat" start
    )
)

pause

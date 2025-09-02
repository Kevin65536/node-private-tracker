@echo off
REM PT站系统停止脚本

echo =====================================
echo PT站系统停止脚本
echo =====================================
echo.

echo 正在停止所有PT站相关服务...
echo.

REM 停止Nginx服务
echo [1/3] 停止Nginx服务...
tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I /N "nginx.exe">NUL
if "%ERRORLEVEL%"=="0" (
    taskkill /F /IM nginx.exe >NUL 2>&1
    echo ✓ Nginx服务已停止
) else (
    echo - Nginx服务未运行
)

REM 停止Node.js进程（需要用户确认，因为可能有其他Node项目）
echo.
echo [2/3] 检查Node.js进程...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo 发现运行中的Node.js进程：
    tasklist /FI "IMAGENAME eq node.exe"
    echo.
    echo 这些进程可能包括PT站的前后端服务，也可能包括其他Node.js应用
    set /p "choice=是否停止所有Node.js进程？[Y/N]: "
    if /i "!choice!"=="Y" (
        taskkill /F /IM node.exe >NUL 2>&1
        echo ✓ 所有Node.js进程已停止
    ) else (
        echo - 已跳过Node.js进程停止
        echo   请手动关闭PT站前后端服务的终端窗口
    )
) else (
    echo - 未发现运行中的Node.js进程
)

REM 检查并关闭可能的终端窗口
echo.
echo [3/3] 清理终端窗口...
echo 如果看到标题为"PT后端服务"或"PT前端服务"的命令行窗口，请手动关闭它们

echo.
echo =====================================
echo 服务停止完成
echo =====================================
echo.

REM 最终状态检查
echo 最终状态检查：
netstat -an | findstr ":3000 " >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    echo ⚠ 端口3000仍在使用中
) else (
    echo ✓ 端口3000已释放
)

netstat -an | findstr ":3001 " >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    echo ⚠ 端口3001仍在使用中
) else (
    echo ✓ 端口3001已释放
)

netstat -an | findstr ":80 " >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    echo ⚠ 端口80仍在使用中
) else (
    echo ✓ 端口80已释放
)

netstat -an | findstr ":443 " >NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    echo ⚠ 端口443仍在使用中
) else (
    echo ✓ 端口443已释放
)

echo.
echo 如果某些端口仍在使用中，可能需要：
echo 1. 手动关闭相关的终端窗口
echo 2. 重启计算机（如果有进程卡死）
echo 3. 检查是否有其他应用占用这些端口

echo.
echo 按任意键退出...
pause >NUL

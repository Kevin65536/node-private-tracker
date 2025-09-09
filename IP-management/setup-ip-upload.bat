@echo off
setlocal enabledelayedexpansion

REM IP地址上传配置向导
echo =====================================
echo PT站IP地址上传配置向导
echo =====================================
echo.
echo 此向导将帮助您配置IP地址自动上传功能
echo 支持以下上传方式：
echo   1. GitHub Gist (推荐)
echo   2. Gitee Pages
echo   3. 自定义Webhook
echo   4. 本地文件 (仅用于测试)
echo.

REM 检查配置文件
set "CONFIG_FILE=%~dp0ip-config.json"
if not exist "%CONFIG_FILE%" (
    echo 错误：找不到配置文件 ip-config.json
    echo 请确保文件存在并重新运行此向导
    pause
    exit /b 1
)

echo 请选择上传方式：
echo 1. GitHub Gist (推荐)
echo 2. Gitee Pages  
echo 3. 自定义Webhook
echo 4. 本地文件 (测试用)
echo.
set /p "method=请输入选项 (1-4): "

if "%method%"=="1" goto setup_gist
if "%method%"=="2" goto setup_gitee
if "%method%"=="3" goto setup_webhook
if "%method%"=="4" goto setup_file
echo 无效选项，请重新运行向导
pause
exit /b 1

:setup_gist
echo.
echo =====================================
echo GitHub Gist 配置
echo =====================================
echo.
echo 请按照以下步骤配置GitHub Gist：
echo.
echo 1. 访问 https://github.com/settings/tokens
echo 2. 点击 "Generate new token" -> "Generate new token (classic)"
echo 3. 设置 Token 名称（如：PT-Server-IP-Updater）
echo 4. 选择 "gist" 权限
echo 5. 点击 "Generate token" 并复制生成的token
echo.
set /p "github_token=请输入GitHub Token: "

if "%github_token%"=="" (
    echo 错误：Token不能为空
    pause
    exit /b 1
)

echo.
echo 6. 访问 https://gist.github.com/
echo 7. 创建一个新的Gist
echo 8. 文件名设为：pt-server-ip.json
echo 9. 内容可以先写：{"placeholder": true}
echo 10. 点击 "Create public gist" 或 "Create secret gist"
echo 11. 复制浏览器地址栏中的Gist ID（最后一段字符串）
echo.
echo 示例：https://gist.github.com/username/abc123def456
echo Gist ID 就是：abc123def456
echo.
set /p "gist_id=请输入Gist ID: "

if "%gist_id%"=="" (
    echo 错误：Gist ID不能为空
    pause
    exit /b 1
)

set /p "username=请输入您的GitHub用户名: "

if "%username%"=="" (
    echo 错误：用户名不能为空
    pause
    exit /b 1
)

echo.
echo 正在更新配置文件...

REM 更新配置文件
powershell -Command "try { $config = Get-Content '%CONFIG_FILE%' | ConvertFrom-Json; $config.upload.method = 'gist'; $config.upload.config.gist.token = '%github_token%'; $config.upload.config.gist.gistId = '%gist_id%'; $config.client.ipSourceUrl = 'https://gist.githubusercontent.com/%username%/%gist_id%/raw/pt-server-ip.json'; $config | ConvertTo-Json -Depth 10 | Set-Content '%CONFIG_FILE%'; Write-Output 'SUCCESS' } catch { Write-Output 'FAILED' }" > temp_result.txt

for /f %%i in (temp_result.txt) do set "result=%%i"
del temp_result.txt

if "%result%"=="SUCCESS" (
    echo ✓ GitHub Gist 配置完成！
    echo.
    echo 配置信息：
    echo   上传方式: GitHub Gist
    echo   Gist ID: %gist_id%
    echo   客户端访问地址: https://gist.githubusercontent.com/%username%/%gist_id%/raw/pt-server-ip.json
) else (
    echo ✗ 配置更新失败
    pause
    exit /b 1
)

goto test_config

:setup_gitee
echo.
echo =====================================
echo Gitee Pages 配置
echo =====================================
echo.
echo 请按照以下步骤配置Gitee Pages：
echo.
echo 1. 访问 https://gitee.com/profile/personal_access_tokens
echo 2. 点击 "生成新令牌"
echo 3. 设置令牌描述（如：PT-Server-IP-Updater）
echo 4. 选择 "projects" 权限
echo 5. 点击 "提交" 并复制生成的token
echo.
set /p "gitee_token=请输入Gitee Token: "

set /p "gitee_username=请输入您的Gitee用户名: "
set /p "gitee_repo=请输入仓库名（如：pt-server-config）: "

echo.
echo 注意：请确保您已经：
echo 1. 创建了仓库 %gitee_repo%
echo 2. 启用了 Gitee Pages 服务
echo.

powershell -Command "try { $config = Get-Content '%CONFIG_FILE%' | ConvertFrom-Json; $config.upload.method = 'gitee'; $config.upload.config.gitee.token = '%gitee_token%'; $config.upload.config.gitee.owner = '%gitee_username%'; $config.upload.config.gitee.repo = '%gitee_repo%'; $config.client.ipSourceUrl = 'https://%gitee_username%.gitee.io/%gitee_repo%/ip.json'; $config | ConvertTo-Json -Depth 10 | Set-Content '%CONFIG_FILE%'; Write-Output 'SUCCESS' } catch { Write-Output 'FAILED' }" > temp_result.txt

for /f %%i in (temp_result.txt) do set "result=%%i"
del temp_result.txt

if "%result%"=="SUCCESS" (
    echo ✓ Gitee Pages 配置完成！
) else (
    echo ✗ 配置更新失败
    pause
    exit /b 1
)

goto test_config

:setup_webhook
echo.
echo =====================================
echo 自定义Webhook 配置
echo =====================================
echo.
set /p "webhook_url=请输入Webhook URL: "

if "%webhook_url%"=="" (
    echo 错误：Webhook URL不能为空
    pause
    exit /b 1
)

set /p "auth_token=请输入认证Token (可选，直接回车跳过): "

powershell -Command "try { $config = Get-Content '%CONFIG_FILE%' | ConvertFrom-Json; $config.upload.method = 'webhook'; $config.upload.config.webhook.url = '%webhook_url%'; if ('%auth_token%' -ne '') { $config.upload.config.webhook.headers.Authorization = 'Bearer %auth_token%' }; $config | ConvertTo-Json -Depth 10 | Set-Content '%CONFIG_FILE%'; Write-Output 'SUCCESS' } catch { Write-Output 'FAILED' }" > temp_result.txt

for /f %%i in (temp_result.txt) do set "result=%%i"
del temp_result.txt

if "%result%"=="SUCCESS" (
    echo ✓ Webhook 配置完成！
    echo.
    echo 注意：您需要手动设置客户端访问地址
    echo 编辑 ip-config.json 中的 client.ipSourceUrl 字段
) else (
    echo ✗ 配置更新失败
    pause
    exit /b 1
)

goto test_config

:setup_file
echo.
echo =====================================
echo 本地文件配置
echo =====================================
echo.
echo 设置为本地文件模式（仅用于测试）

powershell -Command "try { $config = Get-Content '%CONFIG_FILE%' | ConvertFrom-Json; $config.upload.method = 'file'; $config | ConvertTo-Json -Depth 10 | Set-Content '%CONFIG_FILE%'; Write-Output 'SUCCESS' } catch { Write-Output 'FAILED' }" > temp_result.txt

for /f %%i in (temp_result.txt) do set "result=%%i"
del temp_result.txt

if "%result%"=="SUCCESS" (
    echo ✓ 本地文件配置完成！
    echo IP信息将保存到 server-ip.json 文件
) else (
    echo ✗ 配置更新失败
    pause
    exit /b 1
)

goto test_config

:test_config
echo.
echo =====================================
echo 配置测试
echo =====================================
echo.
echo 正在测试IP上传功能...

node upload-ip.js > test_result.txt 2>&1
set "test_exit_code=%errorlevel%"

type test_result.txt
del test_result.txt

echo.
if "%test_exit_code%"=="0" (
    echo ✅ 配置测试成功！
    echo.
    echo 配置完成！现在您可以：
    echo 1. 运行 start-pt-system.bat 启动服务器（会自动上传IP）
    echo 2. 将 client-launcher.bat 分发给用户
    echo 3. 用户运行 client-launcher.bat 即可自动连接到最新地址
    echo.
    echo 注意：
    echo - 确保将更新后的 ip-config.json 与 client-launcher.bat 一起分发
    echo - 客户端启动器需要以管理员权限运行才能更新hosts文件
) else (
    echo ❌ 配置测试失败！
    echo 请检查配置信息是否正确，或查看上面的错误信息
)

echo.
echo 按任意键退出向导...
pause >nul

@echo off
setlocal enabledelayedexpansion
REM PT站 高级SSL证书生成脚本
REM 支持多域名的自签名证书 - 自动检测当前IP

echo 正在为PT站生成多域名SSL证书...

REM 获取本机主机名
for /f "tokens=*" %%i in ('hostname') do set HOSTNAME=%%i
set HOSTNAME_LOCAL=!HOSTNAME!.local
echo ✓ 检测到主机名：!HOSTNAME!
echo ✓ 将支持域名：!HOSTNAME_LOCAL!

REM 获取本机IP地址
echo 正在检测本机IP地址...
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
    echo 警告：无法自动检测IP地址，使用默认IP 192.168.1.100
    set LOCAL_IP=192.168.1.100
) else (
    echo ✓ 检测到本机IP地址：!LOCAL_IP!
)

REM 创建SSL目录
if not exist "C:\nginx\ssl" mkdir "C:\nginx\ssl"
cd /d "C:\nginx\ssl"

REM 备份现有证书（如果存在）
if exist pt.lan.crt (
    echo 发现现有证书，正在备份...
    copy pt.lan.crt pt.lan.crt.backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    copy pt.lan.key pt.lan.key.backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    echo 备份完成！
)

REM 创建OpenSSL配置文件
echo [req] > pt.conf
echo distinguished_name = req_distinguished_name >> pt.conf
echo req_extensions = v3_req >> pt.conf
echo prompt = no >> pt.conf
echo. >> pt.conf
echo [req_distinguished_name] >> pt.conf
echo C = CN >> pt.conf
echo ST = Gansu >> pt.conf
echo L = Lanzhou >> pt.conf
echo O = LZU PT Site >> pt.conf
echo OU = IT Department >> pt.conf
echo CN = pt.lan >> pt.conf
echo emailAddress = admin@pt.lan >> pt.conf
echo. >> pt.conf
echo [v3_req] >> pt.conf
echo basicConstraints = CA:FALSE >> pt.conf
echo keyUsage = nonRepudiation, digitalSignature, keyEncipherment >> pt.conf
echo subjectAltName = @alt_names >> pt.conf
echo. >> pt.conf
echo [alt_names] >> pt.conf
echo DNS.1 = pt.lan >> pt.conf
echo DNS.2 = localhost >> pt.conf
echo DNS.3 = *.local >> pt.conf
echo DNS.4 = !HOSTNAME_LOCAL! >> pt.conf
echo DNS.5 = !HOSTNAME! >> pt.conf
echo IP.1 = 127.0.0.1 >> pt.conf
echo IP.2 = ::1 >> pt.conf
echo IP.3 = !LOCAL_IP! >> pt.conf

REM 生成私钥（2048位RSA）
openssl genpkey -algorithm RSA -out pt.lan.key -aes256 -pass pass:pt123456

REM 生成证书签名请求
openssl req -new -key pt.lan.key -out pt.lan.csr -config pt.conf -passin pass:pt123456

REM 生成自签名证书（有效期2年）
openssl x509 -req -in pt.lan.csr -signkey pt.lan.key -out pt.lan.crt -days 730 -extensions v3_req -extfile pt.conf -passin pass:pt123456

REM 去除私钥密码
openssl rsa -in pt.lan.key -out pt.lan.key -passin pass:pt123456

REM 创建无密码的证书副本（用于某些客户端）
copy pt.lan.crt pt.lan.pem

REM 清理临时文件
del pt.lan.csr
del pt.conf

echo.
echo =====================================
echo SSL证书生成成功！
echo =====================================
echo.
echo 证书文件：
echo   私钥文件：C:\nginx\ssl\pt.lan.key
echo   证书文件：C:\nginx\ssl\pt.lan.crt
echo   PEM格式：C:\nginx\ssl\pt.lan.pem
echo.
echo 支持的域名和IP：
echo   - pt.lan
echo   - localhost  
echo   - *.local
echo   - !HOSTNAME_LOCAL! (主机名域名)
echo   - !HOSTNAME! (主机名)
echo   - 127.0.0.1
echo   - ::1
echo   - !LOCAL_IP! (自动检测)
echo.
echo 证书信息：
echo   有效期：2年
echo   算法：RSA-2048
echo   自签名证书
echo.
echo 使用说明：
echo 1. nginx配置中的证书路径已正确设置
echo 2. 首次访问时浏览器会显示安全警告
echo 3. 点击"高级"→"继续访问"即可
echo 4. 或将证书添加到系统信任列表中
echo.

REM 显示证书详细信息
echo 证书详细信息：
openssl x509 -in pt.lan.crt -text -noout | findstr "Subject:\|Not Before:\|Not After:\|DNS:\|IP:"

echo.
echo 证书生成完成！现在可以使用HTTPS访问PT站了。
echo.
echo 重要提示：
echo 1. 请重启Nginx服务以加载新证书
echo 2. 现在支持通过以下方式访问：
echo    - https://pt.lan (需要在hosts文件中配置)
echo    - https://!LOCAL_IP! (直接IP访问)
echo    - https://localhost (本地访问)
echo 3. 如果仍有SSL错误，请清除浏览器缓存
echo.
echo 要重启Nginx，请运行：
echo   cd C:\nginx
echo   nginx.exe -s reload
echo.
pause

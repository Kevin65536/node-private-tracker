@echo off
REM PT站 高级SSL证书生成脚本
REM 支持多域名的自签名证书

echo 正在为PT站生成多域名SSL证书...

REM 创建SSL目录
if not exist "C:\nginx\ssl" mkdir "C:\nginx\ssl"
cd /d "C:\nginx\ssl"

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
echo CN = pt.local >> pt.conf
echo emailAddress = admin@pt.local >> pt.conf
echo. >> pt.conf
echo [v3_req] >> pt.conf
echo basicConstraints = CA:FALSE >> pt.conf
echo keyUsage = nonRepudiation, digitalSignature, keyEncipherment >> pt.conf
echo subjectAltName = @alt_names >> pt.conf
echo. >> pt.conf
echo [alt_names] >> pt.conf
echo DNS.1 = pt.local >> pt.conf
echo DNS.2 = localhost >> pt.conf
echo DNS.3 = *.local >> pt.conf
echo IP.1 = 127.0.0.1 >> pt.conf
echo IP.2 = ::1 >> pt.conf

REM 生成私钥（2048位RSA）
openssl genpkey -algorithm RSA -out pt.local.key -aes256 -pass pass:pt123456

REM 生成证书签名请求
openssl req -new -key pt.local.key -out pt.local.csr -config pt.conf -passin pass:pt123456

REM 生成自签名证书（有效期2年）
openssl x509 -req -in pt.local.csr -signkey pt.local.key -out pt.local.crt -days 730 -extensions v3_req -extfile pt.conf -passin pass:pt123456

REM 去除私钥密码
openssl rsa -in pt.local.key -out pt.local.key -passin pass:pt123456

REM 创建无密码的证书副本（用于某些客户端）
copy pt.local.crt pt.local.pem

REM 清理临时文件
del pt.local.csr
del pt.conf

echo.
echo =====================================
echo SSL证书生成成功！
echo =====================================
echo.
echo 证书文件：
echo   私钥文件：C:\nginx\ssl\pt.local.key
echo   证书文件：C:\nginx\ssl\pt.local.crt
echo   PEM格式：C:\nginx\ssl\pt.local.pem
echo.
echo 支持的域名和IP：
echo   - pt.local
echo   - localhost  
echo   - *.local
echo   - 127.0.0.1
echo   - ::1
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
openssl x509 -in pt.local.crt -text -noout | findstr "Subject:\|Not Before:\|Not After:\|DNS:\|IP:"

echo.
echo 证书生成完成！现在可以使用HTTPS访问PT站了。
echo.
pause

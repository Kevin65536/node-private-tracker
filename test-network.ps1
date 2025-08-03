# PT站网络测试脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PT站内网访问测试脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 获取本机IP地址
$networkAdapter = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "172.21.*" }
$localIP = if ($networkAdapter) { $networkAdapter.IPAddress } else { $null }

if ($localIP) {
    Write-Host "✅ 检测到本机内网IP: $localIP" -ForegroundColor Green
} else {
    Write-Host "❌ 未检测到内网IP地址" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 测试端口监听状态
Write-Host "1. 检查端口监听状态..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
$port3001 = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "   ✅ 端口3000正在监听" -ForegroundColor Green
} else {
    Write-Host "   ❌ 端口3000未监听" -ForegroundColor Red
}

if ($port3001) {
    Write-Host "   ✅ 端口3001正在监听" -ForegroundColor Green
} else {
    Write-Host "   ❌ 端口3001未监听" -ForegroundColor Red
}

Write-Host ""

# 测试本地访问
Write-Host "2. 测试本地访问..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ 本地API访问正常" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ 本地API访问失败: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ 本地前端访问正常" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ 本地前端访问失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 测试内网IP访问
Write-Host "3. 测试内网IP访问..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://$localIP:3001/api/health" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ 内网API访问正常" -ForegroundColor Green
        $apiData = $response.Content | ConvertFrom-Json
        Write-Host "   📊 API状态: $($apiData.status)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ 内网API访问失败: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://$localIP:3000" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ 内网前端访问正常" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ 内网前端访问失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 网络信息摘要
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "网络访问信息摘要" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "前端应用地址:" -ForegroundColor White
Write-Host "  本地访问: http://localhost:3000" -ForegroundColor Gray
Write-Host "  内网访问: http://$localIP:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "后端API地址:" -ForegroundColor White
Write-Host "  本地访问: http://localhost:3001" -ForegroundColor Gray
Write-Host "  内网访问: http://$localIP:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "健康检查端点:" -ForegroundColor White
Write-Host "  http://$localIP:3001/api/health" -ForegroundColor Yellow
Write-Host ""

# 生成分享链接
Write-Host "分享给其他设备的访问链接:" -ForegroundColor Green
Write-Host "http://$localIP:3000" -ForegroundColor Yellow -BackgroundColor DarkBlue
Write-Host ""

Write-Host "按任意键退出..." -ForegroundColor Gray
Read-Host

require('dotenv').config();
const net = require('net');

async function testNetworkConnectivity() {
    console.log('🌐 网络连通性测试');
    console.log('='.repeat(50));
    
    const peers = [
        { name: 'admin (做种者)', ip: '172.21.222.169', port: 27633 },
        { name: 'testuser1 (下载者)', ip: '172.21.77.185', port: 27052 }
    ];
    
    console.log('\n📍 测试目标:');
    peers.forEach(peer => {
        console.log(`   ${peer.name}: ${peer.ip}:${peer.port}`);
    });
    
    // 测试端口连通性
    console.log('\n🔗 端口连通性测试:');
    
    for (const peer of peers) {
        console.log(`\n测试 ${peer.name} (${peer.ip}:${peer.port})`);
        
        const startTime = Date.now();
        const isReachable = await testTCPConnection(peer.ip, peer.port, 5000);
        const latency = Date.now() - startTime;
        
        if (isReachable) {
            console.log(`   ✅ 连接成功 (延迟: ${latency}ms)`);
        } else {
            console.log(`   ❌ 连接失败 (超时: ${latency}ms)`);
            console.log(`   🔍 可能原因:`);
            console.log(`      - 防火墙阻止端口 ${peer.port}`);
            console.log(`      - qBittorrent未监听此端口`);
            console.log(`      - 网络路由问题`);
        }
    }
    
    // 网络分段分析
    console.log('\n🏠 网络分段分析:');
    const networks = peers.map(p => {
        const parts = p.ip.split('.');
        return {
            ip: p.ip,
            network: parts.slice(0, 3).join('.') + '.0/24',
            name: p.name
        };
    });
    
    networks.forEach(net => {
        console.log(`   ${net.name}: ${net.ip} (网段: ${net.network})`);
    });
    
    const uniqueNetworks = [...new Set(networks.map(n => n.network))];
    if (uniqueNetworks.length > 1) {
        console.log(`   🌐 跨网段通信: ${uniqueNetworks.length}个不同网段`);
        console.log(`   📡 需要路由器正确配置转发规则`);
    } else {
        console.log(`   🏠 同网段通信: 直连通信`);
    }
    
    // P2P连接建议
    console.log('\n💡 P2P连接优化建议:');
    console.log('   1. 确保两台设备的qBittorrent都已正确配置端口');
    console.log('   2. 检查Windows防火墙是否允许qBittorrent通信');
    console.log('   3. 确认路由器没有阻止P2P流量');
    console.log('   4. 尝试在qBittorrent中手动添加peer');
    console.log('   5. 检查qBittorrent的连接限制设置');
}

function testTCPConnection(host, port, timeout = 5000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        
        socket.setTimeout(timeout);
        
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', () => {
            resolve(false);
        });
        
        socket.connect(port, host);
    });
}

testNetworkConnectivity().then(() => {
    process.exit(0);
}).catch(console.error);

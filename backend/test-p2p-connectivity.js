require('dotenv').config();
const { Peer, User, Torrent, InfoHashVariant, AnnounceLog } = require('./models');
const net = require('net');

async function testP2PConnectivity() {
    console.log('🔍 P2P 连接性测试');
    console.log('='.repeat(60));
    
    try {
        // 获取当前活跃的 peers
        const activePeers = await Peer.findAll({
            include: [{ model: User, attributes: ['username'] }],
            where: {
                last_announce: {
                    [require('sequelize').Op.gte]: new Date(Date.now() - 10 * 60 * 1000)
                }
            },
            order: [['last_announce', 'DESC']]
        });

        console.log(`\n📊 当前活跃 Peers: ${activePeers.length}个`);
        
        // 按状态分组
        const seeders = activePeers.filter(p => p.left === '0');
        const leechers = activePeers.filter(p => p.left !== '0');
        
        console.log(`🌱 做种者: ${seeders.length}个`);
        seeders.forEach(peer => {
            console.log(`   ${peer.User.username} (${peer.ip}:${peer.port})`);
        });
        
        console.log(`📥 下载者: ${leechers.length}个`);
        leechers.forEach(peer => {
            const leftMB = (parseInt(peer.left) / (1024 * 1024)).toFixed(2);
            console.log(`   ${peer.User.username} (${peer.ip}:${peer.port}) - 剩余: ${leftMB}MB`);
        });

        // 测试端口连通性
        if (seeders.length > 0 && leechers.length > 0) {
            console.log('\n🔗 测试 P2P 端口连通性...');
            
            for (const seeder of seeders) {
                console.log(`\n测试做种者 ${seeder.User.username} (${seeder.ip}:${seeder.port})`);
                
                const isReachable = await testTCPConnection(seeder.ip, parseInt(seeder.port));
                console.log(`   TCP 连接: ${isReachable ? '✅ 可达' : '❌ 不可达'}`);
                
                if (!isReachable) {
                    console.log(`   🔍 可能原因:`);
                    console.log(`      - 防火墙阻止了端口 ${seeder.port}`);
                    console.log(`      - NAT 设置问题`);
                    console.log(`      - qBittorrent 端口设置错误`);
                }
            }
        }

        // 分析网络拓扑
        console.log('\n🌐 网络拓扑分析:');
        const allIPs = activePeers.map(p => p.ip);
        const uniqueIPs = [...new Set(allIPs)];
        
        uniqueIPs.forEach(ip => {
            const network = ip.split('.').slice(0, 3).join('.');
            console.log(`   ${ip} -> 网段: ${network}.x`);
        });

        if (uniqueIPs.length > 1) {
            console.log(`   📡 跨网段通信: 需要路由器支持`);
        }

        // 检查announce间隔
        console.log('\n⏰ Announce 频率分析:');
        for (const peer of activePeers) {
            const lastAnnounce = new Date(peer.last_announce);
            const timeSince = Math.floor((Date.now() - lastAnnounce.getTime()) / 1000);
            console.log(`   ${peer.User.username}: ${timeSince}秒前 (通告次数: ${peer.announces})`);
        }

        // 提供解决建议
        console.log('\n💡 P2P 连接问题排查建议:');
        console.log('   1. 检查 qBittorrent 端口是否正确开放');
        console.log('   2. 确认防火墙允许 BitTorrent 流量');
        console.log('   3. 检查路由器 NAT 设置');
        console.log('   4. 验证 qBittorrent 监听地址设置');
        console.log('   5. 确认 DHT/PEX 设置是否正确');

    } catch (error) {
        console.error('测试失败:', error);
    }
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

testP2PConnectivity().then(() => {
    process.exit(0);
}).catch(console.error);

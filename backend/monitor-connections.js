require('dotenv').config();
const { Peer, User, Torrent, InfoHashVariant, AnnounceLog } = require('./models');

async function monitorConnections() {
    console.log('🔍 实时 P2P 连接监控');
    console.log('='.repeat(60));
    
    setInterval(async () => {
        try {
            // 查找最近活跃的 peers
            const activePeers = await Peer.findAll({
                include: [{ model: User, attributes: ['username'] }],
                where: {
                    last_announce: {
                        [require('sequelize').Op.gte]: new Date(Date.now() - 10 * 60 * 1000) // 10分钟内
                    }
                },
                order: [['last_announce', 'DESC']]
            });

            console.log(`\n[${new Date().toLocaleTimeString()}] 活跃 Peers: ${activePeers.length}个`);
            
            // 按 info_hash 分组
            const hashGroups = {};
            activePeers.forEach(peer => {
                const hash = peer.info_hash;
                if (!hashGroups[hash]) {
                    hashGroups[hash] = { seeders: [], leechers: [] };
                }
                
                if (peer.left === '0') {
                    hashGroups[hash].seeders.push(peer);
                } else {
                    hashGroups[hash].leechers.push(peer);
                }
            });

            for (const [hash, group] of Object.entries(hashGroups)) {
                console.log(`\n📂 Hash: ${hash.slice(-8)}`);
                
                // 查找对应的种子信息
                const variant = await InfoHashVariant.findOne({
                    where: { variant_info_hash: hash },
                    include: [{ model: Torrent, as: 'originalTorrent' }]
                });
                
                if (variant) {
                    console.log(`   种子: ${variant.originalTorrent.name}`);
                }
                
                console.log(`   🌱 做种者: ${group.seeders.length}个`);
                group.seeders.forEach(peer => {
                    console.log(`      ${peer.User.username} (${peer.ip}:${peer.port})`);
                });
                
                console.log(`   📥 下载者: ${group.leechers.length}个`);
                group.leechers.forEach(peer => {
                    const leftMB = (parseInt(peer.left) / (1024 * 1024)).toFixed(2);
                    console.log(`      ${peer.User.username} (${peer.ip}:${peer.port}) - 剩余: ${leftMB}MB`);
                });

                // P2P 连接可能性分析
                if (group.seeders.length > 0 && group.leechers.length > 0) {
                    console.log(`   ✅ P2P 连接条件: 具备 (${group.seeders.length}个做种者 + ${group.leechers.length}个下载者)`);
                    
                    // 检查是否在不同网络
                    const allIPs = [...group.seeders, ...group.leechers].map(p => p.ip);
                    const uniqueNetworks = [...new Set(allIPs.map(ip => ip.split('.').slice(0, 3).join('.')))];
                    console.log(`   🌐 网络分布: ${uniqueNetworks.length}个不同网段`);
                    
                } else {
                    console.log(`   ❌ P2P 连接条件: 不具备 (需要同时有做种者和下载者)`);
                }
            }

            // 检查最近的 announce 活动
            const recentAnnounces = await AnnounceLog.findAll({
                include: [{ model: User, attributes: ['username'] }],
                where: {
                    announced_at: {
                        [require('sequelize').Op.gte]: new Date(Date.now() - 2 * 60 * 1000) // 2分钟内
                    }
                },
                order: [['announced_at', 'DESC']],
                limit: 5
            });

            if (recentAnnounces.length > 0) {
                console.log('\n📡 最近 Announce 活动:');
                recentAnnounces.forEach(log => {
                    const time = new Date(log.announced_at).toLocaleTimeString();
                    console.log(`   [${time}] ${log.User.username} - ${log.event || '更新'} (${log.ip}:${log.port})`);
                });
            }

        } catch (error) {
            console.error('监控错误:', error.message);
        }
    }, 10000); // 每10秒检查一次
}

// 启动监控
monitorConnections().catch(console.error);

console.log('🚀 P2P 连接监控已启动，每10秒更新一次...');
console.log('按 Ctrl+C 停止监控');

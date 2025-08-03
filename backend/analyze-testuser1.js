require('dotenv').config();
const { Peer, User, Torrent, InfoHashVariant } = require('./models');

async function analyzeTestUser1Status() {
    console.log('🔍 分析 testuser1 的详细状态');
    console.log('='.repeat(60));
    
    try {
        // 查找testuser1的所有peers记录
        const testuser1Peers = await Peer.findAll({
            include: [{ model: User, attributes: ['username'] }],
            where: {
                '$User.username$': 'testuser1'
            },
            order: [['last_announce', 'DESC']]
        });
        
        console.log(`\n📊 testuser1 的所有 Peer 记录: ${testuser1Peers.length}个`);
        
        testuser1Peers.forEach((peer, index) => {
            const lastTime = new Date(peer.last_announce).toLocaleTimeString();
            const leftMB = (parseInt(peer.left) / (1024 * 1024)).toFixed(2);
            const status = peer.left === '0' ? '✅ 做种' : `📥 下载 (剩余${leftMB}MB)`;
            
            console.log(`\n${index + 1}. Peer ID: ${peer.id}`);
            console.log(`   地址: ${peer.ip}:${peer.port}`);
            console.log(`   状态: ${status}`);
            console.log(`   Info Hash: ${peer.info_hash}`);
            console.log(`   最后通告: ${lastTime}`);
            console.log(`   通告次数: ${peer.announces}`);
            
            // 检查对应的种子信息
            if (peer.torrent_id) {
                console.log(`   种子ID: ${peer.torrent_id}`);
            }
        });
        
        // 分析下载完成情况
        const activePeers = testuser1Peers.filter(p => {
            const lastAnnounce = new Date(p.last_announce);
            return (Date.now() - lastAnnounce.getTime()) < 30 * 60 * 1000; // 30分钟内
        });
        
        console.log(`\n📈 活跃状态分析:`);
        console.log(`   活跃 Peers: ${activePeers.length}个`);
        
        const seedingPeers = activePeers.filter(p => p.left === '0');
        const downloadingPeers = activePeers.filter(p => p.left !== '0');
        
        console.log(`   做种中: ${seedingPeers.length}个`);
        console.log(`   下载中: ${downloadingPeers.length}个`);
        
        if (downloadingPeers.length > 0) {
            console.log(`\n🔍 下载未完成分析:`);
            downloadingPeers.forEach(peer => {
                const leftBytes = parseInt(peer.left);
                const leftMB = (leftBytes / (1024 * 1024)).toFixed(2);
                console.log(`   剩余 ${leftMB}MB (${leftBytes} bytes)`);
                
                if (leftBytes < 1024 * 1024) { // 小于1MB
                    console.log(`   ⚠️  剩余量很小，可能是:`);
                    console.log(`      - 最后几个数据块正在传输`);
                    console.log(`      - 等待Hash校验`);
                    console.log(`      - qBittorrent内部处理延迟`);
                }
            });
        }
        
        // 检查种子文件完整性
        console.log(`\n📁 种子文件检查:`);
        const uniqueHashes = [...new Set(testuser1Peers.map(p => p.info_hash))];
        
        for (const hash of uniqueHashes) {
            console.log(`\n   Info Hash: ${hash}`);
            
            // 查找对应的原始种子
            const variant = await InfoHashVariant.findOne({
                where: { variant_info_hash: hash },
                include: [{ model: Torrent, as: 'originalTorrent' }]
            });
            
            if (variant) {
                console.log(`   📦 种子: ${variant.originalTorrent.name}`);
                console.log(`   📏 文件大小: ${(variant.originalTorrent.size / (1024 * 1024)).toFixed(2)}MB`);
                
                // 计算下载进度
                const downloadingPeer = downloadingPeers.find(p => p.info_hash === hash);
                if (downloadingPeer) {
                    const progress = ((variant.originalTorrent.size - parseInt(downloadingPeer.left)) / variant.originalTorrent.size * 100).toFixed(2);
                    console.log(`   📊 下载进度: ${progress}%`);
                }
            }
        }
        
        console.log(`\n💡 解决建议:`);
        console.log(`   1. 等待几分钟让qBittorrent完成最后的数据块`);
        console.log(`   2. 在qBittorrent中右键种子 -> "强制重新校验"`);
        console.log(`   3. 检查qBittorrent的"下载"文件夹中文件是否完整`);
        console.log(`   4. 确认没有磁盘空间不足的问题`);
        console.log(`   5. 重启qBittorrent客户端`);
        
    } catch (error) {
        console.error('分析失败:', error);
    }
}

analyzeTestUser1Status().then(() => {
    process.exit(0);
}).catch(console.error);

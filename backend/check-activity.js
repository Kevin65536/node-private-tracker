require('dotenv').config();
const { AnnounceLog, User, Peer } = require('./models');

async function checkRecentActivity() {
    console.log('🔍 检查最近的tracker活动');
    console.log('='.repeat(50));
    
    try {
        // 检查最近的announce日志
        const recentAnnounces = await AnnounceLog.findAll({
            include: [{ model: User, attributes: ['username'] }],
            order: [['announced_at', 'DESC']],
            limit: 10
        });
        
        console.log('\n📡 最近10次Announce:');
        recentAnnounces.forEach(log => {
            const time = new Date(log.announced_at).toLocaleTimeString();
            console.log(`[${time}] ${log.User.username} - ${log.ip}:${log.port} - ${log.event || 'update'}`);
        });
        
        // 检查当前活跃的peers
        const activePeers = await Peer.findAll({
            include: [{ model: User, attributes: ['username'] }],
            where: {
                last_announce: {
                    [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 60 * 1000) // 30分钟内
                }
            },
            order: [['last_announce', 'DESC']]
        });
        
        console.log(`\n👥 当前活跃Peers (30分钟内): ${activePeers.length}个`);
        activePeers.forEach(peer => {
            const lastTime = new Date(peer.last_announce).toLocaleTimeString();
            const status = peer.left === '0' ? '做种' : `下载 (剩余${(parseInt(peer.left) / (1024*1024)).toFixed(2)}MB)`;
            console.log(`   ${peer.User.username} (${peer.ip}:${peer.port}) - ${status} - 最后活动: ${lastTime}`);
        });
        
        // 分析做种和下载情况
        const seeders = activePeers.filter(p => p.left === '0');
        const leechers = activePeers.filter(p => p.left !== '0');
        
        console.log(`\n📊 P2P状态分析:`);
        console.log(`   🌱 做种者: ${seeders.length}个`);
        console.log(`   📥 下载者: ${leechers.length}个`);
        
        if (seeders.length > 0 && leechers.length > 0) {
            console.log(`   ✅ P2P条件: 满足 (有做种者和下载者)`);
        } else {
            console.log(`   ❌ P2P条件: 不满足 (需要同时有做种者和下载者)`);
            if (seeders.length === 0) console.log(`      缺少做种者`);
            if (leechers.length === 0) console.log(`      缺少下载者`);
        }
        
    } catch (error) {
        console.error('检查失败:', error);
    }
}

checkRecentActivity().then(() => {
    process.exit(0);
}).catch(console.error);

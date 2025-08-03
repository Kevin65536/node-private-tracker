require('dotenv').config();
const { Peer, AnnounceLog, InfoHashVariant, Torrent } = require('./models');

async function diagnosePeerConnections() {
  try {
    console.log('🔍 P2P 连接诊断分析');
    console.log('='.repeat(60));
    
    // 获取最近活跃的peers
    const activePeers = await Peer.findAll({
      include: [{ 
        model: require('./models').User, 
        attributes: ['username'] 
      }],
      where: {
        last_announce: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 10 * 60 * 1000) // 10分钟内
        }
      },
      order: [['last_announce', 'DESC']]
    });
    
    console.log('👥 活跃 Peers 详细信息:');
    activePeers.forEach(peer => {
      const timeAgo = Math.floor((Date.now() - peer.last_announce) / 1000);
      console.log(`   ${peer.User.username} (${peer.ip}:${peer.port})`);
      console.log(`   Info Hash: ${peer.info_hash}`);
      console.log(`   状态: ${peer.left > 0 ? '下载中' : '做种中'} | 剩余: ${(peer.left/1024/1024).toFixed(2)}MB`);
      console.log(`   最后通告: ${timeAgo}秒前`);
      console.log(`   Peer ID: ${peer.peer_id}`);
      console.log('');
    });
    
    // 检查是否有相同 info_hash 的不同 peers
    const hashGroups = {};
    activePeers.forEach(peer => {
      if (!hashGroups[peer.info_hash]) {
        hashGroups[peer.info_hash] = [];
      }
      hashGroups[peer.info_hash].push(peer);
    });
    
    console.log('🔗 Info Hash 分组分析:');
    for (const [hash, peers] of Object.entries(hashGroups)) {
      console.log(`   Hash: ${hash}`);
      
      // 查找对应的种子
      const variant = await InfoHashVariant.findOne({
        where: { variant_info_hash: hash },
        include: [{
          model: Torrent,
          as: 'originalTorrent',
          attributes: ['name']
        }]
      });
      
      if (variant) {
        console.log(`   种子: ${variant.originalTorrent.name}`);
      }
      
      const seeders = peers.filter(p => p.left === 0);
      const leechers = peers.filter(p => p.left > 0);
      
      console.log(`   做种者: ${seeders.length}个, 下载者: ${leechers.length}个`);
      
      if (seeders.length > 0 && leechers.length > 0) {
        console.log('   ✅ 有做种者和下载者，应该能建立连接');
        
        // 检查网络可达性
        console.log('   🌐 网络连接检查:');
        seeders.forEach(seeder => {
          leechers.forEach(leecher => {
            console.log(`     ${seeder.User.username}(${seeder.ip}:${seeder.port}) -> ${leecher.User.username}(${leecher.ip}:${leecher.port})`);
            
            // 检查是否在同一网段
            if (seeder.ip.startsWith('172.21') && leecher.ip.startsWith('172.21')) {
              console.log('       ✅ 同一局域网段');
            } else if (seeder.ip === '127.0.0.1' || leecher.ip === '127.0.0.1') {
              console.log('       ⚠️  本地回环地址，可能是测试');
            } else {
              console.log('       ⚠️  不同网段，可能需要NAT穿透');
            }
          });
        });
      } else {
        console.log('   ❌ 缺少做种者或下载者');
      }
      console.log('');
    }
    
    // 检查最近的announce记录
    const recentAnnounces = await AnnounceLog.findAll({
      include: [{ 
        model: require('./models').User, 
        attributes: ['username'] 
      }],
      where: {
        announced_at: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 5 * 60 * 1000) // 5分钟内
        }
      },
      order: [['announced_at', 'DESC']],
      limit: 10
    });
    
    console.log('📡 最近 Announce 模式分析:');
    const announcePattern = {};
    recentAnnounces.forEach(log => {
      const key = `${log.User.username}@${log.ip}:${log.port}`;
      if (!announcePattern[key]) {
        announcePattern[key] = [];
      }
      announcePattern[key].push({
        event: log.event,
        time: log.announced_at,
        hash: log.info_hash
      });
    });
    
    for (const [peer, announces] of Object.entries(announcePattern)) {
      console.log(`   ${peer}:`);
      announces.forEach(a => {
        const timeAgo = Math.floor((Date.now() - a.time) / 1000);
        console.log(`     ${a.event} (${timeAgo}秒前) - ${a.hash}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 诊断失败:', error.message);
    process.exit(1);
  }
}

diagnosePeerConnections();

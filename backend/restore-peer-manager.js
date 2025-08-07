/**
 * 修复PeerManager内存状态
 * 从数据库恢复活跃peer到内存中
 */

// 加载环境变量
require('dotenv').config();

const { sequelize, Peer } = require('./models');
const { Op } = require('sequelize');
const { peerManager } = require('./utils/tracker');

async function restorePeerManagerFromDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    console.log('\n🔄 开始从数据库恢复PeerManager状态...');

    // 获取所有活跃的peer (最近30分钟内有announce)
    const activePeers = await Peer.findAll({
      where: {
        last_announce: {
          [Op.gte]: new Date(Date.now() - 30 * 60 * 1000)
        }
      },
      order: [['last_announce', 'DESC']]
    });

    console.log(`📊 找到 ${activePeers.length} 个活跃peer`);

    let restoredCount = 0;
    const infoHashStats = new Map();

    // 将活跃peer添加到PeerManager内存中
    for (const peer of activePeers) {
      try {
        peerManager.addPeer(peer.info_hash, {
          user_id: peer.user_id,
          peer_id: peer.peer_id,
          ip: peer.ip,
          port: peer.port,
          uploaded: parseInt(peer.uploaded),
          downloaded: parseInt(peer.downloaded),
          left: parseInt(peer.left)
        });

        restoredCount++;

        // 统计每个种子的peer数量
        if (!infoHashStats.has(peer.info_hash)) {
          infoHashStats.set(peer.info_hash, { seeders: 0, leechers: 0 });
        }
        const stats = infoHashStats.get(peer.info_hash);
        if (parseInt(peer.left) === 0) {
          stats.seeders++;
        } else {
          stats.leechers++;
        }

        console.log(`  ✅ 恢复peer: 用户${peer.user_id} - ${peer.peer_id} (left: ${peer.left})`);
      } catch (error) {
        console.error(`  ❌ 恢复peer失败: ${error.message}`);
      }
    }

    console.log(`\n📈 恢复完成: ${restoredCount}/${activePeers.length} 个peer`);

    // 显示每个种子的统计
    console.log(`\n📊 各种子peer统计:`);
    for (const [infoHash, stats] of infoHashStats.entries()) {
      console.log(`  ${infoHash}: 做种${stats.seeders}个, 下载${stats.leechers}个`);
      
      // 验证PeerManager统计
      const managerStats = peerManager.getTorrentStats(infoHash);
      console.log(`    PeerManager统计: 做种${managerStats.complete}个, 下载${managerStats.incomplete}个`);
    }

    // 特别检查目标种子
    const targetInfoHash = '60fa5be08451b5a7ee0cda878d8f411efc4b2276';
    console.log(`\n🎯 检查目标种子 ${targetInfoHash}:`);
    
    const targetPeers = peerManager.getPeers(targetInfoHash);
    const targetStats = peerManager.getTorrentStats(targetInfoHash);
    
    console.log(`  内存中peer数量: ${targetPeers.length}`);
    console.log(`  做种者: ${targetStats.complete}, 下载者: ${targetStats.incomplete}`);
    
    if (targetPeers.length > 0) {
      console.log(`  详细信息:`);
      targetPeers.forEach((peer, index) => {
        console.log(`    ${index + 1}. 用户${peer.user_id} - ${peer.peer_id} (left: ${peer.left})`);
      });
    }

  } catch (error) {
    console.error('❌ 恢复失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 运行恢复
if (require.main === module) {
  restorePeerManagerFromDatabase();
}

module.exports = { restorePeerManagerFromDatabase };

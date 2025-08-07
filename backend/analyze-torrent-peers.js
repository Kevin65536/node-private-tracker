/**
 * 深度分析特定种子的做种数量问题
 * 检查info_hash为60fa5be08451b5a7ee0cda878d8f411efc4b2276的种子
 */

// 加载环境变量
require('dotenv').config();

const { sequelize, User, Torrent, Download, Peer, UserPasskey } = require('./models');
const { Op } = require('sequelize');

async function analyzeSpecificTorrent() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    const targetInfoHash = '60fa5be08451b5a7ee0cda878d8f411efc4b2276';
    
    console.log(`\n🔍 分析种子: ${targetInfoHash}`);
    
    // 1. 获取种子基本信息
    const torrent = await Torrent.findOne({
      where: { info_hash: targetInfoHash }
    });

    if (!torrent) {
      console.log('❌ 种子不存在');
      return;
    }

    console.log(`种子名称: ${torrent.name}`);
    console.log(`种子ID: ${torrent.id}`);
    console.log(`状态: ${torrent.status}`);

    // 2. 检查所有相关的Peer记录
    console.log(`\n📊 Peer表分析:`);
    
    const allPeers = await Peer.findAll({
      where: { 
        info_hash: targetInfoHash 
      },
      include: [
        { model: User, attributes: ['username'] }
      ],
      order: [['last_announce', 'DESC']]
    });

    console.log(`总共找到 ${allPeers.length} 个peer记录:`);
    
    allPeers.forEach((peer, index) => {
      const timeSinceLastAnnounce = Date.now() - new Date(peer.last_announce).getTime();
      const minutesAgo = Math.floor(timeSinceLastAnnounce / (1000 * 60));
      const isActive = minutesAgo <= 30; // 30分钟内算活跃
      
      console.log(`  ${index + 1}. 用户: ${peer.User?.username || 'Unknown'}`);
      console.log(`     Peer ID: ${peer.peer_id}`);
      console.log(`     Left: ${peer.left} (${peer.left === 0 ? '做种' : '下载中'})`);
      console.log(`     上传: ${peer.uploaded}, 下载: ${peer.downloaded}`);
      console.log(`     状态: ${peer.status}`);
      console.log(`     最后通告: ${peer.last_announce} (${minutesAgo}分钟前) ${isActive ? '✅活跃' : '❌过期'}`);
      console.log(`     IP: ${peer.ip}:${peer.port}`);
      console.log('');
    });

    // 3. 分析活跃peer
    const activePeers = allPeers.filter(peer => {
      const timeSinceLastAnnounce = Date.now() - new Date(peer.last_announce).getTime();
      return timeSinceLastAnnounce <= 30 * 60 * 1000; // 30分钟内
    });

    const activeSeeders = activePeers.filter(peer => peer.left === 0);
    const activeLeechers = activePeers.filter(peer => peer.left > 0);

    console.log(`\n📈 活跃peer统计 (30分钟内):`);
    console.log(`总活跃peer: ${activePeers.length}`);
    console.log(`活跃做种者: ${activeSeeders.length}`);
    console.log(`活跃下载者: ${activeLeechers.length}`);

    if (activeSeeders.length > 0) {
      console.log(`\n做种者详情:`);
      activeSeeders.forEach((seeder, index) => {
        console.log(`  ${index + 1}. ${seeder.User?.username} (${seeder.peer_id})`);
        console.log(`     上传: ${seeder.uploaded}, IP: ${seeder.ip}:${seeder.port}`);
      });
    }

    // 4. 检查Download表记录
    console.log(`\n📋 Download表分析:`);
    
    const downloads = await Download.findAll({
      where: { torrent_id: torrent.id },
      include: [
        { model: User, attributes: ['username'] }
      ]
    });

    console.log(`找到 ${downloads.length} 个下载记录:`);
    
    downloads.forEach((download, index) => {
      console.log(`  ${index + 1}. 用户: ${download.User?.username || 'Unknown'}`);
      console.log(`     状态: ${download.status}`);
      console.log(`     Left: ${download.left}`);
      console.log(`     上传: ${download.uploaded}, 下载: ${download.downloaded}`);
      console.log(`     最后通告: ${download.last_announce}`);
      console.log('');
    });

    // 5. 使用PeerManager检查内存中的统计
    console.log(`\n🧠 PeerManager内存统计:`);
    
    // 我们需要检查tracker.js中的peerManager
    try {
      const { peerManager } = require('./utils/tracker');
      const memoryPeers = peerManager.getPeers(targetInfoHash);
      const memoryStats = peerManager.getTorrentStats(targetInfoHash);
      
      console.log(`内存中peer数量: ${memoryPeers.length}`);
      console.log(`内存统计 - 做种者: ${memoryStats.complete}, 下载者: ${memoryStats.incomplete}`);
      
      if (memoryPeers.length > 0) {
        console.log(`\n内存peer详情:`);
        memoryPeers.forEach((peer, index) => {
          console.log(`  ${index + 1}. 用户ID: ${peer.user_id}`);
          console.log(`     Peer ID: ${peer.peer_id}`);
          console.log(`     Left: ${peer.left} (${peer.left === 0 ? '做种' : '下载中'})`);
          console.log(`     IP: ${peer.ip}:${peer.port}`);
        });
      }
    } catch (error) {
      console.log(`无法获取PeerManager统计: ${error.message}`);
    }

    // 6. 检查announce日志
    console.log(`\n📜 最近announce日志 (最近1小时):`);
    
    const recentLogs = await sequelize.query(`
      SELECT al.*, u.username, al.announced_at,
             (EXTRACT(EPOCH FROM (NOW() - al.announced_at))/60)::integer as minutes_ago
      FROM announce_logs al 
      LEFT JOIN users u ON al.user_id = u.id 
      WHERE al.info_hash = :infoHash 
        AND al.announced_at >= NOW() - INTERVAL '1 hour'
      ORDER BY al.announced_at DESC 
      LIMIT 20
    `, {
      replacements: { infoHash: targetInfoHash },
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`找到 ${recentLogs.length} 条最近日志:`);
    
    recentLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. 用户: ${log.username} - ${log.minutes_ago}分钟前`);
      console.log(`     事件: ${log.event || 'update'}`);
      console.log(`     Left: ${log.left}, 上传: ${log.uploaded}, 下载: ${log.downloaded}`);
      console.log(`     IP: ${log.ip}:${log.port}`);
    });

    // 7. 问题分析
    console.log(`\n🔍 问题分析:`);
    
    const dbSeeders = activeSeeders.length;
    const clientReportedSeeders = 1; // 用户报告的数量
    
    if (dbSeeders !== clientReportedSeeders) {
      console.log(`❌ 发现不一致!`);
      console.log(`   数据库显示活跃做种者: ${dbSeeders} 个`);
      console.log(`   客户端显示做种者: ${clientReportedSeeders} 个`);
      
      console.log(`\n可能的原因:`);
      console.log(`1. PeerManager内存统计与数据库不同步`);
      console.log(`2. 客户端缓存了旧的统计数据`);
      console.log(`3. Tracker响应的统计计算有问题`);
      console.log(`4. 客户端announce间隔设置问题`);
      console.log(`5. 同一用户多个peer_id被当作不同用户计算`);
    } else {
      console.log(`✅ 数据一致`);
    }

  } catch (error) {
    console.error('❌ 分析失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 运行分析
if (require.main === module) {
  analyzeSpecificTorrent();
}

module.exports = { analyzeSpecificTorrent };

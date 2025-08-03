require('dotenv').config();
const { AnnounceLog, Peer, User } = require('./models');

async function checkAnnounceData() {
  try {
    console.log('🔍 检查最新的 Announce 记录');
    
    const latestAnnounce = await AnnounceLog.findOne({
      order: [['announced_at', 'DESC']],
      include: [{ model: User, attributes: ['username'] }]
    });
    
    if (latestAnnounce) {
      console.log('📝 最新 Announce 记录:');
      console.log(`   用户: ${latestAnnounce.User.username}`);
      console.log(`   Info Hash: ${latestAnnounce.info_hash}`);
      console.log(`   Peer ID: ${latestAnnounce.peer_id}`);
      console.log(`   端口: ${latestAnnounce.port}`);
      console.log(`   事件: ${latestAnnounce.event}`);
      console.log(`   时间: ${latestAnnounce.announced_at}`);
    }
    
    console.log('\n🔍 检查当前活跃的 Peers');
    const activePeers = await Peer.findAll({
      include: [{ model: User, attributes: ['username'] }]
    });
    
    if (activePeers.length > 0) {
      console.log('🌐 活跃 Peers:');
      activePeers.forEach(peer => {
        console.log(`   ${peer.User.username}: ${peer.ip}:${peer.port} (${peer.state})`);
        console.log(`   Info Hash: ${peer.info_hash}`);
        console.log(`   最后更新: ${peer.last_announce}`);
      });
    } else {
      console.log('❌ 没有活跃的 Peers');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

checkAnnounceData();

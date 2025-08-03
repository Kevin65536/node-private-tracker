require('dotenv').config();
const { Peer, User, AnnounceLog } = require('./models');

async function monitorP2P() {
  console.log('🚀 PT站 P2P 实时监控启动...');
  console.log('按 Ctrl+C 停止监控\n');
  
  setInterval(async () => {
    try {
      console.clear();
      console.log('🔄 PT站 P2P 实时监控 - ' + new Date().toLocaleString());
      console.log('='.repeat(60));
      
      // 检查活跃peers
      const peers = await Peer.findAll({
        include: [{ model: User, attributes: ['username'] }],
        order: [['last_announce', 'DESC']]
      });
      
      console.log('🌐 当前活跃 Peers:');
      if (peers.length === 0) {
        console.log('   ❌ 没有活跃的 Peers');
      } else {
        peers.forEach(peer => {
          const status = peer.left > 0 ? '⬇️ 下载中' : '⬆️ 做种中';
          const ratio = peer.downloaded > 0 ? (peer.uploaded / peer.downloaded).toFixed(2) : '∞';
          console.log(`   ${status} ${peer.User.username}: ${peer.ip}:${peer.port}`);
          console.log(`      上传: ${(peer.uploaded / 1024 / 1024).toFixed(2)}MB | 下载: ${(peer.downloaded / 1024 / 1024).toFixed(2)}MB | 剩余: ${(peer.left / 1024 / 1024).toFixed(2)}MB`);
          console.log(`      分享率: ${ratio} | 通告次数: ${peer.announces || 0}`);
          console.log(`      最后通告: ${peer.last_announce ? peer.last_announce.toLocaleString() : 'N/A'}`);
          console.log('');
        });
      }
      
      // 检查最近的announce
      const recentAnnounces = await AnnounceLog.findAll({
        include: [{ model: User, attributes: ['username'] }],
        order: [['announced_at', 'DESC']],
        limit: 8
      });
      
      console.log('📡 最近 Announce 记录:');
      if (recentAnnounces.length === 0) {
        console.log('   ❌ 没有 Announce 记录');
      } else {
        recentAnnounces.forEach(log => {
          const timeAgo = Math.floor((Date.now() - log.announced_at) / 1000);
          const timeStr = timeAgo < 60 ? `${timeAgo}秒前` : 
                         timeAgo < 3600 ? `${Math.floor(timeAgo/60)}分钟前` : 
                         `${Math.floor(timeAgo/3600)}小时前`;
          console.log(`   👤 ${log.User.username}: ${log.event} (${timeStr}) - ${log.ip}:${log.port}`);
        });
      }
      
      console.log('\n💡 提示: 这是实时监控，数据每5秒更新一次');
      
    } catch (error) {
      console.error('❌ 监控错误:', error.message);
    }
  }, 5000);
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n👋 监控已停止');
  process.exit(0);
});

monitorP2P();

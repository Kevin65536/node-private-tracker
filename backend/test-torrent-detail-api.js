/**
 * 测试修改后的种子详情API，验证实时统计功能
 */

// 加载环境变量
require('dotenv').config();

const axios = require('axios');

async function testTorrentDetailAPI() {
  try {
    console.log('🧪 测试种子详情API的实时统计功能...');
    
    // 从图片中看到的种子ID
    const torrentId = 2; // "忍者杀手"种子
    
    console.log(`\n📋 获取种子详情 (ID: ${torrentId})...`);
    
    const response = await axios.get(`http://localhost:3001/api/torrents/${torrentId}`);
    
    console.log('✅ API响应成功!');
    console.log('\n📊 种子基本信息:');
    console.log(`   名称: ${response.data.torrent.name}`);
    console.log(`   Info Hash: ${response.data.torrent.info_hash}`);
    console.log(`   状态: ${response.data.torrent.status}`);
    console.log(`   大小: ${(response.data.torrent.size / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n📚 数据库统计 (历史记录):');
    const dbStats = response.data.torrent.download_stats;
    console.log(`   做种记录: ${dbStats.seeding}`);
    console.log(`   下载记录: ${dbStats.downloading}`); 
    console.log(`   完成记录: ${dbStats.completed}`);
    console.log(`   停止记录: ${dbStats.stopped}`);
    
    console.log('\n📡 实时tracker统计:');
    const realTimeStats = response.data.torrent.real_time_stats;
    if (realTimeStats) {
      console.log(`   ✅ 当前做种: ${realTimeStats.seeders}`);
      console.log(`   ⬇️  当前下载: ${realTimeStats.leechers}`);
      console.log(`   👥 活跃peer: ${realTimeStats.total_peers}`);
      console.log(`   🕐 更新时间: ${realTimeStats.last_updated}`);
    } else {
      console.log('   ❌ 无实时统计数据 (可能tracker中没有活跃peer)');
    }
    
    console.log('\n🔄 对比分析:');
    if (realTimeStats) {
      console.log(`   数据库显示做种: ${dbStats.seeding} vs 实时做种: ${realTimeStats.seeders}`);
      console.log(`   数据库显示下载: ${dbStats.downloading} vs 实时下载: ${realTimeStats.leechers}`);
      
      if (realTimeStats.seeders !== dbStats.seeding) {
        console.log('   ⚠️  检测到差异 - 实时数据与数据库记录不同步');
      } else {
        console.log('   ✅ 数据同步一致');
      }
    }
    
    console.log('\n🎯 结论:');
    console.log('   前端现在可以显示:');
    console.log('   1. 📡 实时状态: 当前正在做种/下载的用户数');
    console.log('   2. 📚 历史记录: 曾经下载过该种子的用户统计');
    console.log('   3. 🔄 用户可以手动刷新获取最新状态');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示: 请确保后端服务器正在运行 (npm start)');
    }
  }
}

// 运行测试
if (require.main === module) {
  testTorrentDetailAPI();
}

module.exports = { testTorrentDetailAPI };

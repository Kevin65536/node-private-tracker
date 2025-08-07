// 测试前端页面数据显示
require('dotenv').config();
const axios = require('axios');

async function testFrontendDataDisplay() {
  try {
    console.log('🔍 测试前端数据显示...\n');
    
    // 测试种子列表API
    const response = await axios.get('http://localhost:3001/api/torrents?limit=3', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 种子列表API调用成功');
    console.log(`📊 返回种子数量: ${response.data.torrents.length}\n`);
    
    response.data.torrents.forEach((torrent, index) => {
      console.log(`📁 种子 ${index + 1}: ${torrent.name}`);
      console.log(`🔗 Info Hash: ${torrent.info_hash}`);
      
      if (torrent.real_time_stats) {
        console.log(`✅ 实时统计:`);
        console.log(`   🟢 当前做种: ${torrent.real_time_stats.seeders}`);
        console.log(`   🔴 当前下载: ${torrent.real_time_stats.leechers}`);
        console.log(`   ✅ 总完成数: ${torrent.real_time_stats.completed}`);
      } else {
        console.log(`❌ 缺少实时统计信息`);
      }
      
      console.log(`🔄 兼容字段: 做种${torrent.seeders} 下载${torrent.leechers} 完成${torrent.completed}\n`);
    });
    
    // 测试首页最新种子API（可能是相同的API）
    console.log('🏠 测试首页最新种子显示...');
    const homeResponse = await axios.get('http://localhost:3001/api/torrents?limit=5&sort=created_at&order=DESC');
    
    console.log(`✅ 首页API调用成功，返回 ${homeResponse.data.torrents.length} 个最新种子`);
    
    homeResponse.data.torrents.forEach((torrent, index) => {
      const stats = torrent.real_time_stats || {};
      console.log(`${index + 1}. ${torrent.name} - 做种:${stats.seeders || 0} 下载:${stats.leechers || 0} 完成:${stats.completed || 0}`);
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testFrontendDataDisplay();

/**
 * 测试API端点来检查PeerManager状态
 */

// 加载环境变量
require('dotenv').config();

const axios = require('axios');

async function testPeerManagerAPI() {
  try {
    const targetInfoHash = '60fa5be08451b5a7ee0cda878d8f411efc4b2276';
    
    console.log('🧪 测试PeerManager API状态...');
    
    // 测试tracker统计端点
    const statsResponse = await axios.get('http://localhost:3001/tracker/stats', {
      headers: {
        'Authorization': 'Bearer ' + process.env.TEST_ADMIN_TOKEN || 'test-token'
      }
    });
    
    console.log('📊 Tracker全局统计:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
    
    // 测试特定种子的peer信息
    try {
      const peersResponse = await axios.get(`http://localhost:3001/tracker/torrents/${targetInfoHash}/peers`, {
        headers: {
          'Authorization': 'Bearer ' + process.env.TEST_ADMIN_TOKEN || 'test-token'
        }
      });
      
      console.log('\n🎯 特定种子peer信息:');
      console.log(JSON.stringify(peersResponse.data, null, 2));
    } catch (peersError) {
      console.log('\n⚠️ 无法获取特定种子peer信息:', peersError.response?.status, peersError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error.response?.status, error.response?.data || error.message);
  }
}

// 简单的tracker announce测试
async function testTrackerAnnounce() {
  try {
    console.log('\n🔥 测试tracker announce...');
    
    // 使用管理员的passkey
    const adminPasskey = '3c7ac6a8f6f28624698ce65a52f4fe61';
    const targetInfoHash = '60fa5be08451b5a7ee0cda878d8f411efc4b2276';
    
    // 转换info_hash为URL编码格式
    const infoHashBuffer = Buffer.from(targetInfoHash, 'hex');
    const encodedInfoHash = infoHashBuffer.toString('latin1');
    
    const announceParams = {
      info_hash: encodedInfoHash,
      peer_id: '-TEST-1234567890ab', // 20个字符，符合数据库限制
      port: 6881,
      uploaded: 0,
      downloaded: 0,
      left: 0, // 做种状态
      event: 'started'
    };
    
    const announceUrl = `http://localhost:3001/tracker/announce/${adminPasskey}`;
    console.log(`📡 发送announce到: ${announceUrl}`);
    
    const response = await axios.get(announceUrl, {
      params: announceParams,
      responseType: 'arraybuffer'
    });
    
    console.log(`✅ Announce成功! 响应大小: ${response.data.length} bytes`);
    
    // 解析bencode响应
    try {
      const bencode = require('bncode');
      const decoded = bencode.decode(response.data);
      console.log('📊 Announce响应:');
      console.log(`   做种者: ${decoded.complete}`);
      console.log(`   下载者: ${decoded.incomplete}`);
      console.log(`   间隔: ${decoded.interval} 秒`);
      
      if (decoded.peers) {
        const peerCount = Buffer.isBuffer(decoded.peers) 
          ? decoded.peers.length / 6 
          : decoded.peers.length;
        console.log(`   返回peer数量: ${peerCount}`);
      }
    } catch (decodeError) {
      console.log('⚠️ 无法解析bencode响应:', decodeError.message);
    }
    
  } catch (error) {
    console.error('❌ Tracker announce测试失败:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('响应数据:', error.response.data.toString());
    }
  }
}

// 运行测试
if (require.main === module) {
  testPeerManagerAPI().then(() => {
    testTrackerAnnounce();
  });
}

module.exports = { testPeerManagerAPI, testTrackerAnnounce };

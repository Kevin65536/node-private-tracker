require('dotenv').config();
const axios = require('axios');

async function testRealQBittorrentRequest() {
  console.log('🔧 模拟真实 qBittorrent 请求测试');
  
  // 使用和实际失败请求相同的参数
  const baseUrl = 'http://localhost:3001/tracker/announce/9a5c1a8ea23d8b92a21ecca8751f873f';
  const params = {
    'info_hash': 'R\u0099\u0036\u00d5\u00fcV\u0085\u00f7\u0099\u0081\u00fd\u00d0\u0060h\u007f2\u00fdu\u00e5\u0026', // 原始二进制数据
    'peer_id': '-qB5120-T~q12AEzBrJY',
    'port': '27052',
    'uploaded': '0',
    'downloaded': '0',
    'left': '220259',
    'corrupt': '0',
    'key': '47FFCE41',
    'event': 'started',
    'numwant': '200',
    'compact': '1',
    'no_peer_id': '1',
    'supportcrypto': '1',
    'redundant': '0'
  };
  
  console.log('📋 测试参数:');
  console.log(`   Passkey: 9a5c1a8ea23d8b92a21ecca8751f873f (testuser1)`);
  console.log(`   Info Hash (原始): ${JSON.stringify(params.info_hash)}`);
  console.log(`   Info Hash (hex): ${Buffer.from(params.info_hash, 'latin1').toString('hex')}`);
  console.log(`   Peer ID: ${params.peer_id}`);
  console.log(`   Port: ${params.port}`);
  console.log(`   Event: ${params.event}`);
  
  try {
    const response = await axios.get(baseUrl, { 
      params,
      headers: {
        'User-Agent': 'qBittorrent/5.1.2'
      },
      // 不自动处理响应，因为可能是bencode格式
      responseType: 'arraybuffer'
    });
    
    console.log('\n📡 响应状态:', response.status);
    console.log('✅ Tracker Announce 成功！');
    
    // 尝试解析bencode响应
    const bencode = require('bncode');
    try {
      const decoded = bencode.decode(response.data);
      console.log('\n📊 Tracker 响应数据:');
      console.log(`   Announce 间隔: ${decoded.interval} 秒`);
      console.log(`   最小间隔: ${decoded['min interval']} 秒`);
      console.log(`   完整种子数 (seeders): ${decoded.complete}`);
      console.log(`   不完整种子数 (leechers): ${decoded.incomplete}`);
      console.log(`   总下载次数: ${decoded.downloaded}`);
      
      if (decoded.peers) {
        if (Buffer.isBuffer(decoded.peers)) {
          console.log(`   返回的 peer 数量: ${decoded.peers.length / 6} (compact 格式)`);
        } else {
          console.log(`   返回的 peer 数量: ${decoded.peers.length} (字典格式)`);
        }
      }
    } catch (benodeError) {
      console.log('⚠️  无法解析 bencode 响应，但请求成功');
      console.log('响应内容 (hex):', response.data.toString('hex').substring(0, 100) + '...');
    }
    
  } catch (error) {
    console.error('\n❌ 请求失败:');
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   响应: ${error.response.data.toString()}`);
    } else {
      console.error(`   错误: ${error.message}`);
    }
  }
}

testRealQBittorrentRequest();

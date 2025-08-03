/**
 * 使用正确参数测试 tracker announce
 */

require('dotenv').config();
const axios = require('axios');

async function testTrackerWithCorrectParams() {
  console.log('🔧 使用正确参数测试 Tracker Announce\n');

  const passkey = '3c7ac6a8f6f28624698ce65a52f4fe61'; // admin 的 passkey
  
  // BitTorrent announce 请求的必需参数
  const params = {
    info_hash: Buffer.from('892afd1d178eb49f8690ec71b84cbc46f7ff1f70', 'hex').toString('binary'), // 实际种子的 info_hash
    peer_id: '-qB4650-123456789012', // qBittorrent peer ID 格式
    port: '6881',
    uploaded: '0',
    downloaded: '0', 
    left: '100000',
    compact: '1',
    numwant: '200',
    event: 'started'
  };

  // 构建 URL
  const baseUrl = `http://localhost:3001/tracker/announce/${passkey}`;
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = `${baseUrl}?${queryString}`;
  
  console.log(`📋 测试参数:`);
  console.log(`   Passkey: ${passkey}`);
  console.log(`   Info Hash (hex): 892afd1d178eb49f8690ec71b84cbc46f7ff1f70`);
  console.log(`   Peer ID: ${params.peer_id}`);
  console.log(`   Port: ${params.port}`);
  console.log(`   Event: ${params.event}`);
  
  console.log(`\n🔗 完整 URL: ${fullUrl.substring(0, 100)}...`);
  
  try {
    const response = await axios.get(fullUrl, {
      timeout: 10000,
      validateStatus: () => true, // 接受所有状态码
      responseType: 'arraybuffer' // 因为响应是 bencode 二进制数据
    });
    
    console.log(`\n📡 响应状态: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Tracker Announce 成功！');
      
      // 解析 bencode 响应
      try {
        const bencode = require('bncode');
        const decoded = bencode.decode(Buffer.from(response.data));
        
        console.log('\n📊 Tracker 响应数据:');
        console.log(`   Announce 间隔: ${decoded.interval || 'N/A'} 秒`);
        console.log(`   最小间隔: ${decoded['min interval'] || 'N/A'} 秒`);
        console.log(`   完整种子数 (seeders): ${decoded.complete || 0}`);
        console.log(`   不完整种子数 (leechers): ${decoded.incomplete || 0}`);
        console.log(`   总下载次数: ${decoded.downloaded || 0}`);
        
        if (decoded.peers) {
          if (Buffer.isBuffer(decoded.peers)) {
            const peerCount = decoded.peers.length / 6; // 每个 peer 6字节 (4字节IP + 2字节端口)
            console.log(`   返回的 peer 数量: ${peerCount} (compact 格式)`);
          } else if (Array.isArray(decoded.peers)) {
            console.log(`   返回的 peer 数量: ${decoded.peers.length} (字典格式)`);
          }
        }
        
        console.log('\n🎉 Tracker 功能正常工作！');
        
      } catch (parseError) {
        console.log(`⚠️ 响应解析失败: ${parseError.message}`);
        console.log(`原始响应 (前100字节): ${Buffer.from(response.data).toString('hex').substring(0, 200)}`);
      }
      
    } else if (response.status === 400) {
      const errorMsg = Buffer.from(response.data).toString();
      console.log(`❌ 参数错误 (400): ${errorMsg}`);
      
      // 尝试解析 bencode 错误消息
      try {
        const bencode = require('bncode');
        const decoded = bencode.decode(Buffer.from(response.data));
        if (decoded['failure reason']) {
          console.log(`   错误原因: ${decoded['failure reason']}`);
        }
      } catch (e) {
        // 忽略解析错误
      }
      
    } else {
      console.log(`🔄 其他响应码: ${response.status}`);
      console.log(`   响应内容: ${Buffer.from(response.data).toString()}`);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 连接被拒绝 - 请确保服务器正在运行');
    } else {
      console.log(`❌ 请求失败: ${error.message}`);
    }
  }
}

// 还要测试 curl 等价命令
function generateCurlCommand() {
  const passkey = '3c7ac6a8f6f28624698ce65a52f4fe61';
  const params = new URLSearchParams({
    info_hash: Buffer.from('892afd1d178eb49f8690ec71b84cbc46f7ff1f70', 'hex').toString('binary'),
    peer_id: '-qB4650-123456789012',
    port: '6881',
    uploaded: '0',
    downloaded: '0',
    left: '100000',
    compact: '1',
    numwant: '200',
    event: 'started'
  });
  
  const url = `http://localhost:3001/tracker/announce/${passkey}?${params.toString()}`;
  
  console.log('\n📋 等价的 curl 命令:');
  console.log(`curl "${url}"`);
  console.log('\n💡 注意: 由于包含二进制数据，curl 输出可能显示乱码，但这是正常的');
}

async function main() {
  await testTrackerWithCorrectParams();
  generateCurlCommand();
}

main().catch(console.error);

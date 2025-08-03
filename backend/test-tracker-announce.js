/**
 * 测试完整的 tracker announce 请求
 */

require('dotenv').config();
const axios = require('axios');

async function testTrackerAnnounce() {
  console.log('🔥 测试 Tracker Announce 功能\n');

  // 从检查结果中获取的实际数据
  const testData = [
    {
      username: 'admin',
      passkey: '3c7ac6a8f6f28624698ce65a52f4fe61',
      role: '制种者'
    },
    {
      username: 'testuser1', 
      passkey: '9a5c1a8ea23d8b92a21ecca8751f873f',
      role: '下载者'
    }
  ];

  // 测试种子的 info_hash (从数据库中选择一个)
  const testTorrentInfoHash = '892afd1d178eb49f8690ec71b84cbc46f7ff1f70'; // latex 种子
  
  for (const user of testData) {
    console.log(`📋 测试用户: ${user.username} (${user.role})`);
    console.log('─'.repeat(50));

    // 构建完整的 announce URL 参数
    const announceParams = new URLSearchParams({
      info_hash: Buffer.from(testTorrentInfoHash, 'hex').toString('binary'),
      peer_id: `-qB4650-${Math.random().toString(36).substr(2, 12)}`,
      port: Math.floor(Math.random() * 10000) + 20000,
      uploaded: user.username === 'admin' ? 0 : 0, // admin 是制种者，已经有完整文件
      downloaded: 0,
      left: user.username === 'admin' ? 0 : 100000, // admin 已完成，testuser1 需要下载
      compact: 1,
      numwant: 50,
      event: 'started'
    });

    const announceUrl = `http://localhost:3001/tracker/announce/${user.passkey}?${announceParams.toString()}`;
    
    console.log(`🔗 Announce URL: ${announceUrl.substring(0, 100)}...`);

    try {
      const response = await axios.get(announceUrl, {
        timeout: 5000,
        validateStatus: () => true // 接受所有状态码
      });

      console.log(`📡 响应状态: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`✅ Announce 成功!`);
        console.log(`📦 响应长度: ${response.data.length} 字节`);
        
        // 尝试解析 bencode 响应
        try {
          const bencode = require('bncode');
          const decoded = bencode.decode(response.data);
          
          if (decoded.interval) {
            console.log(`⏰ Announce 间隔: ${decoded.interval} 秒`);
          }
          if (decoded.complete !== undefined) {
            console.log(`🌱 做种者数量: ${decoded.complete}`);
          }
          if (decoded.incomplete !== undefined) {
            console.log(`📥 下载者数量: ${decoded.incomplete}`);
          }
          if (decoded.peers) {
            const peerCount = Buffer.isBuffer(decoded.peers) ? decoded.peers.length / 6 : decoded.peers.length;
            console.log(`👥 返回的 peer 数量: ${peerCount}`);
          }
        } catch (parseError) {
          console.log(`⚠️  响应解析失败: ${parseError.message}`);
        }
        
      } else if (response.status === 400) {
        console.log(`⚠️  参数错误 (400): ${response.data}`);
      } else if (response.status === 404) {
        console.log(`❌ 路由未找到 (404) - tracker 路由配置有问题`);
      } else {
        console.log(`🔄 其他响应: ${response.status} - ${response.data}`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ 连接被拒绝 - 服务器可能未运行');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('❌ 请求超时');
      } else {
        console.log(`❌ 请求失败: ${error.message}`);
      }
    }

    console.log('');
  }

  // 测试没有 passkey 的请求（应该返回 404）
  console.log('🧪 测试无效路径:');
  try {
    const invalidResponse = await axios.get('http://localhost:3001/tracker/announce/invalid_passkey', {
      timeout: 3000,
      validateStatus: () => true
    });
    
    if (invalidResponse.status === 400) {
      console.log('✅ 无效 passkey 正确返回 400 错误');
    } else {
      console.log(`🔄 无效 passkey 响应: ${invalidResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ 无效路径测试失败: ${error.message}`);
  }

  console.log('\n🎉 Tracker 测试完成!');
  console.log('\n💡 问题分析:');
  console.log('如果看到 404 错误，说明 tracker 路由配置有问题');
  console.log('如果看到 400 错误，说明路由正常但参数验证失败'); 
  console.log('如果看到 200 响应，说明 tracker 功能正常工作');
}

testTrackerAnnounce().catch(console.error);

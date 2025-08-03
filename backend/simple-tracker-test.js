/**
 * 简化的 tracker 测试，查看具体错误
 */

require('dotenv').config();
const axios = require('axios');

async function simpleTrackerTest() {
  console.log('🔍 简化 Tracker 测试\n');

  const passkey = '3c7ac6a8f6f28624698ce65a52f4fe61'; // admin 的 passkey
  
  // 构建简单的测试请求
  const params = new URLSearchParams({
    info_hash: 'test_hash_12345678901234567890',
    peer_id: '-qB4650-123456789012',
    port: '6881',
    uploaded: '0',
    downloaded: '0',
    left: '100000',
    compact: '1'
  });

  const url = `http://localhost:3001/tracker/announce/${passkey}?${params.toString()}`;
  
  console.log(`🔗 测试 URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log(`📡 状态码: ${response.status}`);
    console.log(`📝 响应内容: ${response.data}`);
    
    if (response.status === 200) {
      console.log('✅ 请求成功!');
    } else {
      console.log('⚠️ 请求失败，检查服务器日志以获取详细错误信息');
    }
    
  } catch (error) {
    console.error('❌ 请求异常:', error.message);
  }
}

simpleTrackerTest();

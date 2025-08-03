require('dotenv').config();
const axios = require('axios');

async function testWithDebug() {
  console.log('🔧 测试 URL 编码问题');
  
  const baseUrl = 'http://localhost:3001/tracker/announce/9a5c1a8ea23d8b92a21ecca8751f873f';
  
  // 模拟两种不同的编码方式
  const tests = [
    {
      name: 'qBittorrent 4.6.5 风格 (直接字节编码)',
      info_hash: 'R\u0099\u0036\u00d5\u00fcV\u0085\u00f7\u0099\u0081\u00fd\u00d0\u0060h\u007f2\u00fdu\u00e5\u0028'
    },
    {
      name: 'qBittorrent 5.1.2 风格 (可能包含UTF-8)',
      info_hash: decodeURIComponent('R%C2%996%C3%95%C3%BCV%C2%85%C3%B7%C2%99%C2%81%C3%BD%C3%90%60h%7F2%C3%BDu%C3%A5%26')
    }
  ];
  
  for (const test of tests) {
    console.log(`\n📋 测试: ${test.name}`);
    console.log(`   Info Hash (raw): ${JSON.stringify(test.info_hash)}`);
    console.log(`   Info Hash (hex): ${Buffer.from(test.info_hash, 'latin1').toString('hex')}`);
    
    try {
      const response = await axios.get(baseUrl, {
        params: {
          info_hash: test.info_hash,
          peer_id: '-TEST-123456789012',
          port: '6881',
          uploaded: '0',
          downloaded: '0',
          left: '100000',
          event: 'started'
        },
        timeout: 5000
      });
      
      console.log(`   ✅ 响应状态: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ 响应状态: ${error.response.status}`);
        console.log(`   响应内容: ${error.response.data.toString()}`);
      } else {
        console.log(`   ❌ 请求错误: ${error.message}`);
      }
    }
  }
}

testWithDebug();

/**
 * 获取管理员登录token
 */

// 加载环境变量
require('dotenv').config();

const axios = require('axios');

async function getAdminToken() {
  try {
    console.log('🔑 获取管理员token...');
    
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123456' // 正确的管理员密码
    });
    
    const token = loginResponse.data.token;
    console.log('✅ 获取token成功');
    console.log('Token:', token);
    
    return token;
    
  } catch (error) {
    console.error('❌ 获取token失败:', error.response?.data || error.message);
    return null;
  }
}

async function testTrackerWithAuth() {
  try {
    // 先获取token
    const token = await getAdminToken();
    if (!token) return;
    
    const targetInfoHash = '810320f078c0e712f31ad96c11c8c1f892271693';
    
    console.log('\n📊 测试tracker统计API...');
    
    // 测试tracker统计端点
    const statsResponse = await axios.get('http://localhost:3001/tracker/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Tracker全局统计:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
    
    // 测试特定种子的peer信息
    try {
      const peersResponse = await axios.get(`http://localhost:3001/tracker/torrents/${targetInfoHash}/peers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('\n🎯 特定种子peer信息:');
      console.log(JSON.stringify(peersResponse.data, null, 2));
    } catch (peersError) {
      console.log('\n⚠️ 无法获取特定种子peer信息:', peersError.response?.status, peersError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.status, error.response?.data || error.message);
  }
}

// 运行测试
if (require.main === module) {
  testTrackerWithAuth();
}

module.exports = { getAdminToken, testTrackerWithAuth };

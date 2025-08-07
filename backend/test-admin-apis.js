const axios = require('axios');

async function testAdminAPIs() {
  try {
    console.log('🔐 尝试登录admin用户...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123456'
    });
    
    console.log('✅ 登录成功！');
    const token = loginResponse.data.token;
    console.log('Token:', token.substring(0, 20) + '...');
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // 测试1: peer统计API
    console.log('\n📊 测试peer统计API...');
    try {
      const statsResponse = await axios.get('http://localhost:3001/api/admin/peers/stats', { headers });
      console.log('✅ Peer统计响应:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.error('❌ Peer统计失败:', error.response?.data || error.message);
    }
    
    // 测试2: 活跃peer列表
    console.log('\n👥 测试活跃peer列表API...');
    try {
      const peersResponse = await axios.get('http://localhost:3001/api/admin/peers/active', { headers });
      console.log('✅ 活跃peer响应:', JSON.stringify(peersResponse.data, null, 2));
    } catch (error) {
      console.error('❌ 活跃peer失败:', error.response?.data || error.message);
    }
    
    // 测试3: announce日志
    console.log('\n📝 测试announce日志API...');
    try {
      const announcesResponse = await axios.get('http://localhost:3001/api/admin/announces/recent', { headers });
      console.log('✅ Announce日志响应:', JSON.stringify(announcesResponse.data, null, 2));
    } catch (error) {
      console.error('❌ Announce日志失败:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testAdminAPIs();

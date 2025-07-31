// 测试管理员API的脚本
const axios = require('axios');

async function testAdminAPI() {
  try {
    console.log('测试管理员API...');
    
    // 首先测试健康检查
    console.log('1. 测试健康检查...');
    const healthResponse = await axios.get('http://localhost:3001/api/health');
    console.log('✅ 健康检查通过:', healthResponse.data);
    
    // 测试登录获取token
    console.log('2. 测试管理员登录...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123456'
    });
    console.log('✅ 登录成功:', loginResponse.data);
    
    const token = loginResponse.data.token;
    
    // 测试管理员种子列表API
    console.log('3. 测试管理员种子列表API...');
    const torrentsResponse = await axios.get('http://localhost:3001/api/admin/torrents?status=pending', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ 种子列表获取成功:', torrentsResponse.data);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应头:', error.response.headers);
    }
  }
}

testAdminAPI();

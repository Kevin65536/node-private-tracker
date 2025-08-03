require('dotenv').config();
const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔍 测试登录API...\n');
    
    // 测试API地址
    const apiUrl = 'http://172.21.48.71:3001/api';
    console.log(`API地址: ${apiUrl}`);
    
    // 1. 测试健康检查
    console.log('\n1. 测试健康检查...');
    const healthResponse = await axios.get(`${apiUrl.replace('/api', '')}/health`);
    console.log('健康检查:', healthResponse.data);
    
    // 2. 测试统计API
    console.log('\n2. 测试统计API...');
    const statsResponse = await axios.get(`${apiUrl}/stats`);
    console.log('统计数据:', statsResponse.data);
    
    // 3. 测试登录API
    console.log('\n3. 测试登录API...');
    const loginData = {
      username: 'admin',
      password: 'admin123456'
    };
    
    console.log('登录数据:', loginData);
    
    try {
      const loginResponse = await axios.post(`${apiUrl}/auth/login`, loginData);
      console.log('✅ 登录成功:', {
        status: loginResponse.status,
        data: loginResponse.data
      });
    } catch (loginError) {
      console.log('❌ 登录失败:');
      console.log('状态码:', loginError.response?.status);
      console.log('错误信息:', loginError.response?.data);
      console.log('完整错误:', loginError.message);
    }
    
    // 4. 测试种子列表API
    console.log('\n4. 测试种子列表API...');
    try {
      const torrentsResponse = await axios.get(`${apiUrl}/torrents`);
      console.log('种子列表:', {
        count: torrentsResponse.data.torrents?.length || 0,
        pagination: torrentsResponse.data.pagination
      });
    } catch (torrentsError) {
      console.log('种子列表获取失败:', torrentsError.response?.data || torrentsError.message);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testLogin();

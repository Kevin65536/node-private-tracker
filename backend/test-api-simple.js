require('dotenv').config();
const axios = require('axios');

async function testAPI() {
  try {
    // 先登录admin
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123456'
    });
    
    const token = loginResponse.data.token;
    console.log('admin登录成功，获取token');
    
    // 测试passkey接口
    try {
      const passkeyResponse = await axios.get('http://localhost:3001/api/users/passkey', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('passkey接口成功:', passkeyResponse.data);
    } catch (error) {
      console.error('passkey接口失败:', error.response?.status, error.response?.data || error.message);
    }
    
    // 测试种子列表接口
    try {
      const torrentsResponse = await axios.get('http://localhost:3001/api/torrents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('种子列表接口成功，种子数量:', torrentsResponse.data.torrents?.length || 0);
      if (torrentsResponse.data.torrents?.length > 0) {
        console.log('第一个种子:', torrentsResponse.data.torrents[0]);
      }
    } catch (error) {
      console.error('种子列表接口失败:', error.response?.status, error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testAPI();

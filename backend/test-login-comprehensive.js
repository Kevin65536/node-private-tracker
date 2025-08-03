// 测试登录和用户数据
const axios = require('axios');

const API_BASE = 'http://172.21.48.71:3001/api';

async function testLoginAndData() {
  try {
    console.log('🧪 测试PT站登录和数据功能...');
    console.log('API地址:', API_BASE);
    
    // 1. 健康检查
    console.log('\n1. ❤️ 健康检查:');
    const health = await axios.get('http://172.21.48.71:3001/health');
    console.log('✅ 服务状态:', health.data.status);
    
    // 2. 测试统计API（无需登录）
    console.log('\n2. 📊 统计数据:');
    const stats = await axios.get(`${API_BASE}/stats`);
    console.log('✅ 统计结果:', stats.data);
    
    // 3. 测试用户登录
    console.log('\n3. 🔐 用户登录测试:');
    
    const loginData = {
      username: 'admin',
      password: 'admin123456'
    };
    
    console.log('尝试登录:', loginData.username);
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    
    if (loginResponse.status === 200) {
      console.log('✅ 登录成功!');
      console.log('用户信息:', loginResponse.data.user);
      console.log('JWT Token:', loginResponse.data.token ? '已获取' : '未获取');
      
      // 4. 使用token测试认证API
      console.log('\n4. 🔑 认证API测试:');
      const token = loginResponse.data.token;
      
      const authHeaders = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // 测试用户资料
      try {
        const profile = await axios.get(`${API_BASE}/users/profile`, authHeaders);
        console.log('✅ 用户资料获取成功:', profile.data.username);
      } catch (error) {
        console.log('❌ 用户资料获取失败:', error.response?.status, error.response?.data?.message);
      }
      
      // 测试种子列表
      try {
        const torrents = await axios.get(`${API_BASE}/torrents`, authHeaders);
        console.log('✅ 种子列表获取成功:', torrents.data.torrents?.length, '个种子');
      } catch (error) {
        console.log('❌ 种子列表获取失败:', error.response?.status, error.response?.data?.message);
      }
      
    } else {
      console.log('❌ 登录失败:', loginResponse.status);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API错误:', error.response.status, error.response.data);
    } else {
      console.log('❌ 网络错误:', error.message);
    }
  }
}

// 5. 测试不同用户的登录
async function testMultipleUsers() {
  console.log('\n5. 👥 测试多用户登录:');
  
  const testUsers = [
    { username: 'admin', password: 'admin123456' },
    { username: 'admin', password: 'admin' },
    { username: 'testuser1', password: 'password123' },
    { username: 'user1', password: 'password' }
  ];
  
  for (const user of testUsers) {
    try {
      console.log(`测试用户: ${user.username}`);
      const response = await axios.post(`${API_BASE}/auth/login`, user);
      console.log(`✅ ${user.username} 登录成功`);
    } catch (error) {
      console.log(`❌ ${user.username} 登录失败:`, error.response?.status, error.response?.data?.message);
    }
  }
}

async function runAllTests() {
  await testLoginAndData();
  await testMultipleUsers();
}

runAllTests();

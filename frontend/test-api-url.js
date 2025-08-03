// 测试前端API URL获取
const path = require('path');

// 模拟React环境变量
process.env.REACT_APP_API_URL = 'http://172.21.48.71:3001/api';
process.env.NODE_ENV = 'development';

// 模拟浏览器环境
global.window = {
  location: {
    hostname: '172.21.48.71',
    origin: 'http://172.21.48.71:3000'
  }
};

// 模拟console
global.console = console;

// 测试网络配置
console.log('=== 测试前端API URL配置 ===');
console.log('环境变量 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// 手动执行networkConfig逻辑
function testGetApiBaseUrl() {
  const envUrl = process.env.REACT_APP_API_URL;
  console.log('envUrl:', envUrl);
  console.log('包含localhost?', envUrl && envUrl.includes('localhost'));
  console.log('包含127.0.0.1?', envUrl && envUrl.includes('127.0.0.1'));
  
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    console.log('✅ 应该使用环境变量URL:', envUrl);
    return envUrl;
  } else {
    console.log('❌ 不使用环境变量，将使用智能构建');
    return `http://${window.location.hostname}:3001/api`;
  }
}

const resultUrl = testGetApiBaseUrl();
console.log('最终API URL:', resultUrl);

// 测试API连接
async function testApiConnection() {
  const fetch = require('node-fetch');
  
  try {
    console.log('\n=== 测试API连接 ===');
    const response = await fetch(resultUrl.replace('/api', '') + '/health');
    const data = await response.text();
    console.log('✅ API连接测试成功:', response.status, data);
  } catch (error) {
    console.log('❌ API连接测试失败:', error.message);
  }
}

testApiConnection();

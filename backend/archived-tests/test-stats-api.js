require('dotenv').config();
const axios = require('axios');

async function testStatsAPI() {
  try {
    console.log('🔄 测试 /api/stats 端点...');
    
    const response = await axios.get('http://localhost:3001/api/stats');
    console.log('✅ API 响应成功');
    console.log('📊 统计数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 无法连接到服务器，请先启动后端服务器');
      console.log('💡 运行: npm start');
    } else {
      console.error('❌ API 测试失败:', error.message);
      if (error.response) {
        console.log('状态码:', error.response.status);
        console.log('响应数据:', error.response.data);
      }
    }
  }
}

testStatsAPI();

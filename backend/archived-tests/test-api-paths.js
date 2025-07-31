const axios = require('axios');

async function testCorrectAPI() {
  try {
    console.log('🔄 测试修复后的API路径...');
    
    // 测试正确的路径
    const response = await axios.get('http://localhost:3001/api/stats');
    console.log('✅ 正确路径 /api/stats 响应成功');
    console.log('📊 统计数据:', JSON.stringify(response.data, null, 2));
    
    // 测试错误的路径（之前的问题）
    try {
      await axios.get('http://localhost:3001/api/api/stats');
      console.log('❌ 错误路径也返回了响应（这不应该发生）');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ 错误路径 /api/api/stats 正确返回404');
      } else {
        console.log('⚠️ 错误路径返回了其他错误:', error.message);
      }
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 无法连接到服务器，请先启动后端服务器');
      console.log('💡 运行: npm start');
    } else {
      console.error('❌ API 测试失败:', error.message);
    }
  }
}

testCorrectAPI();

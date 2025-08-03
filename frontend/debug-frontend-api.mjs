// 模拟前端API调用调试
import axios from 'axios';

// 模拟前端的axios配置
const API_BASE_URL = 'http://172.21.48.71:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 添加请求拦截器进行调试
api.interceptors.request.use(
  (config) => {
    console.log('🚀 发送请求:', config.method?.toUpperCase(), config.url);
    console.log('📍 完整URL:', API_BASE_URL + config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器进行调试
api.interceptors.response.use(
  (response) => {
    console.log('✅ 请求成功:', response.status, response.statusText);
    return response;
  },
  (error) => {
    console.log('❌ 请求失败:', error.message);
    if (error.response) {
      console.log('错误状态:', error.response.status);
      console.log('错误数据:', error.response.data);
    }
    return Promise.reject(error);
  }
);

async function testAllAPIs() {
  console.log('=== 测试前端API调用 ===');
  console.log('基础URL:', API_BASE_URL);
  
  try {
    // 1. 测试健康检查（不在/api前缀下）
    console.log('\n1. 测试健康检查:');
    const healthResponse = await axios.get('http://172.21.48.71:3001/health');
    console.log('健康检查结果:', healthResponse.data);
    
    // 2. 测试统计API
    console.log('\n2. 测试统计API:');
    const statsResponse = await api.get('/stats');
    console.log('统计数据:', statsResponse.data);
    
    // 3. 测试种子API
    console.log('\n3. 测试种子API:');
    const torrentsResponse = await api.get('/torrents?limit=10&sort=created_at&order=DESC');
    console.log('种子数据:', torrentsResponse.data.torrents?.length, '个种子');
    
    // 4. 测试分类API
    console.log('\n4. 测试分类API:');
    const categoriesResponse = await api.get('/torrents/categories/list');
    console.log('分类数据:', categoriesResponse.data.categories?.length, '个分类');
    
    console.log('\n✅ 所有API测试完成');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
  }
}

testAllAPIs();

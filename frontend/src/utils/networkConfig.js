/**
 * 前端网络配置工具
 * 用于自动检测和配置API地址
 */

/**
 * 获取当前网络环境信息
 */
export function getNetworkInfo() {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  const currentUrl = window.location.href;
  
  return {
    hostname,
    port: port || (protocol === 'https:' ? '443' : '80'),
    protocol,
    currentUrl,
    isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1',
    isPrivateIP: isPrivateIP(hostname)
  };
}

/**
 * 判断是否为私有IP地址
 */
function isPrivateIP(ip) {
  if (ip === 'localhost' || ip.startsWith('127.')) return true;
  
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(part => isNaN(part))) {
    return false; // 不是有效的IPv4地址
  }
  
  return (
    // 10.0.0.0/8
    (parts[0] === 10) ||
    // 172.16.0.0/12
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    // 192.168.0.0/16
    (parts[0] === 192 && parts[1] === 168)
  );
}

/**
 * 智能获取API基础URL
 */
export function getApiBaseUrl() {
  // 1. 优先使用环境变量（如果设置了非localhost的URL）
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    console.log('🔗 使用环境变量API URL:', envUrl);
    return envUrl;
  }
  
  // 2. 根据当前访问地址智能构建API URL
  const networkInfo = getNetworkInfo();
  console.log('🌐 当前网络信息:', networkInfo);
  
  let apiUrl;
  
  if (networkInfo.isLocalhost) {
    // 本地开发环境
    apiUrl = 'http://localhost:3001/api';
    console.log('🏠 检测到本地环境，使用:', apiUrl);
  } else {
    // 局域网或其他环境，使用当前hostname
    apiUrl = `http://${networkInfo.hostname}:3001/api`;
    console.log('🌐 检测到网络环境，自动构建:', apiUrl);
  }
  
  return apiUrl;
}

/**
 * 测试API连接
 */
export async function testApiConnection(baseUrl, timeout = 5000) {
  try {
    const testUrl = baseUrl.replace('/api', '/health');
    console.log('🔍 测试连接:', testUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API连接测试成功:', data);
      return { success: true, data };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.warn('❌ API连接测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 自动发现可用的API地址
 */
export async function discoverApiUrl() {
  const networkInfo = getNetworkInfo();
  const candidates = [];
  
  // 构建候选URL列表
  if (networkInfo.isLocalhost) {
    candidates.push('http://localhost:3001/api');
    candidates.push('http://127.0.0.1:3001/api');
  } else {
    candidates.push(`http://${networkInfo.hostname}:3001/api`);
    candidates.push('http://localhost:3001/api'); // 备选
  }
  
  // 如果有环境变量，也加入测试
  if (process.env.REACT_APP_API_URL) {
    candidates.unshift(process.env.REACT_APP_API_URL);
  }
  
  console.log('🔍 开始API自动发现，候选地址:', candidates);
  
  // 逐个测试候选地址
  for (const candidate of candidates) {
    const result = await testApiConnection(candidate, 3000);
    if (result.success) {
      console.log('🎯 发现可用API地址:', candidate);
      return candidate;
    }
  }
  
  // 如果所有候选都失败，返回默认地址
  const fallback = candidates[0];
  console.warn('⚠️ 未找到可用API地址，使用默认:', fallback);
  return fallback;
}

/**
 * 创建一个带有网络状态监控的API配置
 */
export function createNetworkAwareConfig() {
  const config = {
    apiUrl: null,
    networkInfo: null,
    lastCheck: null,
    status: 'unknown' // unknown, connecting, connected, error
  };
  
  // 初始化配置
  const init = async () => {
    config.status = 'connecting';
    config.networkInfo = getNetworkInfo();
    config.apiUrl = await discoverApiUrl();
    config.lastCheck = new Date();
    config.status = 'connected';
    
    return config;
  };
  
  // 重新检查连接
  const recheck = async () => {
    console.log('🔄 重新检查API连接...');
    return await init();
  };
  
  return {
    init,
    recheck,
    getConfig: () => ({ ...config }),
    getApiUrl: () => config.apiUrl,
    getStatus: () => config.status
  };
}

/**
 * 显示网络配置信息（用于调试）
 */
export function showNetworkConfig() {
  const networkInfo = getNetworkInfo();
  const apiUrl = getApiBaseUrl();
  
  console.group('🌐 前端网络配置信息');
  console.log('当前访问地址:', networkInfo.currentUrl);
  console.log('主机名:', networkInfo.hostname);
  console.log('端口:', networkInfo.port);
  console.log('协议:', networkInfo.protocol);
  console.log('是否本地:', networkInfo.isLocalhost);
  console.log('是否私有IP:', networkInfo.isPrivateIP);
  console.log('API地址:', apiUrl);
  console.log('环境变量REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.groupEnd();
  
  return { networkInfo, apiUrl };
}

export default {
  getNetworkInfo,
  getApiBaseUrl,
  testApiConnection,
  discoverApiUrl,
  createNetworkAwareConfig,
  showNetworkConfig
};

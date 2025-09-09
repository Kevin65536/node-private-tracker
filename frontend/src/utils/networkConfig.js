/**
 * 前端网络配置工具
 * 用于自动检测和配置API地址
 * 更新时间：2025-08-28 20:47 - 强制重新编译
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
    return envUrl;
  }
  
  // 2. 根据当前访问地址智能构建API URL
  const networkInfo = getNetworkInfo();
  
  let apiUrl;
  
  if (networkInfo.isLocalhost) {
    // 检查是否通过nginx代理访问（端口80或443，或者没有指定端口）
    const currentPort = window.location.port;
    const isNginxPort = !currentPort || currentPort === '80' || currentPort === '443';
    
    if (isNginxPort) {
      // 通过nginx代理访问，使用相对路径
      apiUrl = '/api';  // 使用相对路径，让nginx处理代理
    } else {
      // 直接访问前端开发服务器
      apiUrl = 'http://localhost:3001/api';
    }
  } else {
    // 局域网或其他环境
    const currentPort = window.location.port;
    const isNginxPort = !currentPort || currentPort === '80' || currentPort === '443';
    
    if (isNginxPort) {
      // 可能通过nginx代理
      apiUrl = '/api';  // 使用相对路径，让nginx处理代理
    } else {
      // 直接访问，使用3001端口
      apiUrl = `http://${networkInfo.hostname}:3001/api`;
    }
  }
  
  return apiUrl;
}

/**
 * 测试API连接
 */
export async function testApiConnection(baseUrl, timeout = 5000) {
  try {
    const testUrl = baseUrl.replace('/api', '/health');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
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
    const currentPort = window.location.port;
    const isNginxPort = !currentPort || currentPort === '80' || currentPort === '443';
    
    if (isNginxPort) {
      candidates.push('/api'); // nginx代理 - 使用相对路径
      candidates.push('http://localhost:3001/api'); // 直连备选
    } else {
      candidates.push('http://localhost:3001/api'); // 开发服务器
      candidates.push('http://127.0.0.1:3001/api');
      candidates.push(`${window.location.protocol}//${window.location.hostname}/api`); // 代理备选
    }
  } else {
    // 网络环境，优先尝试代理
    const currentPort = window.location.port;
    const isNginxPort = !currentPort || currentPort === '80' || currentPort === '443';
    
    if (isNginxPort) {
      candidates.push('/api'); // 代理 - 使用相对路径
      candidates.push(`http://${networkInfo.hostname}:3001/api`); // 直连备选
    } else {
      candidates.push(`http://${networkInfo.hostname}:3001/api`); // 直连
      candidates.push(`${window.location.protocol}//${window.location.hostname}/api`); // 代理备选
    }
  }
  
  // 如果有环境变量，也加入测试
  if (process.env.REACT_APP_API_URL) {
    candidates.unshift(process.env.REACT_APP_API_URL);
  }
  
  // 逐个测试候选地址
  for (const candidate of candidates) {
    const result = await testApiConnection(candidate, 3000);
    if (result.success) {
      return candidate;
    }
  }
  
  // 如果所有候选都失败，返回默认地址
  const fallback = candidates[0];
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

export default {
  getNetworkInfo,
  getApiBaseUrl,
  testApiConnection,
  discoverApiUrl,
  createNetworkAwareConfig
};

const os = require('os');

/**
 * 获取本机最佳的IP地址
 * 优先级：局域网地址 > 其他IPv4地址 > 回环地址
 */
function getBestLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  
  // 遍历所有网络接口
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过非IPv4和内部地址
      if (iface.family !== 'IPv4' || iface.internal) {
        continue;
      }
      
      const ip = iface.address;
      
      // 分类IP地址
      if (isPrivateIP(ip)) {
        candidates.push({
          ip,
          interface: name,
          priority: 1, // 最高优先级：私有网络地址
          type: 'private'
        });
      } else if (!isLoopback(ip)) {
        candidates.push({
          ip,
          interface: name,
          priority: 2, // 中等优先级：公网地址
          type: 'public'
        });
      }
    }
  }
  
  // 如果没有找到合适的地址，使用localhost
  if (candidates.length === 0) {
    return {
      ip: '127.0.0.1',
      interface: 'loopback',
      priority: 3,
      type: 'loopback'
    };
  }
  
  // 按优先级排序，选择最佳地址
  candidates.sort((a, b) => a.priority - b.priority);
  return candidates[0];
}

/**
 * 判断是否为私有IP地址
 */
function isPrivateIP(ip) {
  const parts = ip.split('.').map(Number);
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
 * 判断是否为回环地址
 */
function isLoopback(ip) {
  return ip.startsWith('127.');
}

/**
 * 获取所有可用的IP地址信息
 */
function getAllIPs() {
  const interfaces = os.networkInterfaces();
  const result = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4') {
        result.push({
          interface: name,
          ip: iface.address,
          internal: iface.internal,
          type: iface.internal ? 'loopback' : 
                isPrivateIP(iface.address) ? 'private' : 'public'
        });
      }
    }
  }
  
  return result;
}

/**
 * 构建完整的Announce URL
 */
function buildDynamicAnnounceUrl(port = 3001, customIP = null) {
  let ip;
  let source;
  
  if (customIP) {
    ip = customIP;
    source = 'manual';
  } else {
    const best = getBestLocalIP();
    ip = best.ip;
    source = `auto-detected (${best.interface})`;
  }
  
  const url = `http://${ip}:${port}`;
  
  return {
    url,
    ip,
    port,
    source
  };
}

/**
 * 智能设置环境变量中的ANNOUNCE_URL
 */
function setupAnnounceUrl(port = 3001) {
  // 检查是否有手动设置的URL
  const manualUrl = process.env.ANNOUNCE_URL;
  
  // 如果手动设置了URL且不是localhost，则保持不变
  if (manualUrl && !manualUrl.includes('localhost') && !manualUrl.includes('127.0.0.1')) {
    console.log('🔗 使用手动配置的 Announce URL:', manualUrl);
    return {
      url: manualUrl,
      source: 'manual (.env)',
      ip: extractIPFromUrl(manualUrl)
    };
  }
  
  // 自动检测IP地址
  const dynamic = buildDynamicAnnounceUrl(port);
  
  // 更新环境变量
  process.env.ANNOUNCE_URL = dynamic.url;
  
  console.log('🔗 自动设置 Announce URL:', dynamic.url);
  console.log('   IP来源:', dynamic.source);
  console.log('   网络类型:', isPrivateIP(dynamic.ip) ? '局域网' : '公网');
  
  return dynamic;
}

/**
 * 从URL中提取IP地址
 */
function extractIPFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

module.exports = {
  getBestLocalIP,
  getAllIPs,
  buildDynamicAnnounceUrl,
  setupAnnounceUrl,
  isPrivateIP,
  isLoopback
};

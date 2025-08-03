#!/usr/bin/env node

/**
 * 前端启动配置脚本
 * 自动配置前端的API地址
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 获取网络接口信息
function getNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const result = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        result.push({
          name,
          address: iface.address,
          type: isPrivateIP(iface.address) ? 'private' : 'public'
        });
      }
    }
  }
  
  return result;
}

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

function getBestIP() {
  const interfaces = getNetworkInterfaces();
  
  // 优先选择私有网络地址
  const privateInterfaces = interfaces.filter(iface => iface.type === 'private');
  if (privateInterfaces.length > 0) {
    return privateInterfaces[0].address;
  }
  
  // 如果没有私有地址，选择第一个可用地址
  if (interfaces.length > 0) {
    return interfaces[0].address;
  }
  
  return 'localhost';
}

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  ip: null,
  port: 3001,
  show: false,
  help: false
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--ip':
      options.ip = args[++i];
      break;
    case '--port':
      options.port = parseInt(args[++i]);
      break;
    case '--show':
      options.show = true;
      break;
    case '-h':
    case '--help':
      options.help = true;
      break;
  }
}

if (options.help) {
  console.log(`
🌐 LZU PT站前端启动配置

用法：
  node frontend-config.js [选项]

选项：
  --ip <地址>     手动指定后端API的IP地址
  --port <端口>   指定后端端口 (默认: 3001)
  --show         只显示配置信息，不修改文件
  -h, --help     显示帮助信息

示例：
  node frontend-config.js                 # 自动检测配置
  node frontend-config.js --ip 192.168.1.100  # 手动指定IP
  node frontend-config.js --show          # 查看当前配置
`);
  process.exit(0);
}

function main() {
  console.log('🌐 LZU PT站前端配置工具\n');
  
  // 显示网络信息
  const interfaces = getNetworkInterfaces();
  console.log('📋 检测到的网络接口:');
  interfaces.forEach(iface => {
    const typeIcon = iface.type === 'private' ? '🏠' : '🌐';
    console.log(`   ${typeIcon} ${iface.name}: ${iface.address} (${iface.type})`);
  });
  
  // 确定IP地址
  const ip = options.ip || getBestIP();
  const apiUrl = `http://${ip}:${options.port}/api`;
  
  console.log(`\n🎯 推荐配置:`);
  console.log(`   后端API地址: ${apiUrl}`);
  console.log(`   前端访问地址: http://${ip}:3000`);
  
  if (options.show) {
    console.log('\n✅ 配置信息显示完成');
    return;
  }
  
  // 读取现有的.env文件
  const envPath = path.join(__dirname, 'src', '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // 更新或添加REACT_APP_API_URL
  const apiUrlLine = `REACT_APP_API_URL=${apiUrl}`;
  
  if (envContent.includes('REACT_APP_API_URL=')) {
    // 替换现有配置
    envContent = envContent.replace(
      /^#?\s*REACT_APP_API_URL=.*$/m,
      apiUrlLine
    );
  } else {
    // 添加新配置
    envContent = `${apiUrlLine}\n${envContent}`;
  }
  
  // 写入.env文件
  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ 配置已更新: ${envPath}`);
    console.log(`   REACT_APP_API_URL=${apiUrl}`);
    
    console.log(`\n🚀 现在可以启动前端:`);
    console.log(`   npm start`);
    console.log(`\n📍 访问地址:`);
    console.log(`   http://${ip}:3000`);
    
  } catch (error) {
    console.error('❌ 配置文件写入失败:', error.message);
    process.exit(1);
  }
}

main();

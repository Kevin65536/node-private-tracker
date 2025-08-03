#!/usr/bin/env node

/**
 * PT站启动脚本
 * 支持自动IP检测和手动配置
 */

require('dotenv').config();
const { getAllIPs, setupAnnounceUrl } = require('./utils/network');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  ip: null,
  port: process.env.PORT || 3001,
  verbose: false,
  help: false
};

// 简单的参数解析
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--ip':
      options.ip = args[++i];
      break;
    case '--port':
      options.port = parseInt(args[++i]);
      break;
    case '-v':
    case '--verbose':
      options.verbose = true;
      break;
    case '-h':
    case '--help':
      options.help = true;
      break;
  }
}

// 显示帮助信息
if (options.help) {
  console.log(`
🚀 LZU PT站启动脚本

用法：
  node start.js [选项]

选项：
  --ip <地址>      手动指定IP地址
  --port <端口>    指定端口 (默认: ${process.env.PORT || 3001})
  -v, --verbose   显示详细信息
  -h, --help      显示帮助信息

示例：
  node start.js                    # 自动检测IP
  node start.js --ip 192.168.1.100 # 手动指定IP
  node start.js --port 3002        # 指定端口
  node start.js -v                 # 详细模式

环境配置：
  开发环境：自动检测IP地址 (推荐)
  生产环境：设置 ANNOUNCE_URL 环境变量
  测试环境：使用 localhost
`);
  process.exit(0);
}

async function start() {
  console.log('🌐 LZU PT站启动中...\n');
  
  // 显示网络信息
  if (options.verbose) {
    console.log('📋 检测到的网络接口:');
    const allIPs = getAllIPs();
    allIPs.forEach(ip => {
      const typeIcon = ip.type === 'private' ? '🏠' : 
                      ip.type === 'public' ? '🌐' : '🔄';
      console.log(`   ${typeIcon} ${ip.interface}: ${ip.ip} (${ip.type})`);
    });
    console.log('');
  }
  
  // 设置IP地址
  if (options.ip) {
    // 手动指定IP
    process.env.ANNOUNCE_URL = `http://${options.ip}:${options.port}`;
    console.log(`🔗 使用手动指定的IP: ${options.ip}`);
    console.log(`   Announce URL: ${process.env.ANNOUNCE_URL}`);
  } else {
    // 自动检测IP
    const networkConfig = setupAnnounceUrl(options.port);
    console.log(`🔍 自动检测完成`);
  }
  
  // 设置端口
  process.env.PORT = options.port.toString();
  
  console.log('');
  
  // 启动主服务器
  require('./server.js');
}

// 捕获启动错误
start().catch(error => {
  console.error('❌ 启动失败:', error.message);
  process.exit(1);
});

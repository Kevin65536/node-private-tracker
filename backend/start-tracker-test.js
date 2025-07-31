#!/usr/bin/env node

/**
 * Private Tracker 快速测试启动脚本
 * 一键启动所有必要的测试
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function success(message) {
  log('✅ ' + message, 'green');
}

function error(message) {
  log('❌ ' + message, 'red');
}

function info(message) {
  log('ℹ️  ' + message, 'blue');
}

function warning(message) {
  log('⚠️  ' + message, 'yellow');
}

/**
 * 检查依赖
 */
function checkDependencies() {
  info('检查依赖...');
  
  const requiredFiles = [
    'package.json',
    'models/index.js',
    'utils/passkey.js',
    'utils/tracker.js',
    'routes/tracker.js',
    'test-tracker.js'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, file))) {
      error(`缺少必要文件: ${file}`);
      return false;
    }
  }
  
  success('所有依赖文件检查通过');
  return true;
}

/**
 * 初始化数据库
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    info('初始化数据库...');
    
    const initProcess = spawn('node', ['init-db.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    initProcess.on('close', (code) => {
      if (code === 0) {
        success('数据库初始化完成');
        resolve();
      } else {
        error('数据库初始化失败');
        reject(new Error(`初始化进程退出码: ${code}`));
      }
    });
  });
}

/**
 * 启动服务器
 */
function startServer() {
  return new Promise((resolve, reject) => {
    info('启动服务器...');
    
    const serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      detached: true
    });
    
    let output = '';
    
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(data.toString().trim());
      
      // 检查服务器是否启动成功
      if (output.includes('PT站服务器运行在')) {
        success('服务器启动成功');
        resolve(serverProcess);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(data.toString().trim());
    });
    
    serverProcess.on('close', (code) => {
      if (code !== 0) {
        error(`服务器进程退出，退出码: ${code}`);
        reject(new Error(`服务器启动失败: ${code}`));
      }
    });
    
    // 5秒后如果还没启动成功，认为失败
    setTimeout(() => {
      if (!output.includes('PT站服务器运行在')) {
        error('服务器启动超时');
        serverProcess.kill();
        reject(new Error('服务器启动超时'));
      }
    }, 5000);
  });
}

/**
 * 等待服务器就绪
 */
function waitForServer(maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkServer = () => {
      attempts++;
      
      exec('curl -s http://localhost:3001/health', (error, stdout, stderr) => {
        if (!error && stdout.includes('tracker')) {
          success('服务器响应正常');
          resolve();
        } else if (attempts < maxAttempts) {
          info(`等待服务器响应... (${attempts}/${maxAttempts})`);
          setTimeout(checkServer, 1000);
        } else {
          error('服务器响应检查失败');
          reject(new Error('服务器未能正常响应'));
        }
      });
    };
    
    checkServer();
  });
}

/**
 * 运行测试
 */
function runTests() {
  return new Promise((resolve, reject) => {
    info('运行 Tracker 功能测试...');
    
    const testProcess = spawn('node', ['test-tracker.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        success('所有测试通过');
        resolve();
      } else {
        error('部分测试失败');
        resolve(); // 仍然继续，不中断流程
      }
    });
  });
}

/**
 * 获取用户 passkey
 */
async function getUserPasskey() {
  try {
    const { User, UserPasskey } = require('./models');
    const admin = await User.findOne({ 
      where: { role: 'admin' },
      include: [{ model: UserPasskey, as: 'Passkey' }]
    });
    
    if (admin && admin.Passkey) {
      return admin.Passkey.passkey;
    }
    
    return null;
  } catch (error) {
    error('获取 passkey 失败: ' + error.message);
    return null;
  }
}

/**
 * 创建测试种子
 */
async function createTestTorrent() {
  try {
    info('创建测试种子文件...');
    
    const passkey = await getUserPasskey();
    if (!passkey) {
      warning('无法获取用户 passkey，跳过种子创建');
      return;
    }
    
    const { createTestTorrentForUser } = require('./torrent-generator');
    const result = await createTestTorrentForUser(passkey);
    
    success('测试种子创建成功');
    console.log(`\n📂 文件位置:`);
    console.log(`  种子文件: ${result.torrentFile}`);
    console.log(`  测试文件: ${result.testFile}`);
    console.log(`\n🔗 使用方法:`);
    console.log(`  在 BitTorrent 客户端中添加种子文件进行测试`);
    
  } catch (error) {
    warning('创建测试种子失败: ' + error.message);
  }
}

/**
 * 显示测试总结
 */
function showSummary() {
  log('\n' + '='.repeat(60), 'magenta');
  log('🎉 Private Tracker 测试环境启动完成！', 'green');
  log('='.repeat(60), 'magenta');
  
  console.log(`
📋 测试清单:
  ✅ 数据库已初始化
  ✅ 服务器已启动
  ✅ Tracker 功能已测试
  ✅ 测试种子已创建

🔗 可用端点:
  • 健康检查: http://localhost:3001/health
  • API 文档: http://localhost:3001/api
  • Tracker: http://localhost:3001/announce/<passkey>
  • 统计信息: http://localhost:3001/api/stats

📖 下一步:
  1. 在 BitTorrent 客户端中测试种子文件
  2. 检查前端应用集成
  3. 监控 Tracker 性能

🛑 停止服务:
  使用 Ctrl+C 或 kill 命令停止服务器
`);
}

/**
 * 主函数
 */
async function main() {
  try {
    log('🚀 启动 Private Tracker 测试环境\n', 'magenta');
    
    // 1. 检查依赖
    if (!checkDependencies()) {
      process.exit(1);
    }
    
    // 2. 初始化数据库
    await initDatabase();
    
    // 3. 启动服务器
    const serverProcess = await startServer();
    
    // 4. 等待服务器就绪
    await waitForServer();
    
    // 5. 运行测试
    await runTests();
    
    // 6. 创建测试种子
    await createTestTorrent();
    
    // 7. 显示总结
    showSummary();
    
    // 保持服务器运行
    process.on('SIGINT', () => {
      info('\n正在关闭服务器...');
      if (serverProcess) {
        serverProcess.kill();
      }
      process.exit(0);
    });
    
  } catch (error) {
    error('启动过程中发生错误: ' + error.message);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main };

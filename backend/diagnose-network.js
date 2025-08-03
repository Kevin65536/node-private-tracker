require('dotenv').config();
const axios = require('axios');
const { exec } = require('child_process');
const { getBestLocalIP, getAllIPs } = require('./backend/utils/network');

/**
 * 网络连接诊断工具
 */
async function diagnoseNetworkIssue() {
  console.log('🔍 PT站网络连接诊断工具\n');
  
  const results = [];
  
  function logResult(test, status, message) {
    const icon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
    const line = `${icon} ${test}: ${message}`;
    console.log(line);
    results.push({ test, status, message });
  }

  // 1. 系统信息检查
  console.log('📋 1. 系统信息检查');
  
  const currentIP = getBestLocalIP();
  logResult('本机IP检测', 'pass', `${currentIP.ip} (${currentIP.type})`);
  
  const allIPs = getAllIPs();
  console.log('   所有网络接口:');
  allIPs.forEach(ip => {
    const typeIcon = ip.type === 'private' ? '🏠' : ip.type === 'public' ? '🌐' : '🔄';
    console.log(`     ${typeIcon} ${ip.interface}: ${ip.ip}`);
  });

  // 2. 环境配置检查
  console.log('\n🔧 2. 环境配置检查');
  
  const announceUrl = process.env.ANNOUNCE_URL;
  if (announceUrl) {
    logResult('ANNOUNCE_URL配置', 'pass', announceUrl);
    
    const configIP = announceUrl.match(/http:\/\/([^:]+):/)?.[1];
    if (configIP === currentIP.ip) {
      logResult('IP地址匹配', 'pass', '配置IP与当前IP一致');
    } else {
      logResult('IP地址匹配', 'warn', `配置IP(${configIP}) != 当前IP(${currentIP.ip})`);
    }
  } else {
    logResult('ANNOUNCE_URL配置', 'fail', '未配置');
  }

  // 3. 端口检查
  console.log('\n🌐 3. 端口监听检查');
  
  await checkPort(3000, 'Frontend');
  await checkPort(3001, 'Backend/API');

  // 4. 本地连接测试
  console.log('\n🔗 4. 本地连接测试');
  
  await testConnection('localhost', 3001, '本地API');
  await testConnection(currentIP.ip, 3001, '内网API');

  // 5. 防火墙检查
  console.log('\n🛡️ 5. 防火墙检查');
  
  await checkFirewallRules();

  // 6. 生成解决方案
  console.log('\n💡 6. 问题解决建议');
  
  const failedTests = results.filter(r => r.status === 'fail');
  const warnTests = results.filter(r => r.status === 'warn');
  
  if (failedTests.length === 0 && warnTests.length === 0) {
    console.log('🎉 所有检查通过！网络配置正常');
    console.log(`\n内网用户可以通过以下地址访问:`);
    console.log(`前端: http://${currentIP.ip}:3000`);
    console.log(`API: http://${currentIP.ip}:3001/health`);
  } else {
    console.log('🔧 发现问题，请按以下建议解决:');
    
    if (failedTests.some(t => t.test.includes('端口监听'))) {
      console.log('\n📌 服务未启动:');
      console.log('   请确保后端服务正在运行:');
      console.log('   cd backend && npm start');
    }
    
    if (failedTests.some(t => t.test.includes('防火墙'))) {
      console.log('\n📌 防火墙问题:');
      console.log('   请以管理员身份运行: setup-network.bat');
    }
    
    if (warnTests.some(t => t.test.includes('IP地址匹配'))) {
      console.log('\n📌 IP地址配置问题:');
      console.log('   请更新 .env 文件中的 ANNOUNCE_URL');
      console.log(`   设置为: ANNOUNCE_URL=http://${currentIP.ip}:3001`);
    }
    
    if (failedTests.some(t => t.test.includes('连接测试'))) {
      console.log('\n📌 网络连接问题:');
      console.log('   1. 检查防火墙设置');
      console.log('   2. 检查杀毒软件是否阻止');
      console.log('   3. 检查路由器客户端隔离设置');
      console.log('   4. 检查企业网络策略');
    }
  }

  // 辅助函数
  async function checkPort(port, service) {
    return new Promise((resolve) => {
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (stdout && stdout.includes(`0.0.0.0:${port}`) || stdout.includes(`:${port}`)) {
          logResult(`端口监听 ${port}`, 'pass', `${service} 正在监听`);
        } else {
          logResult(`端口监听 ${port}`, 'fail', `${service} 未监听`);
        }
        resolve();
      });
    });
  }

  async function testConnection(host, port, name) {
    try {
      const response = await axios.get(`http://${host}:${port}/health`, { 
        timeout: 3000 
      });
      logResult(`连接测试 ${name}`, 'pass', `HTTP ${response.status}`);
    } catch (error) {
      const message = error.code === 'ECONNREFUSED' ? '连接被拒绝' : 
                     error.code === 'ETIMEDOUT' ? '连接超时' :
                     error.message;
      logResult(`连接测试 ${name}`, 'fail', message);
    }
  }

  async function checkFirewallRules() {
    return new Promise((resolve) => {
      exec('netsh advfirewall firewall show rule name="PT-Site-Frontend"', (error, stdout) => {
        if (stdout && stdout.includes('PT-Site-Frontend')) {
          logResult('防火墙规则 3000', 'pass', '已配置');
        } else {
          logResult('防火墙规则 3000', 'fail', '未配置');
        }
        
        exec('netsh advfirewall firewall show rule name="PT-Site-Backend"', (error, stdout) => {
          if (stdout && stdout.includes('PT-Site-Backend')) {
            logResult('防火墙规则 3001', 'pass', '已配置');
          } else {
            logResult('防火墙规则 3001', 'fail', '未配置');
          }
          resolve();
        });
      });
    });
  }
}

// 如果直接运行
if (require.main === module) {
  diagnoseNetworkIssue().catch(console.error);
}

module.exports = { diagnoseNetworkIssue };

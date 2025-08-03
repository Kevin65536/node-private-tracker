require('dotenv').config();
const axios = require('axios');
const { getBestLocalIP } = require('./backend/utils/network');

/**
 * 部署后验证脚本
 * 验证PT站各项功能是否正常工作
 */
async function validateDeployment() {
  console.log('🔍 开始部署验证...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  function addTest(name, status, message, isWarning = false) {
    results.tests.push({ name, status, message, isWarning });
    if (status === 'pass') {
      results.passed++;
    } else if (isWarning) {
      results.warnings++;
    } else {
      results.failed++;
    }
  }

  // 1. 环境配置检查
  console.log('📋 1. 环境配置检查');
  
  const requiredEnvVars = [
    'NODE_ENV', 'PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
    'JWT_SECRET', 'ANNOUNCE_URL', 'FRONTEND_URL'
  ];
  
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      addTest(`环境变量 ${varName}`, 'pass', `✅ 已设置: ${varName === 'DB_PASSWORD' || varName === 'JWT_SECRET' ? '[隐藏]' : process.env[varName]}`);
    } else {
      addTest(`环境变量 ${varName}`, 'fail', `❌ 未设置`);
    }
  });

  // 检查IP地址配置
  const currentIP = getBestLocalIP().ip;
  const configuredAnnounceIP = process.env.ANNOUNCE_URL?.match(/http:\/\/([^:]+):/)?.[1];
  
  if (configuredAnnounceIP === currentIP) {
    addTest('IP地址配置', 'pass', `✅ ANNOUNCE_URL IP (${configuredAnnounceIP}) 与当前服务器IP一致`);
  } else {
    addTest('IP地址配置', 'fail', `❌ ANNOUNCE_URL IP (${configuredAnnounceIP}) 与当前服务器IP (${currentIP}) 不一致`);
  }

  // 2. 网络连接测试
  console.log('\n🌐 2. 网络连接测试');
  
  const baseUrl = process.env.ANNOUNCE_URL?.replace('3001', '3001') || `http://localhost:3001`;
  
  try {
    // 健康检查
    const healthResponse = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    if (healthResponse.status === 200) {
      addTest('健康检查接口', 'pass', '✅ API服务正常响应');
    } else {
      addTest('健康检查接口', 'fail', `❌ 响应状态码: ${healthResponse.status}`);
    }
  } catch (error) {
    addTest('健康检查接口', 'fail', `❌ 连接失败: ${error.message}`);
  }

  // 3. 数据库连接测试
  console.log('\n🗄️ 3. 数据库连接测试');
  
  try {
    const { sequelize } = require('./backend/models');
    await sequelize.authenticate();
    addTest('数据库连接', 'pass', '✅ 数据库连接成功');
    
    // 检查主要表是否存在
    const tables = ['Users', 'Torrents', 'UserPasskeys'];
    for (const tableName of tables) {
      try {
        const model = sequelize.models[tableName];
        if (model) {
          const count = await model.count();
          addTest(`数据表 ${tableName}`, 'pass', `✅ 表存在，记录数: ${count}`);
        } else {
          addTest(`数据表 ${tableName}`, 'fail', '❌ 表不存在');
        }
      } catch (error) {
        addTest(`数据表 ${tableName}`, 'fail', `❌ 查询失败: ${error.message}`);
      }
    }
  } catch (error) {
    addTest('数据库连接', 'fail', `❌ 连接失败: ${error.message}`);
  }

  // 4. 核心功能测试
  console.log('\n🔧 4. 核心功能测试');
  
  try {
    // 测试passkey生成
    const { getOrCreatePasskey } = require('./backend/utils/passkey');
    const testPasskey = await getOrCreatePasskey(1);
    if (testPasskey && testPasskey.length === 32) {
      addTest('Passkey生成', 'pass', '✅ Passkey生成功能正常');
    } else {
      addTest('Passkey生成', 'fail', '❌ Passkey生成异常');
    }
  } catch (error) {
    addTest('Passkey生成', 'fail', `❌ 功能错误: ${error.message}`);
  }

  try {
    // 测试种子列表API
    const torrentsResponse = await axios.get(`${baseUrl}/api/torrents`, { timeout: 5000 });
    if (torrentsResponse.status === 200) {
      addTest('种子列表API', 'pass', `✅ API正常，种子数量: ${torrentsResponse.data.torrents?.length || 0}`);
    } else {
      addTest('种子列表API', 'fail', `❌ 响应异常: ${torrentsResponse.status}`);
    }
  } catch (error) {
    addTest('种子列表API', 'fail', `❌ 请求失败: ${error.message}`);
  }

  // 5. 安全配置检查
  console.log('\n🔒 5. 安全配置检查');
  
  if (process.env.NODE_ENV === 'production') {
    addTest('生产环境模式', 'pass', '✅ 已设置为生产环境');
  } else {
    addTest('生产环境模式', 'fail', '❌ 未设置为生产环境', true);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
    addTest('JWT密钥强度', 'pass', '✅ JWT密钥长度充足');
  } else {
    addTest('JWT密钥强度', 'fail', '❌ JWT密钥过短或未设置');
  }

  if (process.env.DB_PASSWORD && process.env.DB_PASSWORD !== '请修改为您的密码') {
    addTest('数据库密码', 'pass', '✅ 数据库密码已设置');
  } else {
    addTest('数据库密码', 'fail', '❌ 数据库密码未修改');
  }

  // 6. 输出验证报告
  console.log('\n📊 验证报告');
  console.log('=' * 50);
  
  results.tests.forEach(test => {
    const icon = test.status === 'pass' ? '✅' : (test.isWarning ? '⚠️' : '❌');
    const status = test.status === 'pass' ? 'PASS' : (test.isWarning ? 'WARN' : 'FAIL');
    console.log(`${icon} [${status}] ${test.name}: ${test.message}`);
  });

  console.log('\n📈 总结');
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`❌ 失败: ${results.failed}`);
  console.log(`⚠️  警告: ${results.warnings}`);

  if (results.failed === 0) {
    console.log('\n🎉 所有关键测试通过！PT站已准备就绪！');
    
    console.log('\n🔗 访问链接:');
    console.log(`前端: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`API: ${process.env.ANNOUNCE_URL || 'http://localhost:3001'}/health`);
    console.log(`管理后台: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin`);
  } else {
    console.log('\n❌ 发现关键问题，请解决后重新验证');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  validateDeployment().catch(error => {
    console.error('❌ 验证过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = { validateDeployment };

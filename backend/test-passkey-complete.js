/**
 * 测试用户 Passkey 功能的完整脚本
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

/**
 * 用户登录
 */
async function loginUser(username, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username,
      password
    });
    return response.data;
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 注册新用户（如果需要）
 */
async function registerUser(username, email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      username,
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error('注册失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 获取用户 Passkey
 */
async function getUserPasskey(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/users/passkey`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取 Passkey 失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 重新生成 Passkey
 */
async function regeneratePasskey(token) {
  try {
    const response = await axios.post(`${BASE_URL}/api/users/passkey/regenerate`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('重新生成 Passkey 失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 主测试函数
 */
async function testPasskeyFlow() {
  console.log('🔥 PT站 Passkey 功能测试');
  console.log('=========================\n');

  // 测试数据 - 使用现有的有效用户
  const testUsers = [
    {
      username: 'admin',
      password: 'admin123456'
    },
    {
      username: 'testuser1',
      password: 'Testuser1'
    }
  ];

  const results = [];

  for (const userData of testUsers) {
    console.log(`\n🔍 处理用户: ${userData.username}`);
    console.log('─'.repeat(40));

    // 尝试登录
    let loginResult = await loginUser(userData.username, userData.password);
    
    // 对于现有用户，不需要注册步骤
    if (!loginResult) {
      console.log(`❌ 无法登录用户 ${userData.username}，请检查用户名和密码`);
      continue;
    }

    if (!loginResult || !loginResult.token) {
      console.log(`❌ 无法获取用户 ${userData.username} 的访问令牌`);
      continue;
    }

    console.log(`✅ 用户 ${userData.username} 登录成功`);
    console.log(`   用户ID: ${loginResult.user.id}`);
    console.log(`   角色: ${loginResult.user.role}`);

    // 获取 Passkey
    const passkeyData = await getUserPasskey(loginResult.token);
    if (!passkeyData) {
      console.log(`❌ 无法获取用户 ${userData.username} 的 Passkey`);
      continue;
    }

    console.log(`🔑 Passkey 信息:`);
    console.log(`   Passkey: ${passkeyData.passkey}`);
    console.log(`   Announce URL: ${passkeyData.announce_url}`);

    // 存储结果
    results.push({
      username: userData.username,
      user_id: loginResult.user.id,
      passkey: passkeyData.passkey,
      announce_url: passkeyData.announce_url,
      token: loginResult.token
    });

    // 测试重新生成 Passkey
    console.log(`\n🔄 测试重新生成 Passkey...`);
    const newPasskeyData = await regeneratePasskey(loginResult.token);
    if (newPasskeyData) {
      console.log(`✅ Passkey 重新生成成功:`);
      console.log(`   新 Passkey: ${newPasskeyData.passkey}`);
      console.log(`   新 Announce URL: ${newPasskeyData.announce_url}`);
      
      // 更新结果中的 passkey
      const result = results.find(r => r.username === userData.username);
      if (result) {
        result.passkey = newPasskeyData.passkey;
        result.announce_url = newPasskeyData.announce_url;
      }
    } else {
      console.log(`❌ Passkey 重新生成失败`);
    }
  }

  // 输出完整的测试结果
  console.log('\n\n🎉 测试完成！');
  console.log('============');
  
  if (results.length === 0) {
    console.log('❌ 没有成功获取任何用户的 Passkey');
    return;
  }

  console.log(`✅ 成功获取 ${results.length} 个用户的 Passkey:`);
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. 用户: ${result.username}`);
    console.log(`   Passkey: ${result.passkey}`);
    console.log(`   Announce URL: ${result.announce_url}`);
  });

  console.log('\n📋 qBittorrent 种子制作配置:');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ 🎯 种子制作步骤                                              │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│ 1. 选择要分享的文件或文件夹                                   │');
  console.log('│ 2. 在 "Tracker URL" 字段填入上述任一 URL                     │');
  console.log('│ 3. ✅ 勾选 "私有 torrent" 选项                               │');
  console.log('│ 4. ✅ 勾选 "完成后开始做种" 选项                             │');
  console.log('│ 5. ✅ 勾选 "优化对齐" 选项                                   │');
  console.log('│ 6. 设置分块大小为 "自动"                                     │');
  console.log('│ 7. ❌ 不要勾选 "忽略分享条件"                                │');
  console.log('└─────────────────────────────────────────────────────────────┘');

  console.log('\n🔄 两设备测试流程:');
  console.log('1. 设备A (制种者):');
  console.log(`   - 使用 ${results[0].username} 的配置制作种子`);
  console.log(`   - Announce URL: ${results[0].announce_url}`);
  console.log('   - 上传种子到 PT 站');
  console.log('   - 保持 qBittorrent 运行做种');
  
  if (results.length > 1) {
    console.log('\n2. 设备B (下载者):');
    console.log(`   - 使用 ${results[1].username} 账户登录 PT 站`);
    console.log(`   - 下载种子文件并添加到 qBittorrent`);
    console.log(`   - qBittorrent 应使用 ${results[1].username} 的 Passkey`);
    console.log(`   - Announce URL: ${results[1].announce_url}`);
  }

  console.log('\n💡 监控提示:');
  console.log('- 查看后端控制台的 tracker 日志');
  console.log('- 访问 /api/tracker/stats 查看统计信息');
  console.log('- 检查用户上传下载量变化');
  console.log('- 确认 peer 连接建立正常');
}

// 运行测试
testPasskeyFlow().catch(error => {
  console.error('测试脚本执行失败:', error);
  process.exit(1);
});

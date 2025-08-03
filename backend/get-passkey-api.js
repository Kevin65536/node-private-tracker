/**
 * 通过API获取用户passkey的脚本
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

/**
 * 用户登录并获取token
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
 * 获取用户passkey
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
    console.error('获取passkey失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🔑 获取用户Passkey工具');
  console.log('==================');

  // 尝试使用默认的admin账户
  const credentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'admin', password: 'password' },
    { username: 'admin', password: 'admin' },
    { username: 'test', password: 'password' }
  ];

  let userInfo = null;
  let passkey = null;

  for (const cred of credentials) {
    console.log(`\n尝试登录用户: ${cred.username}`);
    
    const loginResult = await loginUser(cred.username, cred.password);
    if (loginResult && loginResult.token) {
      console.log(`✅ 登录成功: ${cred.username}`);
      userInfo = loginResult;
      
      // 获取passkey
      const passkeyResult = await getUserPasskey(loginResult.token);
      if (passkeyResult && passkeyResult.passkey) {
        passkey = passkeyResult.passkey;
        console.log(`✅ 获取passkey成功`);
        break;
      }
    } else {
      console.log(`❌ 登录失败: ${cred.username}`);
    }
  }

  if (userInfo && passkey) {
    console.log(`\n🎉 成功获取用户信息:`);
    console.log(`   用户名: ${userInfo.user.username}`);
    console.log(`   用户ID: ${userInfo.user.id}`);
    console.log(`   角色: ${userInfo.user.role}`);
    console.log(`   Passkey: ${passkey}`);
    
    const announceUrl = `http://localhost:3001/tracker/announce/${passkey}`;
    console.log(`\n📡 Tracker Announce URL:`);
    console.log(`   ${announceUrl}`);
    
    console.log(`\n📋 qBittorrent种子制作配置:`);
    console.log(`┌─────────────────────────────────────────────────────────────┐`);
    console.log(`│ 🎯 种子制作关键配置                                           │`);
    console.log(`├─────────────────────────────────────────────────────────────┤`);
    console.log(`│ 📁 选择文件: C:\\Users\\qdsxh\\Desktop\\toys\\pt\\backend\\test-data\\tracker-test-file.txt │`);
    console.log(`│ 🔗 Tracker URL: ${announceUrl.padEnd(38)} │`);
    console.log(`│ 🔒 私有torrent: ✅ 必须勾选                                   │`);
    console.log(`│ 🌱 完成后开始做种: ✅ 勾选                                     │`);
    console.log(`│ ⚙️  优化对齐: ✅ 勾选                                          │`);
    console.log(`│ 📦 分块大小: 自动                                             │`);
    console.log(`│ ❌ 忽略分享条件: 不要勾选                                      │`);
    console.log(`│ 🌐 Web种子URL: 保持空白                                       │`);
    console.log(`└─────────────────────────────────────────────────────────────┘`);
    
    console.log(`\n🔄 下一步操作:`);
    console.log(`1. 使用qBittorrent制作种子 (使用上述配置)`);
    console.log(`2. 种子制作完成后，上传.torrent文件到PT站`);
    console.log(`3. 确保种子状态为'approved'`);
    console.log(`4. 在其他设备上使用相同或不同用户的passkey进行下载测试`);
    
  } else {
    console.log(`\n❌ 无法获取用户信息和passkey`);
    console.log(`请确保:`);
    console.log(`1. 服务器正在运行 (http://localhost:3001)`);
    console.log(`2. 存在有效的用户账户`);
    console.log(`3. 用户密码正确`);
    
    console.log(`\n💡 如果没有用户账户，请通过以下方式创建:`);
    console.log(`   方式1: 访问前端注册页面`);
    console.log(`   方式2: 直接在数据库中创建`);
    console.log(`   方式3: 使用admin接口创建`);
  }
}

main().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});

/**
 * 快速获取指定用户的 Passkey
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function getUserPasskey(username, password) {
  try {
    console.log(`🔍 获取用户 ${username} 的 Passkey...`);
    
    // 登录
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username,
      password
    });

    if (!loginResponse.data.token) {
      throw new Error('登录失败');
    }

    console.log(`✅ 用户 ${username} 登录成功`);

    // 获取 Passkey
    const passkeyResponse = await axios.get(`${BASE_URL}/api/users/passkey`, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });

    const data = passkeyResponse.data;
    
    console.log(`\n🔑 用户 ${username} 的 Passkey 信息:`);
    console.log(`   Passkey: ${data.passkey}`);
    console.log(`   Tracker URL: ${data.announce_url}`);
    
    console.log(`\n📋 在 qBittorrent 中的操作步骤:`);
    console.log(`1. 右键点击种子 → 选择 "属性" 或 "编辑 Tracker"`);
    console.log(`2. 在 Tracker 列表中，编辑现有的 Tracker URL`);
    console.log(`3. 将 URL 更改为: ${data.announce_url}`);
    console.log(`4. 点击 "确定" 保存更改`);
    console.log(`5. 种子将重新向 Tracker 请求 peer 信息`);

    return data;
    
  } catch (error) {
    console.error(`❌ 获取用户 ${username} 的 Passkey 失败:`, error.response?.data || error.message);
    return null;
  }
}

// 获取两个用户的 Passkey 进行对比
async function main() {
  console.log('🎯 获取用户 Passkey 用于 qBittorrent 配置\n');
  
  const adminData = await getUserPasskey('admin', 'admin123456');
  console.log('\n' + '='.repeat(60) + '\n');
  const testUserData = await getUserPasskey('testuser1', 'Testuser1');
  
  if (adminData && testUserData) {
    console.log(`\n\n📊 两用户 Passkey 对比:`);
    console.log(`┌─────────────────────────────────────────────────────────────┐`);
    console.log(`│ admin (制种者):                                              │`);
    console.log(`│ ${adminData.announce_url.padEnd(59)} │`);
    console.log(`├─────────────────────────────────────────────────────────────┤`);
    console.log(`│ testuser1 (下载者):                                          │`);
    console.log(`│ ${testUserData.announce_url.padEnd(59)} │`);
    console.log(`└─────────────────────────────────────────────────────────────┘`);
    
    console.log(`\n🔄 测试流程:`);
    console.log(`1. 确保使用 admin 的 URL 制作的种子正在做种`);
    console.log(`2. 在另一台设备上，将种子的 Tracker URL 改为 testuser1 的 URL`);
    console.log(`3. 开始下载，观察两设备间的 P2P 连接`);
    console.log(`4. 检查 PT 站统计页面，确认上传下载量正确记录`);
  }
}

main().catch(console.error);

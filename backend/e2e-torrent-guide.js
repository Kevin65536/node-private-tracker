const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 端到端种子测试指南和辅助脚本
 */

console.log(`
🔥 PT站种子制作和测试完整指南
=====================================

步骤1: 准备测试环境
-------------------
1. 确保后端服务器正在运行 (port 3001)
2. 确保有至少一个激活的用户账户
3. 准备要分享的测试文件

步骤2: 获取用户Passkey
--------------------
运行以下命令获取用户的passkey:
  node get-user-passkey.js <用户名>

步骤3: 制作种子文件
------------------
在qBittorrent中配置:

✅ 必须设置的选项:
  - Tracker URL: http://localhost:3001/tracker/announce/{你的passkey}
  - 私有torrent: ✅ 必须勾选 (重要!)
  - 完成后开始做种: ✅ 勾选

✅ 推荐设置:
  - 优化对齐: ✅ 勾选
  - 分块大小: 自动
  - 忽略分享条件: ❌ 不要勾选

❌ 不要设置的选项:
  - 忽略torrent的分享条件: 不要勾选
  - Web种子URL: 保持空白

步骤4: 上传种子到PT站
-------------------
1. 制作完成后，将.torrent文件上传到PT站
2. 通过前端界面或API上传种子
3. 确保种子状态为 'approved'

步骤5: 两设备测试
---------------
设备A (制种者/Seeder):
  - 保持qBittorrent运行并做种
  - 种子状态应显示为"做种"

设备B (下载者/Leecher):
  - 下载.torrent文件并添加到客户端
  - 使用另一个用户的passkey (需要创建第二个用户)
  - 开始下载

步骤6: 监控和验证
--------------
1. 检查tracker日志
2. 验证peer连接
3. 确认上传下载量统计
4. 检查用户积分变化
`);

/**
 * 创建测试文件
 */
function createTestFile() {
  const testDir = path.join(__dirname, 'test-data');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const testFile = path.join(testDir, 'tracker-test-file.txt');
  const testContent = `
PT站种子测试文件
===============
创建时间: ${new Date().toISOString()}
文件大小: 约1MB
哈希值: ${crypto.randomBytes(16).toString('hex')}

这是一个用于测试PT站tracker功能的文件。
包含随机数据以确保唯一性。

${'测试数据'.repeat(10000)}

随机数据:
${crypto.randomBytes(50000).toString('hex')}
`;

  fs.writeFileSync(testFile, testContent);
  console.log(`\n✅ 已创建测试文件: ${testFile}`);
  console.log(`   文件大小: ${(fs.statSync(testFile).size / 1024).toFixed(2)} KB`);
  
  return testFile;
}

/**
 * 创建用于测试的用户脚本
 */
function createTestUserScript() {
  const scriptContent = `const { User } = require('./models');
const bcrypt = require('bcrypt');
const { getOrCreatePasskey } = require('./utils/passkey');

async function createTestUsers() {
  try {
    const { sequelize } = require('./models');
    await sequelize.authenticate();
    
    // 创建测试用户1 (seeder)
    const [user1] = await User.findOrCreate({
      where: { username: 'seeder_test' },
      defaults: {
        username: 'seeder_test',
        email: 'seeder@test.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        status: 'active'
      }
    });
    
    // 创建测试用户2 (leecher)
    const [user2] = await User.findOrCreate({
      where: { username: 'leecher_test' },
      defaults: {
        username: 'leecher_test',
        email: 'leecher@test.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        status: 'active'
      }
    });
    
    // 获取passkeys
    const passkey1 = await getOrCreatePasskey(user1.id);
    const passkey2 = await getOrCreatePasskey(user2.id);
    
    console.log('✅ 测试用户创建完成:');
    console.log(\`Seeder - 用户名: seeder_test, Passkey: \${passkey1}\`);
    console.log(\`Leecher - 用户名: leecher_test, Passkey: \${passkey2}\`);
    
    console.log('\\n📡 Announce URLs:');
    console.log(\`Seeder: http://localhost:3001/tracker/announce/\${passkey1}\`);
    console.log(\`Leecher: http://localhost:3001/tracker/announce/\${passkey2}\`);
    
  } catch (error) {
    console.error('创建测试用户失败:', error);
  } finally {
    process.exit(0);
  }
}

createTestUsers();`;

  const scriptPath = path.join(__dirname, 'create-test-users.js');
  fs.writeFileSync(scriptPath, scriptContent);
  console.log(`\n✅ 已创建测试用户脚本: ${scriptPath}`);
  console.log(`   运行: node create-test-users.js`);
}

// 创建测试文件和脚本
const testFile = createTestFile();
createTestUserScript();

console.log(`
\n🚀 下一步操作:
1. node create-test-users.js          # 创建测试用户
2. node get-user-passkey.js seeder_test    # 获取第一个用户的passkey
3. 使用qBittorrent制作种子，选择文件: ${testFile}
4. 上传种子到PT站
5. 在另一台设备上使用 leecher_test 的passkey下载测试

💡 提示: 
- 确保两台设备在同一网络内
- 检查防火墙设置，允许qBittorrent端口通信
- 观察tracker日志确认peer连接正常
`);

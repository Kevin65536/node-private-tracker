const { User, UserPasskey } = require('./models');
const { getOrCreatePasskey } = require('./utils/passkey');

/**
 * 获取用户的 passkey 信息，用于制作种子
 */
async function getUserPasskey(username) {
  try {
    // 初始化数据库连接
    const { sequelize } = require('./models');
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 查找用户
    const user = await User.findOne({
      where: { username }
    });

    if (!user) {
      console.log(`❌ 用户 "${username}" 不存在`);
      console.log('\n可用的用户列表：');
      const users = await User.findAll({
        attributes: ['id', 'username', 'role', 'status'],
        limit: 10
      });
      users.forEach(u => {
        console.log(`  - ${u.username} (ID: ${u.id}, 角色: ${u.role}, 状态: ${u.status})`);
      });
      return;
    }

    console.log(`\n✅ 找到用户: ${user.username} (ID: ${user.id})`);
    console.log(`   角色: ${user.role}`);
    console.log(`   状态: ${user.status}`);

    // 获取或创建 passkey
    const passkey = await getOrCreatePasskey(user.id);
    
    console.log(`\n🔑 用户 Passkey: ${passkey}`);
    
    // 构建 announce URL
    const announceUrl = `http://localhost:3001/tracker/announce/${passkey}`;
    console.log(`\n📡 Tracker Announce URL:`);
    console.log(`   ${announceUrl}`);
    
    // 如果是本机测试，也显示可能的内网地址
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const internalIps = [];
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          internalIps.push(net.address);
        }
      }
    }
    
    if (internalIps.length > 0) {
      console.log(`\n🌐 如果需要其他设备访问，可使用以下地址:`);
      internalIps.forEach(ip => {
        console.log(`   http://${ip}:3001/tracker/announce/${passkey}`);
      });
    }

    console.log(`\n📋 制作种子的配置信息：`);
    console.log(`┌─────────────────────────────────────────────────────────────┐`);
    console.log(`│ qBittorrent 种子制作配置                                      │`);
    console.log(`├─────────────────────────────────────────────────────────────┤`);
    console.log(`│ Tracker URL: ${announceUrl.padEnd(40)} │`);
    console.log(`│ 私有 torrent: ✅ 必须勾选                                      │`);
    console.log(`│ 完成后开始做种: ✅ 建议勾选                                      │`);
    console.log(`│ 优化对齐: ✅ 建议勾选                                          │`);
    console.log(`│ 分块大小: 自动 (推荐)                                          │`);
    console.log(`│ 忽略分享条件: ❌ 不要勾选                                       │`);
    console.log(`└─────────────────────────────────────────────────────────────┘`);

  } catch (error) {
    console.error('❌ 获取 passkey 失败:', error);
  } finally {
    process.exit(0);
  }
}

// 从命令行参数获取用户名
const username = process.argv[2];

if (!username) {
  console.log('使用方法: node get-user-passkey.js <用户名>');
  console.log('示例: node get-user-passkey.js admin');
  process.exit(1);
}

getUserPasskey(username);

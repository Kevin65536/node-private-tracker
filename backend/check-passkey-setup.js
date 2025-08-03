/**
 * 检查和修复 UserPasskey 表及数据
 */

// 加载环境变量
require('dotenv').config();

const { User, UserPasskey, sequelize } = require('./models');
const { getOrCreatePasskey } = require('./utils/passkey');

async function checkAndFixUserPasskeys() {
  try {
    console.log('🔍 检查 UserPasskey 表和数据...\n');

    // 1. 检查数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 2. 同步 UserPasskey 表
    await UserPasskey.sync();
    console.log('✅ UserPasskey 表已同步');

    // 3. 检查现有的 passkey 记录
    const existingPasskeys = await UserPasskey.findAll({
      include: [{
        model: User,
        attributes: ['id', 'username']
      }]
    });

    console.log(`📊 现有 Passkey 记录: ${existingPasskeys.length} 条`);
    existingPasskeys.forEach(pk => {
      console.log(`   - ${pk.User.username}: ${pk.passkey}`);
    });

    // 4. 获取所有用户
    const allUsers = await User.findAll({
      attributes: ['id', 'username']
    });

    console.log(`\n👥 总用户数: ${allUsers.length}`);

    // 5. 为每个用户确保有 passkey
    console.log('\n🔑 为用户生成/检查 Passkey:');
    for (const user of allUsers) {
      try {
        const passkey = await getOrCreatePasskey(user.id);
        console.log(`   ✅ ${user.username}: ${passkey}`);
      } catch (error) {
        console.log(`   ❌ ${user.username}: 失败 - ${error.message}`);
      }
    }

    // 6. 测试 tracker 端点
    console.log('\n🧪 测试 Tracker 端点:');
    
    // 获取一个有效的 passkey 来测试
    const testPasskey = await UserPasskey.findOne();
    if (testPasskey) {
      console.log(`   测试 URL: http://localhost:3001/tracker/announce/${testPasskey.passkey}`);
      
      // 测试没有参数的请求（应该返回错误，但不是404）
      const axios = require('axios');
      try {
        await axios.get(`http://localhost:3001/tracker/announce/${testPasskey.passkey}`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('   ❌ Tracker 端点返回 404 - 路由配置可能有问题');
        } else if (error.response?.status === 400) {
          console.log('   ✅ Tracker 端点可访问（参数验证失败是正常的）');
        } else {
          console.log(`   🔄 Tracker 响应: ${error.response?.status || '无响应'}`);
        }
      }
    } else {
      console.log('   ⚠️  没有找到测试用的 passkey');
    }

    // 7. 检查种子的 info_hash
    console.log('\n📦 检查种子数据:');
    const { Torrent } = require('./models');
    const torrents = await Torrent.findAll({
      where: { status: 'approved' },
      attributes: ['id', 'name', 'info_hash'],
      limit: 5
    });

    console.log(`   已审核种子数量: ${torrents.length}`);
    torrents.forEach(t => {
      console.log(`   - ${t.name} (ID: ${t.id})`);
      console.log(`     Info Hash: ${t.info_hash}`);
    });

    console.log('\n🎉 检查完成！');

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    process.exit(0);
  }
}

checkAndFixUserPasskeys();

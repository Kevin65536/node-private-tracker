const { User } = require('./models');
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
    console.log(`Seeder - 用户名: seeder_test, Passkey: ${passkey1}`);
    console.log(`Leecher - 用户名: leecher_test, Passkey: ${passkey2}`);
    
    console.log('\n📡 Announce URLs:');
    console.log(`Seeder: http://localhost:3001/tracker/announce/${passkey1}`);
    console.log(`Leecher: http://localhost:3001/tracker/announce/${passkey2}`);
    
  } catch (error) {
    console.error('创建测试用户失败:', error);
  } finally {
    process.exit(0);
  }
}

createTestUsers();
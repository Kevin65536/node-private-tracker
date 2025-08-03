require('dotenv').config();
const { User, UserPasskey } = require('./models');

async function getUserPasskeys() {
  try {
    console.log('🔍 查询用户passkey信息...\n');
    
    const users = await User.findAll({
      where: { 
        username: ['admin', '507pc1'] 
      },
      include: [{ 
        model: UserPasskey
      }]
    });
    
    if (users.length === 0) {
      console.log('❌ 没有找到指定用户');
      return;
    }
    
    console.log('📋 用户passkey信息:\n');
    users.forEach(user => {
      console.log(`用户: ${user.username}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  passkey: ${user.UserPasskey?.passkey || '无'}`);
      console.log(`  创建时间: ${user.UserPasskey?.created_at || '无'}`);
      console.log('  ─────────────────────────────────────────');
    });
    
    return users;
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  }
}

// 运行查询
if (require.main === module) {
  getUserPasskeys();
}

module.exports = { getUserPasskeys };

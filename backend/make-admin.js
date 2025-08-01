// 将用户升级为管理员的脚本
const { User } = require('./models');

async function makeUserAdmin() {
  try {
    // 找到第一个用户并设为管理员
    const user = await User.findOne({ where: { username: 'user1' } });
    
    if (!user) {
      console.log('用户 user1 不存在');
      return;
    }
    
    await user.update({ role: 'admin' });
    console.log(`用户 ${user.username} 已升级为管理员`);
    
    // 验证更新
    const updatedUser = await User.findByPk(user.id);
    console.log(`确认：${updatedUser.username} 现在的角色是: ${updatedUser.role}`);
    
  } catch (error) {
    console.error('升级用户失败:', error);
  } finally {
    process.exit(0);
  }
}

makeUserAdmin();

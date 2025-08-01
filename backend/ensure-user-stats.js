// 确保所有用户都有统计记录的脚本
const { User, UserStats } = require('./models');

async function ensureUserStats() {
  try {
    const users = await User.findAll();
    console.log(`找到 ${users.length} 个用户`);
    
    for (const user of users) {
      const stats = await UserStats.findOne({ where: { user_id: user.id } });
      
      if (!stats) {
        await UserStats.create({
          user_id: user.id,
          uploaded: 0,
          downloaded: 0,
          bonus_points: 50.00,
          invitations: 0
        });
        console.log(`为用户 ${user.username} 创建了统计记录`);
      } else {
        console.log(`用户 ${user.username} 已有统计记录`);
      }
    }
    
    console.log('所有用户统计记录检查完成');
    
  } catch (error) {
    console.error('检查用户统计记录失败:', error);
  } finally {
    process.exit(0);
  }
}

ensureUserStats();

/**
 * 积分迁移脚本 - 为现有用户补充积分
 */

const { User, UserStats } = require('./models');

async function migrateUserBonus() {
  try {
    console.log('🔄 开始积分迁移...\n');

    // 获取所有需要补充积分的用户
    const users = await User.findAll({
      include: [{
        model: UserStats,
        as: 'UserStat',
        where: {
          bonus_points: { [require('sequelize').Op.lt]: 100 }
        },
        required: true
      }]
    });

    console.log(`📋 找到${users.length}个需要补充积分的用户:\n`);

    for (const user of users) {
      const currentPoints = parseFloat(user.UserStat.bonus_points);
      const uploaded = user.UserStat.uploaded;
      const downloaded = user.UserStat.downloaded;
      
      console.log(`👤 ${user.username}:`);
      console.log(`   当前积分: ${currentPoints}`);
      console.log(`   上传量: ${(uploaded / 1024 / 1024 / 1024).toFixed(2)} GB`);
      console.log(`   下载量: ${(downloaded / 1024 / 1024 / 1024).toFixed(2)} GB`);
      
      // 根据用户的贡献情况决定补充策略
      let newPoints;
      if (uploaded > 1024 * 1024 * 1024) { // 上传超过1GB
        // 有贡献的用户补充到120积分
        newPoints = Math.max(120, currentPoints);
        console.log(`   ➡️  补充到: ${newPoints} (活跃用户奖励)`);
      } else {
        // 普通用户补充到100积分
        newPoints = Math.max(100, currentPoints);
        console.log(`   ➡️  补充到: ${newPoints} (标准补充)`);
      }
      
      // 执行更新
      await user.UserStat.update({ bonus_points: newPoints });
      console.log(`   ✅ 更新完成\n`);
    }

    // 统计更新后的情况
    console.log('📊 更新后的积分统计:');
    const allUsers = await User.findAll({
      include: [{
        model: UserStats,
        as: 'UserStat',
        attributes: ['bonus_points', 'uploaded', 'downloaded']
      }]
    });

    allUsers.forEach(user => {
      const stats = user.UserStat;
      const bonusPoints = stats ? parseFloat(stats.bonus_points) : 0;
      console.log(`${user.username}: ${bonusPoints}积分`);
    });

    console.log('\n🎉 积分迁移完成！');
    console.log('\n🔧 新积分系统特性:');
    console.log('• 新用户注册: 100积分');
    console.log('• 上传奖励: 每GB +1积分');
    console.log('• 下载扣除: 每GB -0.5积分');
    console.log('• 精确计算: 支持小数点');
    console.log('• 最低保障: 积分不会低于0');

  } catch (error) {
    console.error('❌ 积分迁移失败:', error);
  }
}

// 执行迁移
migrateUserBonus();

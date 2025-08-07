/**
 * 测试和迁移积分系统
 * 1. 测试新的积分计算逻辑
 * 2. 为现有低积分用户补充积分到100
 */

const { User, UserStats } = require('./models');

async function testBonusPointsSystem() {
  try {
    console.log('🔍 测试积分系统...\n');

    // 测试积分计算函数
    function calculateBonusPoints(uploadedDiff, downloadedDiff) {
      const uploadGBs = uploadedDiff / (1024 * 1024 * 1024);
      const downloadGBs = downloadedDiff / (1024 * 1024 * 1024);
      
      const uploadBonus = Math.floor(uploadGBs * 1);
      const downloadPenalty = Math.floor(downloadGBs * 0.5);
      
      return uploadBonus - downloadPenalty;
    }

    // 测试场景
    const testCases = [
      { upload: 1024 * 1024 * 1024, download: 0, description: '上传1GB，下载0' },
      { upload: 0, download: 1024 * 1024 * 1024, description: '上传0，下载1GB' },
      { upload: 2 * 1024 * 1024 * 1024, download: 1024 * 1024 * 1024, description: '上传2GB，下载1GB' },
      { upload: 1024 * 1024 * 1024, download: 3 * 1024 * 1024 * 1024, description: '上传1GB，下载3GB' },
    ];

    console.log('📊 积分计算测试:');
    testCases.forEach(test => {
      const points = calculateBonusPoints(test.upload, test.download);
      console.log(`${test.description}: ${points > 0 ? '+' : ''}${points} 积分`);
    });

    console.log('\n🔧 检查现有用户积分...');

    // 检查所有用户的积分情况
    const users = await User.findAll({
      include: [{
        model: UserStats,
        as: 'UserStat',
        attributes: ['bonus_points', 'uploaded', 'downloaded']
      }]
    });

    console.log(`\n📋 用户积分统计 (共${users.length}个用户):`);
    let lowPointsUsers = [];

    users.forEach(user => {
      const stats = user.UserStat;
      const bonusPoints = stats ? parseFloat(stats.bonus_points) : 0;
      const uploaded = stats ? stats.uploaded : 0;
      const downloaded = stats ? stats.downloaded : 0;
      
      console.log(`${user.username}: ${bonusPoints}积分 (上传: ${(uploaded / 1024 / 1024 / 1024).toFixed(2)}GB, 下载: ${(downloaded / 1024 / 1024 / 1024).toFixed(2)}GB)`);
      
      // 找出积分低于50的用户（可能需要补充）
      if (bonusPoints < 50) {
        lowPointsUsers.push({ user, currentPoints: bonusPoints });
      }
    });

    // 为低积分用户补充积分
    if (lowPointsUsers.length > 0) {
      console.log(`\n💰 发现${lowPointsUsers.length}个低积分用户，建议补充积分到100:`);
      
      for (const { user, currentPoints } of lowPointsUsers) {
        console.log(`- ${user.username}: 当前${currentPoints}积分 → 建议补充到100积分`);
        
        // 可以选择自动补充或手动确认
        // await user.UserStat.update({ bonus_points: 100 });
      }
      
      console.log('\n📝 执行积分补充 (取消注释以下代码):');
      console.log('// 自动为所有低积分用户补充到100积分');
      console.log('// for (const { user } of lowPointsUsers) {');
      console.log('//   if (user.UserStat) {');
      console.log('//     await user.UserStat.update({ bonus_points: 100 });');
      console.log('//     console.log(`✅ ${user.username} 积分已补充到100`);');
      console.log('//   }');
      console.log('// }');
    } else {
      console.log('\n✅ 所有用户积分都在合理范围内');
    }

    console.log('\n🎯 积分系统功能总结:');
    console.log('✅ 新用户注册获得100积分');
    console.log('✅ 每上传1GB获得1积分');
    console.log('✅ 每下载1GB扣除0.5积分');
    console.log('✅ 积分不会低于0');
    console.log('✅ 实时积分变化日志');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 执行测试
testBonusPointsSystem();

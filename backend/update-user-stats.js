/**
 * 用户统计更新脚本
 * 手动更新所有用户的统计信息
 */

const { sequelize, User, UserStats, Download, Torrent } = require('./models');
const { Sequelize } = require('sequelize');

async function updateAllUserStats() {
  try {
    console.log('开始更新所有用户统计信息...');
    
    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 获取所有用户
    const users = await User.findAll({
      attributes: ['id', 'username']
    });

    console.log(`找到 ${users.length} 个用户，开始更新统计...`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        await updateUserStats(user.id);
        console.log(`✅ 更新用户 ${user.username} (ID: ${user.id}) 统计成功`);
        successCount++;
      } catch (error) {
        console.error(`❌ 更新用户 ${user.username} (ID: ${user.id}) 统计失败:`, error.message);
        errorCount++;
      }
    }

    console.log('\n统计更新完成:');
    console.log(`成功: ${successCount} 个用户`);
    console.log(`失败: ${errorCount} 个用户`);

  } catch (error) {
    console.error('更新用户统计失败:', error);
  } finally {
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

async function updateUserStats(userId) {
  // 从下载记录计算上传下载总量
  const downloadStats = await Download.findAll({
    where: { user_id: userId },
    attributes: [
      [Sequelize.fn('SUM', Sequelize.col('uploaded')), 'total_uploaded'],
      [Sequelize.fn('SUM', Sequelize.col('downloaded')), 'total_downloaded']
    ],
    raw: true
  });

  // 计算用户上传的种子数量
  const uploadedTorrents = await Torrent.count({
    where: { uploader_id: userId }
  });

  // 计算当前活跃种子数量
  const [seedingCount, leechingCount] = await Promise.all([
    Download.count({
      where: {
        user_id: userId,
        status: 'seeding'
      }
    }),
    Download.count({
      where: {
        user_id: userId,
        status: 'downloading'
      }
    })
  ]);

  const totalUploaded = parseInt(downloadStats[0]?.total_uploaded) || 0;
  const totalDownloaded = parseInt(downloadStats[0]?.total_downloaded) || 0;

  // 更新或创建用户统计
  const [userStats, created] = await UserStats.findOrCreate({
    where: { user_id: userId },
    defaults: {
      uploaded: totalUploaded,
      downloaded: totalDownloaded,
      torrents_uploaded: uploadedTorrents,
      torrents_seeding: seedingCount,
      torrents_leeching: leechingCount,
      seedtime: 0,
      leechtime: 0,
      bonus_points: 0,
      invitations: 0
    }
  });

  if (!created) {
    await userStats.update({
      uploaded: totalUploaded,
      downloaded: totalDownloaded,
      torrents_uploaded: uploadedTorrents,
      torrents_seeding: seedingCount,
      torrents_leeching: leechingCount
    });
  }

  return userStats;
}

// 如果直接运行此脚本
if (require.main === module) {
  updateAllUserStats().catch(console.error);
}

module.exports = { updateAllUserStats, updateUserStats };

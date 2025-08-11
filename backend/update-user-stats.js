const { Sequelize } = require('sequelize');
const { User, UserStats, Download, Torrent } = require('./models');

async function updateUserStats(userId) {
  // 汇总单个用户上传下载量、上传种子数、活跃统计
  const downloadAgg = await Download.findAll({
    where: { user_id: userId },
    attributes: [
      [Sequelize.fn('SUM', Sequelize.col('uploaded')), 'total_uploaded'],
      [Sequelize.fn('SUM', Sequelize.col('downloaded')), 'total_downloaded']
    ],
    raw: true
  });

  const totalUploaded = parseInt(downloadAgg[0]?.total_uploaded) || 0;
  const totalDownloaded = parseInt(downloadAgg[0]?.total_downloaded) || 0;

  const uploadedTorrents = await Torrent.count({ where: { uploader_id: userId } });

  const [seedingCount, leechingCount] = await Promise.all([
    Download.count({ where: { user_id: userId, status: 'seeding' } }),
    Download.count({ where: { user_id: userId, status: 'downloading' } })
  ]);

  const [stats] = await UserStats.findOrCreate({
    where: { user_id: userId },
    defaults: {
      uploaded: 0,
      downloaded: 0,
      seedtime: 0,
      leechtime: 0,
      bonus_points: 0,
      invitations: 0,
      torrents_uploaded: 0,
      torrents_seeding: 0,
      torrents_leeching: 0
    }
  });

  await stats.update({
    uploaded: totalUploaded,
    downloaded: totalDownloaded,
    torrents_uploaded: uploadedTorrents,
    torrents_seeding: seedingCount,
    torrents_leeching: leechingCount
  });

  return stats;
}

async function updateAllUserStats() {
  const users = await User.findAll({ attributes: ['id'] });
  for (const u of users) {
    await updateUserStats(u.id);
  }
}

module.exports = {
  updateUserStats,
  updateAllUserStats
};

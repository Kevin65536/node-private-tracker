const express = require('express');
require('dotenv').config();

const { sequelize, User, UserStats, Torrent, Category, Download } = require('./models');

const app = express();
app.use(express.json());

// 简单的全站统计端点
app.get('/api/stats/global', async (req, res) => {
  try {
    console.log('处理全站统计请求...');
    
    // 基础统计
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const totalTorrents = await Torrent.count();
    const approvedTorrents = await Torrent.count({ where: { status: 'approved' } });
    const totalCategories = await Category.count();

    console.log('基础统计完成');

    // 流量统计 - 简化版
    const trafficStats = await UserStats.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('uploaded')), 'total_uploaded'],
        [sequelize.fn('SUM', sequelize.col('downloaded')), 'total_downloaded'],
        [sequelize.fn('COUNT', sequelize.col('user_id')), 'users_with_stats']
      ],
      raw: true
    });

    console.log('流量统计完成');

    const totalUploaded = parseInt(trafficStats[0]?.total_uploaded) || 0;
    const totalDownloaded = parseInt(trafficStats[0]?.total_downloaded) || 0;
    const globalRatio = totalDownloaded > 0 ? totalUploaded / totalDownloaded : 1;

    res.json({
      general: {
        total_users: totalUsers,
        active_users: activeUsers,
        total_torrents: totalTorrents,
        approved_torrents: approvedTorrents,
        pending_torrents: totalTorrents - approvedTorrents,
        total_categories: totalCategories
      },
      traffic: {
        total_uploaded: totalUploaded,
        total_downloaded: totalDownloaded,
        global_ratio: globalRatio,
        users_with_stats: parseInt(trafficStats[0]?.users_with_stats) || 0
      }
    });

  } catch (error) {
    console.error('获取全站统计失败:', error);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

// 用户统计端点
app.get('/api/stats/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 获取用户基本信息
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'role', 'status', 'created_at']
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取用户统计信息
    const userStats = await UserStats.findOne({
      where: { user_id: userId }
    });

    // 计算比率
    const ratio = userStats && userStats.downloaded > 0 
      ? userStats.uploaded / userStats.downloaded 
      : (userStats && userStats.uploaded > 0 ? Infinity : 1);

    res.json({
      user: user.toJSON(),
      stats: {
        uploaded: userStats?.uploaded || 0,
        downloaded: userStats?.downloaded || 0,
        ratio: ratio,
        bonus_points: userStats?.bonus_points || 0,
        seedtime: userStats?.seedtime || 0,
        leechtime: userStats?.leechtime || 0,
        torrents_uploaded: userStats?.torrents_uploaded || 0,
        torrents_seeding: userStats?.torrents_seeding || 0,
        torrents_leeching: userStats?.torrents_leeching || 0
      }
    });

  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

// 简单排行榜
app.get('/api/stats/leaderboard', async (req, res) => {
  try {
    const { type = 'uploaded', limit = 50 } = req.query;
    const limitNum = Math.min(parseInt(limit), 100);

    let orderField = type;
    if (type === 'ratio') {
      orderField = sequelize.literal(`CASE 
        WHEN downloaded = 0 AND uploaded > 0 THEN 999999999 
        WHEN downloaded = 0 THEN 1 
        ELSE uploaded::float / downloaded::float 
      END`);
    }

    const users = await User.findAll({
      where: { status: 'active' },
      attributes: ['id', 'username', 'role', 'created_at'],
      include: [{
        model: UserStats,
        as: 'UserStat',
        attributes: ['uploaded', 'downloaded', 'bonus_points', 'seedtime']
      }],
      order: [[
        type === 'ratio' ? orderField : { model: UserStats, as: 'UserStat' },
        type === 'ratio' ? 'DESC' : orderField,
        'DESC'
      ]],
      limit: limitNum
    });

    const leaderboard = users.map((user, index) => {
      const stats = user.UserStat || {};
      const ratio = stats.downloaded > 0 
        ? stats.uploaded / stats.downloaded 
        : (stats.uploaded > 0 ? Infinity : 1);

      return {
        rank: index + 1,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          member_since: user.created_at
        },
        stats: {
          uploaded: stats.uploaded || 0,
          downloaded: stats.downloaded || 0,
          ratio: ratio,
          bonus_points: stats.bonus_points || 0,
          seedtime: stats.seedtime || 0
        }
      };
    });

    res.json({
      type,
      leaderboard
    });

  } catch (error) {
    console.error('获取排行榜失败:', error);
    res.status(500).json({ error: '获取排行榜失败' });
  }
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    app.listen(3002, () => {
      console.log('🚀 统计测试服务器运行在 http://localhost:3002');
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

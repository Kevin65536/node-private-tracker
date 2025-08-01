const express = require('express');
const { Op, Sequelize } = require('sequelize');
const { 
  User, 
  UserStats, 
  Torrent, 
  Download, 
  AnnounceLog, 
  Peer, 
  Category,
  sequelize
} = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * 获取用户详细统计信息
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestUserId = parseInt(userId);
    
    // 检查权限：只能查看自己的统计或管理员可查看所有
    if (req.user.id !== requestUserId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '权限不足' });
    }

    // 获取用户基本信息
    const user = await User.findByPk(requestUserId, {
      attributes: ['id', 'username', 'email', 'role', 'status', 'created_at', 'last_login']
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取用户统计信息
    const userStats = await UserStats.findOne({
      where: { user_id: requestUserId }
    });

    // 获取用户上传的种子统计
    const torrentStats = await Torrent.findAll({
      where: { uploader_id: requestUserId },
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('size')), 'total_size']
      ],
      group: ['status'],
      raw: true
    });

    // 获取下载统计
    const downloadStats = await Download.findAll({
      where: { user_id: requestUserId },
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('uploaded')), 'total_uploaded'],
        [Sequelize.fn('SUM', Sequelize.col('downloaded')), 'total_downloaded']
      ],
      group: ['status'],
      raw: true
    });

    // 获取最近30天的活动统计
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentActivity = await AnnounceLog.findAll({
      where: {
        user_id: requestUserId,
        created_at: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'announces'],
        [Sequelize.fn('SUM', Sequelize.col('uploaded')), 'daily_uploaded'],
        [Sequelize.fn('SUM', Sequelize.col('downloaded')), 'daily_downloaded']
      ],
      group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'DESC']],
      raw: true
    });

    // 计算比率
    const ratio = userStats && userStats.downloaded > 0 
      ? userStats.uploaded / userStats.downloaded 
      : (userStats && userStats.uploaded > 0 ? Infinity : 1);

    // 格式化种子统计
    const torrentSummary = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      total_size: 0
    };

    torrentStats.forEach(stat => {
      torrentSummary.total += parseInt(stat.count);
      torrentSummary[stat.status] = parseInt(stat.count);
      torrentSummary.total_size += parseInt(stat.total_size || 0);
    });

    // 格式化下载统计
    const downloadSummary = {
      total: 0,
      downloading: 0,
      seeding: 0,
      completed: 0,
      stopped: 0,
      total_uploaded: 0,
      total_downloaded: 0
    };

    downloadStats.forEach(stat => {
      downloadSummary.total += parseInt(stat.count);
      downloadSummary[stat.status] = parseInt(stat.count);
      downloadSummary.total_uploaded += parseInt(stat.total_uploaded || 0);
      downloadSummary.total_downloaded += parseInt(stat.total_downloaded || 0);
    });

    res.json({
      user: user.toJSON(),
      stats: {
        // 基础统计
        uploaded: userStats?.uploaded || 0,
        downloaded: userStats?.downloaded || 0,
        ratio: ratio,
        bonus_points: userStats?.bonus_points || 0,
        seedtime: userStats?.seedtime || 0,
        leechtime: userStats?.leechtime || 0,
        invitations: userStats?.invitations || 0,
        
        // 种子统计
        torrents: torrentSummary,
        
        // 下载统计
        downloads: downloadSummary,
        
        // 最近活动
        recent_activity: recentActivity
      }
    });

  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

/**
 * 获取用户排行榜
 */
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { type = 'uploaded', limit = 50 } = req.query;
    const limitNum = Math.min(parseInt(limit), 100);

    const validTypes = ['uploaded', 'downloaded', 'ratio', 'bonus_points', 'seedtime'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: '无效的排行榜类型' });
    }

    let orderField = type;
    let orderDirection = 'DESC';

    // 特殊处理比率排行榜
    if (type === 'ratio') {
      orderField = [
        Sequelize.literal(`CASE 
          WHEN downloaded = 0 AND uploaded > 0 THEN 999999999 
          WHEN downloaded = 0 THEN 1 
          ELSE uploaded::float / downloaded::float 
        END`)
      ];
    }

    const users = await User.findAll({
      where: { status: 'active' },
      attributes: ['id', 'username', 'role', 'created_at'],
      include: [{
        model: UserStats,
        as: 'UserStat',
        attributes: ['uploaded', 'downloaded', 'bonus_points', 'seedtime', 'leechtime']
      }],
      order: [[
        type === 'ratio' ? orderField : { model: UserStats, as: 'UserStat' },
        type === 'ratio' ? orderDirection : orderField,
        orderDirection
      ]],
      limit: limitNum
    });

    // 计算排名和比率
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
          seedtime: stats.seedtime || 0,
          leechtime: stats.leechtime || 0
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

/**
 * 获取全站统计信息
 */
router.get('/global', async (req, res) => {
  try {
    // 基础统计
    const [
      totalUsers,
      activeUsers,
      totalTorrents,
      approvedTorrents,
      totalCategories
    ] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      Torrent.count(),
      Torrent.count({ where: { status: 'approved' } }),
      Category.count()
    ]);

    // 流量统计
    const trafficStats = await UserStats.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('uploaded')), 'total_uploaded'],
        [Sequelize.fn('SUM', Sequelize.col('downloaded')), 'total_downloaded'],
        [Sequelize.fn('COUNT', Sequelize.col('user_id')), 'users_with_stats']
      ],
      raw: true
    });

    // 种子大小统计
    const torrentSizeStats = await Torrent.findOne({
      where: { status: 'approved' },
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('size')), 'total_size'],
        [Sequelize.fn('AVG', Sequelize.col('size')), 'average_size']
      ],
      raw: true
    });

    // 活跃统计（最近7天有活动的用户和种子）
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [activeUsersWeek, activeTorrentsWeek] = await Promise.all([
      AnnounceLog.count({
        distinct: true,
        col: 'user_id',
        where: { created_at: { [Op.gte]: sevenDaysAgo } }
      }),
      AnnounceLog.count({
        distinct: true,
        col: 'torrent_id',
        where: { created_at: { [Op.gte]: sevenDaysAgo } }
      })
    ]);

    // 分类统计
    const categoryStats = await Category.findAll({
      attributes: [
        'id',
        'name',
        [Sequelize.fn('COUNT', Sequelize.col('torrents.id')), 'torrent_count']
      ],
      include: [{
        model: Torrent,
        as: 'torrents',
        attributes: [],
        where: { status: 'approved' },
        required: false
      }],
      group: ['Category.id', 'Category.name'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('torrents.id')), 'DESC']]
    });

    // 计算全站比率
    const totalUploaded = parseInt(trafficStats.total_uploaded) || 0;
    const totalDownloaded = parseInt(trafficStats.total_downloaded) || 0;
    const globalRatio = totalDownloaded > 0 ? totalUploaded / totalDownloaded : 1;

    res.json({
      general: {
        total_users: totalUsers,
        active_users: activeUsers,
        total_torrents: totalTorrents,
        approved_torrents: approvedTorrents,
        pending_torrents: totalTorrents - approvedTorrents,
        total_categories: totalCategories,
        active_users_week: activeUsersWeek,
        active_torrents_week: activeTorrentsWeek
      },
      traffic: {
        total_uploaded: totalUploaded,
        total_downloaded: totalDownloaded,
        global_ratio: globalRatio,
        users_with_stats: parseInt(trafficStats.users_with_stats) || 0
      },
      content: {
        total_size: parseInt(torrentSizeStats.total_size) || 0,
        average_size: parseInt(torrentSizeStats.average_size) || 0,
        categories: categoryStats.map(cat => ({
          id: cat.id,
          name: cat.name,
          torrent_count: parseInt(cat.dataValues.torrent_count) || 0
        }))
      }
    });

  } catch (error) {
    console.error('获取全站统计失败:', error);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

/**
 * 获取用户活动历史 (管理员功能)
 */
router.get('/user/:userId/activity', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30, limit = 100 } = req.query;
    
    const daysAgo = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    const activities = await AnnounceLog.findAll({
      where: {
        user_id: userId,
        created_at: { [Op.gte]: daysAgo }
      },
      include: [{
        model: Torrent,
        as: 'torrent',
        attributes: ['id', 'name', 'size']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      user_id: parseInt(userId),
      period_days: parseInt(days),
      activities: activities.map(activity => ({
        id: activity.id,
        torrent: activity.torrent ? {
          id: activity.torrent.id,
          name: activity.torrent.name,
          size: activity.torrent.size
        } : null,
        uploaded: activity.uploaded,
        downloaded: activity.downloaded,
        left: activity.left,
        event: activity.event,
        ip: activity.ip,
        user_agent: activity.user_agent,
        timestamp: activity.created_at
      }))
    });

  } catch (error) {
    console.error('获取用户活动历史失败:', error);
    res.status(500).json({ error: '获取活动历史失败' });
  }
});

/**
 * 更新用户统计 (管理员功能)
 */
router.post('/user/:userId/update', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { uploaded, downloaded, bonus_points } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const [userStats] = await UserStats.findOrCreate({
      where: { user_id: userId },
      defaults: {
        uploaded: 0,
        downloaded: 0,
        bonus_points: 0
      }
    });

    const updateData = {};
    if (typeof uploaded === 'number') updateData.uploaded = uploaded;
    if (typeof downloaded === 'number') updateData.downloaded = downloaded;
    if (typeof bonus_points === 'number') updateData.bonus_points = bonus_points;

    if (Object.keys(updateData).length > 0) {
      await userStats.update(updateData);
    }

    res.json({
      message: '用户统计更新成功',
      stats: userStats.toJSON()
    });

  } catch (error) {
    console.error('更新用户统计失败:', error);
    res.status(500).json({ error: '更新统计失败' });
  }
});

/**
 * 重新计算用户统计 (管理员功能)
 */
router.post('/user/:userId/recalculate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 从下载记录重新计算统计
    const downloadStats = await Download.findAll({
      where: { user_id: userId },
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('uploaded')), 'total_uploaded'],
        [Sequelize.fn('SUM', Sequelize.col('downloaded')), 'total_downloaded'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_torrents']
      ],
      raw: true
    });

    const totalUploaded = parseInt(downloadStats[0]?.total_uploaded) || 0;
    const totalDownloaded = parseInt(downloadStats[0]?.total_downloaded) || 0;
    const totalTorrents = parseInt(downloadStats[0]?.total_torrents) || 0;

    // 计算上传的种子数量
    const uploadedTorrents = await Torrent.count({
      where: { uploader_id: userId }
    });

    // 更新或创建用户统计
    const [userStats] = await UserStats.findOrCreate({
      where: { user_id: userId },
      defaults: {
        uploaded: totalUploaded,
        downloaded: totalDownloaded,
        torrents_uploaded: uploadedTorrents,
        torrents_seeding: 0,
        torrents_leeching: 0
      }
    });

    await userStats.update({
      uploaded: totalUploaded,
      downloaded: totalDownloaded,
      torrents_uploaded: uploadedTorrents
    });

    res.json({
      message: '用户统计重新计算完成',
      stats: userStats.toJSON()
    });

  } catch (error) {
    console.error('重新计算用户统计失败:', error);
    res.status(500).json({ error: '重新计算统计失败' });
  }
});

module.exports = router;

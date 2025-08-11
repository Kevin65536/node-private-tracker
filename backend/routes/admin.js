const express = require('express');
const { Torrent, User, Category, Peer, AnnounceLog, UserStats } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;
const pointsConfig = require('../config/points');
const { PointsLog } = require('../models');

const router = express.Router();

// 获取待审核/已审核的种子列表
router.get('/torrents', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: torrents } = await Torrent.findAndCountAll({
      where: { status },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      attributes: [
        'id', 'name', 'description', 'size', 'status', 
        'created_at', 'updated_at', 'torrent_file',
        'review_reason', 'reviewed_by', 'reviewed_at'
      ],
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username', 'role']
        },
        {
          model: Category,
          attributes: ['id', 'name', 'icon']
        }
      ]
    });

    res.json({
      torrents,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('获取种子列表失败:', error);
    res.status(500).json({
      error: '获取种子列表失败'
    });
  }
});

// 审核种子
router.post('/torrents/:id/review', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        error: '无效的审核操作'
      });
    }

    const torrent = await Torrent.findByPk(id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username']
        }
      ]
    });

    if (!torrent) {
      return res.status(404).json({
        error: '种子不存在'
      });
    }

    if (torrent.status !== 'pending') {
      return res.status(400).json({
        error: '该种子已经审核过了'
      });
    }

    // 更新种子状态
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await torrent.update({
      status: newStatus,
      review_reason: reason || null,
      reviewed_by: req.user.id,
      reviewed_at: new Date()
    });

    // 审核通过后，给上传者一次性奖励（参数化）
    if (newStatus === 'approved' && torrent.uploader) {
      try {
        const { approval } = pointsConfig;
        const sizeGiB = Math.max(0, (parseFloat(torrent.size) || 0) / (1024 * 1024 * 1024));
        const sizeBonus = Math.min(approval.maxSizeBonus, approval.sizeLog2Factor * Math.log2(sizeGiB + 1));
        const totalBonus = Math.round((approval.fixedBonus + sizeBonus) * 100) / 100;
        if (totalBonus > 0) {
          const [stats] = await UserStats.findOrCreate({
            where: { user_id: torrent.uploader.id },
            defaults: { uploaded: 0, downloaded: 0, bonus_points: 0, seedtime: 0, leechtime: 0, torrents_uploaded: 0, torrents_seeding: 0, torrents_leeching: 0, invitations: 0 }
          });
          const current = parseFloat(stats.bonus_points) || 0;
          const next = current + totalBonus;
          await stats.update({ bonus_points: next });

          // 记录积分日志
          try {
            await PointsLog.create({
              user_id: torrent.uploader.id,
              change: totalBonus,
              reason: 'approval_bonus',
              balance_after: next,
              context: { torrent_id: torrent.id, sizeGiB }
            });
          } catch (logErr) {
            console.error('写入审核奖励积分日志失败:', logErr);
          }

          console.log(`[审核奖励] 向用户 ${torrent.uploader.username} 发放 ${totalBonus} 积分 (种子: ${torrent.name})`);
        }
      } catch (awardErr) {
        console.error('发放审核奖励失败:', awardErr);
      }
    }

    // 记录审核日志
    console.log(`[审核] ${req.user.username} ${action === 'approve' ? '通过' : '拒绝'}了种子 "${torrent.name}" (ID: ${torrent.id})`);
    if (reason) {
      console.log(`[审核原因] ${reason}`);
    }

    res.json({
      message: `种子审核${action === 'approve' ? '通过' : '拒绝'}成功`,
      torrent: {
        id: torrent.id,
        name: torrent.name,
        status: newStatus,
        review_reason: reason,
        reviewed_by: req.user.username,
        reviewed_at: new Date()
      }
    });

  } catch (error) {
    console.error('审核种子失败:', error);
    res.status(500).json({
      error: '审核操作失败'
    });
  }
});

// 管理员下载种子文件
router.get('/torrents/:id/download', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const torrent = await Torrent.findByPk(id);
    if (!torrent) {
      return res.status(404).json({
        error: '种子不存在'
      });
    }

    if (!torrent.torrent_file) {
      return res.status(404).json({
        error: '种子文件不存在'
      });
    }

    const filePath = path.join(__dirname, '../uploads', torrent.torrent_file);
    
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        error: '种子文件已丢失'
      });
    }

    // 设置下载响应头
    res.setHeader('Content-Type', 'application/x-bittorrent');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(torrent.name)}.torrent"`);

    // 发送文件
    res.sendFile(filePath);

  } catch (error) {
    console.error('下载种子文件失败:', error);
    res.status(500).json({
      error: '下载失败'
    });
  }
});

// 获取审核统计信息
router.get('/stats/review', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      Torrent.count({ where: { status: 'pending' } }),
      Torrent.count({ where: { status: 'approved' } }),
      Torrent.count({ where: { status: 'rejected' } })
    ]);

    res.json({
      review_stats: {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected
      }
    });

  } catch (error) {
    console.error('获取审核统计失败:', error);
    res.status(500).json({
      error: '获取统计信息失败'
    });
  }
});

// 批量审核
router.post('/torrents/batch-review', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { torrent_ids, action, reason } = req.body;

    if (!Array.isArray(torrent_ids) || torrent_ids.length === 0) {
      return res.status(400).json({
        error: '请选择要审核的种子'
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        error: '无效的审核操作'
      });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    const [affectedCount] = await Torrent.update({
      status: newStatus,
      review_reason: reason || null,
      reviewed_by: req.user.id,
      reviewed_at: new Date()
    }, {
      where: {
        id: torrent_ids,
        status: 'pending'
      }
    });

    console.log(`[批量审核] ${req.user.username} ${action === 'approve' ? '通过' : '拒绝'}了 ${affectedCount} 个种子`);

    // 如果是通过，发放一次性审核奖励
    if (newStatus === 'approved' && affectedCount > 0) {
      try {
        const approvedTorrents = await Torrent.findAll({
          where: { id: torrent_ids, status: 'approved' },
          include: [{ model: User, as: 'uploader', attributes: ['id', 'username'] }]
        });

        const { approval } = pointsConfig;
        for (const t of approvedTorrents) {
          if (!t.uploader) continue;
          const sizeGiB = Math.max(0, (parseFloat(t.size) || 0) / (1024 * 1024 * 1024));
          const sizeBonus = Math.min(approval.maxSizeBonus, approval.sizeLog2Factor * Math.log2(sizeGiB + 1));
          const totalBonus = Math.round((approval.fixedBonus + sizeBonus) * 100) / 100;
          if (totalBonus > 0) {
            const [stats] = await UserStats.findOrCreate({
              where: { user_id: t.uploader.id },
              defaults: { uploaded: 0, downloaded: 0, bonus_points: 0, seedtime: 0, leechtime: 0, torrents_uploaded: 0, torrents_seeding: 0, torrents_leeching: 0, invitations: 0 }
            });
            const current = parseFloat(stats.bonus_points) || 0;
            const next = current + totalBonus;
            await stats.update({ bonus_points: next });

            try {
              await PointsLog.create({
                user_id: t.uploader.id,
                change: totalBonus,
                reason: 'approval_bonus',
                balance_after: next,
                context: { torrent_id: t.id, sizeGiB }
              });
            } catch (logErr) {
              console.error('写入审核奖励积分日志失败:', logErr);
            }

            console.log(`[审核奖励-批量] 向用户 ${t.uploader.username} 发放 ${totalBonus} 积分 (种子: ${t.name})`);
          }
        }
      } catch (batchAwardErr) {
        console.error('批量审核奖励发放失败:', batchAwardErr);
      }
    }

    res.json({
      message: `批量审核成功，${action === 'approve' ? '通过' : '拒绝'}了 ${affectedCount} 个种子`,
      affected_count: affectedCount
    });

  } catch (error) {
    console.error('批量审核失败:', error);
    res.status(500).json({
      error: '批量审核操作失败'
    });
  }
});

// 删除种子 - 仅超级管理员可以删除
router.delete('/torrents/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const torrent = await Torrent.findByPk(id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username']
        }
      ]
    });

    if (!torrent) {
      return res.status(404).json({
        error: '种子不存在'
      });
    }

    // 记录删除日志
    console.log(`[删除种子] ${req.user.username} 删除了种子 "${torrent.name}" (ID: ${torrent.id})`);
    if (reason) {
      console.log(`[删除原因] ${reason}`);
    }

    // 删除种子文件
    if (torrent.torrent_file) {
      const filePath = path.join(__dirname, '../uploads', torrent.torrent_file);
      try {
        await fs.unlink(filePath);
        console.log(`[文件删除] 成功删除种子文件: ${torrent.torrent_file}`);
      } catch (error) {
        console.warn(`[文件删除] 删除种子文件失败: ${torrent.torrent_file}`, error.message);
      }
    }

    // 从数据库删除种子记录
    await torrent.destroy();

    res.json({
      message: '种子删除成功',
      deleted_torrent: {
        id: torrent.id,
        name: torrent.name,
        uploader: torrent.uploader?.username || '未知',
        deleted_by: req.user.username,
        deleted_at: new Date(),
        reason: reason || null
      }
    });

  } catch (error) {
    console.error('删除种子失败:', error);
    res.status(500).json({
      error: '删除种子失败'
    });
  }
});

// 批量删除种子 - 仅超级管理员可以删除
router.post('/torrents/batch-delete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { torrent_ids, reason } = req.body;

    if (!Array.isArray(torrent_ids) || torrent_ids.length === 0) {
      return res.status(400).json({
        error: '请选择要删除的种子'
      });
    }

    // 获取要删除的种子信息
    const torrents = await Torrent.findAll({
      where: { id: torrent_ids },
      attributes: ['id', 'name', 'torrent_file']
    });

    if (torrents.length === 0) {
      return res.status(404).json({
        error: '未找到要删除的种子'
      });
    }

    // 删除种子文件
    const fileDeletePromises = torrents.map(async (torrent) => {
      if (torrent.torrent_file) {
        const filePath = path.join(__dirname, '../uploads', torrent.torrent_file);
        try {
          await fs.unlink(filePath);
          console.log(`[批量文件删除] 成功删除种子文件: ${torrent.torrent_file}`);
        } catch (error) {
          console.warn(`[批量文件删除] 删除种子文件失败: ${torrent.torrent_file}`, error.message);
        }
      }
    });

    await Promise.allSettled(fileDeletePromises);

    // 从数据库删除种子记录
    const deletedCount = await Torrent.destroy({
      where: { id: torrent_ids }
    });

    console.log(`[批量删除] ${req.user.username} 删除了 ${deletedCount} 个种子`);
    if (reason) {
      console.log(`[批量删除原因] ${reason}`);
    }

    res.json({
      message: `批量删除成功，删除了 ${deletedCount} 个种子`,
      deleted_count: deletedCount,
      deleted_by: req.user.username,
      deleted_at: new Date(),
      reason: reason || null
    });

  } catch (error) {
    console.error('批量删除种子失败:', error);
    res.status(500).json({
      error: '批量删除操作失败'
    });
  }
});

// Peer监控相关API
// 获取peer统计信息
router.get('/peers/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 获取peer统计按info_hash分组
    const stats = await Peer.findAll({
      attributes: [
        'info_hash',
        [Peer.sequelize.fn('COUNT', Peer.sequelize.col('Peer.id')), 'total_peers'],
        [Peer.sequelize.fn('COUNT', Peer.sequelize.literal('CASE WHEN "Peer"."left" = \'0\' THEN 1 END')), 'total_seeders'],
        [Peer.sequelize.fn('COUNT', Peer.sequelize.literal('CASE WHEN "Peer"."left" != \'0\' THEN 1 END')), 'total_leechers']
      ],
      group: ['info_hash'],
      raw: true
    });

    // 获取状态分布统计
    const statusBreakdown = await Peer.findAll({
      attributes: [
        'status',
        [Peer.sequelize.fn('COUNT', Peer.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // 获取活跃用户数（最近24小时有通告的用户）
    const activeUsersCount = await Peer.count({
      distinct: true,
      col: 'user_id',
      where: {
        last_announce: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时前
        }
      }
    });

    // 获取种子信息
    const torrentsWithInfoHash = await Torrent.findAll({
      attributes: ['id', 'name', 'size', 'info_hash']
    });

    // 创建info_hash到torrent的映射
    const infoHashToTorrent = {};
    torrentsWithInfoHash.forEach(torrent => {
      if (torrent.info_hash) {
        infoHashToTorrent[torrent.info_hash] = {
          id: torrent.id,
          name: torrent.name,
          size: torrent.size
        };
      }
    });

    const totalStats = {
      total_torrents: stats.length,
      total_peers: stats.reduce((sum, stat) => sum + parseInt(stat.total_peers || 0), 0),
      total_seeders: stats.reduce((sum, stat) => sum + parseInt(stat.total_seeders || 0), 0),
      total_leechers: stats.reduce((sum, stat) => sum + parseInt(stat.total_leechers || 0), 0),
      active_users: activeUsersCount
    };

    res.json({
      summary: totalStats,
      status_breakdown: statusBreakdown.map(stat => ({
        status: stat.status,
        count: parseInt(stat.count || 0)
      })),
      torrents: stats.map(stat => ({
        info_hash: stat.info_hash,
        torrent: infoHashToTorrent[stat.info_hash] || null,
        peer_count: parseInt(stat.total_peers || 0),
        seeders: parseInt(stat.total_seeders || 0),
        leechers: parseInt(stat.total_leechers || 0)
      }))
    });
  } catch (error) {
    console.error('获取peer统计失败:', error);
    res.status(500).json({ error: '获取peer统计失败' });
  }
});

// 获取活跃peer列表
router.get('/peers/active', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const peers = await Peer.findAll({
      limit: parseInt(limit),
      offset,
      order: [['updated_at', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'role']
        },
        {
          model: Torrent,
          attributes: ['id', 'name', 'size']
        }
      ]
    });

    const total = await Peer.count();

    res.json({
      peers: peers.map(peer => ({
        id: peer.id,
        user: peer.User,
        torrent: peer.Torrent,
        ip: peer.ip,
        port: peer.port,
        uploaded: peer.uploaded,
        downloaded: peer.downloaded,
        left: peer.left,
        status: peer.status, // 返回状态
        is_seeder: String(peer.left) === '0',
        last_announce: peer.last_announce || peer.updated_at, // 使用last_announce更准确
        user_agent: peer.user_agent // 返回客户端信息
      })),
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取活跃peer失败:', error);
    res.status(500).json({ error: '获取活跃peer失败' });
  }
});

// 获取最近的announce记录
router.get('/announces/recent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await AnnounceLog.findAndCountAll({
      limit: parseInt(limit),
      offset,
      order: [['announced_at', 'DESC']],
      include: [
        { model: Torrent, attributes: ['id', 'name', 'size'] },
        { model: User, attributes: ['id', 'username'] }
      ]
    });

    const announces = rows.map(a => ({
      id: a.id,
      user: a.User ? { id: a.User.id, username: a.User.username } : null,
      torrent: a.Torrent ? { id: a.Torrent.id, name: a.Torrent.name, size: a.Torrent.size } : null,
      ip: a.ip,
      port: a.port,
      event: a.event || 'update',
      uploaded: a.uploaded,
      downloaded: a.downloaded,
      left: a.left,
      response_time: a.response_time,
      timestamp: a.announced_at
    }));

    res.json({
      announces,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取最近的announce记录失败:', error);
    res.status(500).json({ error: '获取最近的announce记录失败' });
  }
});

module.exports = router;

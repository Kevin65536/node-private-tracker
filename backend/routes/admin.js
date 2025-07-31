const express = require('express');
const { Torrent, User, Category } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const path = require('path');
const fs = require('fs').promises;

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

module.exports = router;

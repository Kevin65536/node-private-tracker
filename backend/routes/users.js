const express = require('express');
const { Op } = require('sequelize');
const { User, UserStats, Torrent, Download } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// 获取当前用户信息
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: UserStats,
        as: 'UserStat'
      }]
    });

    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    res.json({
      user: user.toJSON()
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      error: '获取用户信息失败'
    });
  }
});

// 更新用户资料
router.put('/profile', authenticateToken, [
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('请输入当前密码'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('新密码长度不能少于6位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('新密码必须包含大小写字母和数字')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入验证失败',
        details: errors.array()
      });
    }

    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const updateData = {};

    // 更新邮箱
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          error: '邮箱已被使用'
        });
      }
      updateData.email = email;
    }

    // 更新密码
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          error: '更改密码需要提供当前密码'
        });
      }

      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          error: '当前密码错误'
        });
      }

      updateData.password = newPassword;
    }

    if (Object.keys(updateData).length > 0) {
      await user.update(updateData);
    }

    res.json({
      message: '资料更新成功',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({
      error: '更新资料失败'
    });
  }
});

// 获取用户统计信息
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await UserStats.findOne({
      where: { user_id: req.user.id }
    });

    if (!stats) {
      return res.status(404).json({
        error: '统计信息不存在'
      });
    }

    // 获取用户上传的种子数量
    const uploadedCount = await Torrent.count({
      where: { uploader_id: req.user.id }
    });

    // 获取正在进行的下载数量
    const activeDownloads = await Download.count({
      where: { 
        user_id: req.user.id,
        status: ['downloading', 'seeding']
      }
    });

    res.json({
      stats: {
        ...stats.toJSON(),
        uploaded_torrents: uploadedCount,
        active_downloads: activeDownloads,
        ratio: stats.ratio
      }
    });

  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({
      error: '获取统计信息失败'
    });
  }
});

// 获取用户列表 (管理员)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [{
        model: UserStats,
        as: 'UserStat'
      }]
    });

    res.json({
      users,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(count / limit),
        total_count: count,
        per_page: limit
      }
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      error: '获取用户列表失败'
    });
  }
});

// 管理用户状态 (管理员)
router.patch('/:id/status', authenticateToken, requireAdmin, [
  body('status')
    .isIn(['active', 'inactive', 'banned'])
    .withMessage('无效的状态值')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入验证失败',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 防止管理员禁用自己
    if (user.id === req.user.id && status !== 'active') {
      return res.status(400).json({
        error: '不能修改自己的账户状态'
      });
    }

    await user.update({ status });

    res.json({
      message: '用户状态更新成功',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({
      error: '更新用户状态失败'
    });
  }
});

module.exports = router;

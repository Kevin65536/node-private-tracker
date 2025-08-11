const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { User, UserStats, Torrent, Download, PointsLog } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { getOrCreatePasskey, regeneratePasskey, buildAnnounceUrl } = require('../utils/passkey');

const router = express.Router();

// 确保头像上传目录存在
const avatarUploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

// 头像上传配置
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarUploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：用户ID + 时间戳 + 原始扩展名
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `avatar-${req.user.id}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// 头像文件过滤器
const avatarFileFilter = (req, file, cb) => {
  // 只允许图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 限制
  },
  fileFilter: avatarFileFilter
});

// 获取用户 passkey
router.get('/passkey', authenticateToken, async (req, res) => {
  try {
    const passkey = await getOrCreatePasskey(req.user.id);
    const announceUrl = buildAnnounceUrl(passkey);
    
    res.json({
      passkey,
      announce_url: announceUrl,
      usage_info: {
        description: '在制作种子时使用此 Tracker URL',
        instructions: [
          '1. 在 qBittorrent 中选择"创建种子"',
          '2. 在 "Tracker URL" 字段中填入上述地址',
          '3. 勾选"私有种子"选项',
          '4. 完成种子制作后上传到 PT 站'
        ],
        security_notice: '请勿将您的 passkey 分享给其他人'
      }
    });
  } catch (error) {
    console.error('获取 passkey 错误:', error);
    res.status(500).json({
      error: '获取 passkey 失败'
    });
  }
});

// 重新生成 passkey
router.post('/passkey/regenerate', authenticateToken, async (req, res) => {
  try {
    const newPasskey = await regeneratePasskey(req.user.id);
    const announceUrl = buildAnnounceUrl(newPasskey);
    
    res.json({
      message: 'Passkey 重新生成成功',
      passkey: newPasskey,
      announce_url: announceUrl,
      warning: '旧的 passkey 已失效，请更新您的种子客户端配置'
    });
  } catch (error) {
    console.error('重新生成 passkey 错误:', error);
    res.status(500).json({
      error: '重新生成 passkey 失败'
    });
  }
});

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

// 上传用户头像
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: '请选择要上传的头像文件'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 删除旧头像文件（如果存在）
    if (user.avatar) {
      const oldAvatarPath = path.join(avatarUploadDir, path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        try {
          fs.unlinkSync(oldAvatarPath);
        } catch (error) {
          console.warn('删除旧头像文件失败:', error);
        }
      }
    }

    // 更新用户头像路径
    const avatarFileName = req.file.filename;
    await user.update({
      avatar: avatarFileName
    });

    res.json({
      message: '头像上传成功',
      avatar: avatarFileName,
      avatar_url: `/uploads/avatars/${avatarFileName}`
    });

  } catch (error) {
    console.error('上传头像错误:', error);
    
    // 如果上传过程中出错，删除已上传的文件
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (deleteError) {
          console.warn('删除上传失败的文件出错:', deleteError);
        }
      }
    }
    
    res.status(500).json({
      error: '头像上传失败'
    });
  }
});

// 删除用户头像
router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 删除头像文件（如果存在）
    if (user.avatar) {
      const avatarPath = path.join(avatarUploadDir, path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) {
        try {
          fs.unlinkSync(avatarPath);
        } catch (error) {
          console.warn('删除头像文件失败:', error);
        }
      }
    }

    // 清除数据库中的头像记录
    await user.update({
      avatar: null
    });

    res.json({
      message: '头像删除成功'
    });

  } catch (error) {
    console.error('删除头像错误:', error);
    res.status(500).json({
      error: '删除头像失败'
    });
  }
});

// 获取用户统计信息
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // 获取用户统计数据
    const stats = await UserStats.findOne({
      where: { user_id: req.user.id }
    });

    // 获取用户信息
    const user = await User.findByPk(req.user.id);

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
        uploaded: parseFloat(stats.uploaded) || 0,
        downloaded: parseFloat(stats.downloaded) || 0,
        bonus_points: parseFloat(stats.bonus_points) || 0,
        seedtime: parseInt(stats.seedtime) || 0,
        leechtime: parseInt(stats.leechtime) || 0,
        uploaded_torrents: uploadedCount,
        active_downloads: activeDownloads,
        ratio: stats.ratio,
        // 添加用户信息
        user_level: user.role === 'admin' ? '管理员' : '普通用户',
        registration_date: user.created_at || user.createdAt,
        last_active: user.last_login || user.updated_at
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

// 获取用户积分日志（支持分页与按原因筛选）
router.get('/points-log', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const reason = req.query.reason;
    const offset = (page - 1) * limit;

    const where = { user_id: req.user.id };
    if (reason) where.reason = reason;

    const { count, rows } = await PointsLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const logs = rows.map((r) => ({
      id: r.id,
      change: parseFloat(r.change),
      reason: r.reason,
      balance_after: r.balance_after != null ? parseFloat(r.balance_after) : null,
      context: r.context || null,
      created_at: r.created_at
    }));

    res.json({
      logs,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: limit
      }
    });
  } catch (error) {
    console.error('获取积分日志失败:', error);
    res.status(500).json({ error: '获取积分日志失败' });
  }
});

module.exports = router;

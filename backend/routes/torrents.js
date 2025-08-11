const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const bencode = require('bncode');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Torrent, User, Category, Download, UserStats, InfoHashVariant, AnnounceLog, sequelize } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { getOrCreatePasskey, buildAnnounceUrl } = require('../utils/passkey');
const { body, validationResult } = require('express-validator');
const { peerManager } = require('../utils/tracker');
const pointsConfig = require('../config/points');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${randomString}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'torrent' && !file.originalname.endsWith('.torrent')) {
      return cb(new Error('只能上传.torrent文件'));
    }
    if (file.fieldname === 'images') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('只能上传JPEG、PNG或GIF图片'));
      }
    }
    cb(null, true);
  }
});

// 解析种子文件并提取信息
const parseTorrentFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath);
    const torrent = bencode.decode(data);
    
    if (!torrent.info) {
      throw new Error('无效的种子文件：缺少info字段');
    }
    
    // 计算info_hash
    const infoBuffer = bencode.encode(torrent.info);
    const infoHash = crypto.createHash('sha1').update(infoBuffer).digest('hex');
    
    // 验证是否为私有种子
    if (!torrent.info.private || torrent.info.private !== 1) {
      throw new Error('只能上传私有种子文件（private=1）');
    }
    
    // 安全的字符串转换函数
    const bufferToString = (buffer) => {
      if (Buffer.isBuffer(buffer)) {
        return buffer.toString('utf8');
      }
      return buffer;
    };
    
    // 计算文件大小和数量
    let totalSize = 0;
    let fileCount = 1;
    let files = [];
    
    if (torrent.info.files) {
      // 多文件种子
      fileCount = torrent.info.files.length;
      torrent.info.files.forEach(file => {
        totalSize += file.length;
        files.push({
          path: file.path.map(bufferToString).join('/'),
          length: file.length
        });
      });
    } else {
      // 单文件种子
      totalSize = torrent.info.length;
      files.push({
        path: bufferToString(torrent.info.name),
        length: torrent.info.length
      });
    }
    
    // 提取其他信息
    const pieceLength = torrent.info['piece length'];
    const piecesBuffer = torrent.info.pieces;
    const pieceCount = piecesBuffer ? Math.floor(piecesBuffer.length / 20) : 0;
    
    return {
      name: bufferToString(torrent.info.name),
      info_hash: infoHash,
      total_size: totalSize,
      file_count: fileCount,
      piece_length: pieceLength,
      piece_count: pieceCount,
      files,
      announce: torrent.announce ? bufferToString(torrent.announce) : null,
      announce_list: torrent['announce-list'] || [],
      comment: torrent.comment ? bufferToString(torrent.comment) : null,
      created_by: torrent['created by'] ? bufferToString(torrent['created by']) : null,
      creation_date: torrent['creation date'] ? new Date(torrent['creation date'] * 1000) : null
    };
  } catch (error) {
    console.error('解析种子文件失败:', error);
    throw new Error(`种子文件解析失败: ${error.message}`);
  }
};

// 获取种子列表
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;
    const sort = req.query.sort || 'created_at';
    const order = req.query.order || 'DESC';

    const where = {
      status: 'approved'
    };

    if (category) {
      where.category_id = category;
    }

    if (search) {
      where.name = {
        [Op.iLike]: `%${search}%`
      };
    }

    const { count, rows: torrents } = await Torrent.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sort, order]],
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username']
        },
        {
          model: Category,
          attributes: ['id', 'name', 'icon']
        }
      ]
    });

    // 为每个种子添加实时统计信息
    const torrentsWithStats = await Promise.all(
      torrents.map(async (torrent) => {
        const torrentData = torrent.toJSON();
        
        try {
          // 获取实时tracker统计
          if (torrent.info_hash) {
            const trackerStats = peerManager.getTorrentStats(torrent.info_hash);
            
            // 获取完成下载的总数 (从AnnounceLog表统计completed事件)
            const completedCount = await AnnounceLog.count({
              where: { 
                torrent_id: torrent.id,
                event: 'completed'
              },
              distinct: true,
              col: 'user_id' // 按用户去重，避免同一用户多次完成被重复计算
            });
            
            // 添加实时统计信息
            torrentData.real_time_stats = {
              seeders: trackerStats.complete || 0,
              leechers: trackerStats.incomplete || 0,
              completed: completedCount,
              last_updated: new Date()
            };
            
            // 保持向后兼容
            torrentData.seeders = trackerStats.complete || 0;
            torrentData.leechers = trackerStats.incomplete || 0;
            torrentData.completed = completedCount;
          } else {
            // 如果没有info_hash，使用数据库中的静态值
            torrentData.real_time_stats = {
              seeders: torrent.seeders || 0,
              leechers: torrent.leechers || 0,
              completed: torrent.completed || 0,
              last_updated: new Date()
            };
          }
        } catch (error) {
          console.error(`获取种子 ${torrent.id} 实时统计失败:`, error);
          // 使用数据库中的静态值作为后备
          torrentData.real_time_stats = {
            seeders: torrent.seeders || 0,
            leechers: torrent.leechers || 0,
            completed: torrent.completed || 0,
            last_updated: new Date()
          };
        }
        
        return torrentData;
      })
    );

    res.json({
      torrents: torrentsWithStats,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(count / limit),
        total_count: count,
        per_page: limit
      }
    });

  } catch (error) {
    console.error('获取种子列表错误:', error);
    res.status(500).json({
      error: '获取种子列表失败'
    });
  }
});

// 可选认证中间件 - 如果有token则验证，没有则继续
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // 认证失败也继续，只是不设置user
    next();
  }
};

// 获取种子详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const torrent = await Torrent.findByPk(req.params.id, {
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

    if (!torrent) {
      return res.status(404).json({
        error: '种子不存在'
      });
    }

    // 权限检查：管理员可以查看所有状态的种子，普通用户只能查看已审核通过的种子
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin && torrent.status !== 'approved') {
      return res.status(404).json({
        error: '种子尚未审核通过'
      });
    }

    // 获取种子文件详细信息
    let torrentFileInfo = null;
    if (torrent.torrent_file) {
      try {
        const filePath = path.join(__dirname, '../uploads', torrent.torrent_file);
        await fs.access(filePath);
        torrentFileInfo = await parseTorrentFile(filePath);
      } catch (error) {
        console.error('解析种子文件失败:', error);
      }
    }

    // 获取下载统计（数据库历史记录）
    const downloadStats = await Download.findAll({
      where: { torrent_id: torrent.id },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const stats = {
      downloading: 0,
      seeding: 0,
      completed: 0,
      stopped: 0
    };

    downloadStats.forEach(stat => {
      stats[stat.status] = parseInt(stat.count);
    });

    // 获取实时tracker统计
    let realTimeStats = null;
    try {
      if (torrent.info_hash) {
        const trackerStats = peerManager.getTorrentStats(torrent.info_hash);
        const activePeers = peerManager.getPeers(torrent.info_hash);
        
        realTimeStats = {
          seeders: trackerStats.complete,
          leechers: trackerStats.incomplete,
          total_peers: activePeers.length,
          last_updated: new Date()
        };
        
        console.log(`📊 实时统计 ${torrent.info_hash}: 做种${trackerStats.complete} 下载${trackerStats.incomplete}`);
      }
    } catch (error) {
      console.error('获取实时tracker统计失败:', error);
      // 如果获取实时统计失败，继续使用数据库统计
    }

    res.json({
      torrent: {
        ...torrent.toJSON(),
        file_info: torrentFileInfo,
        download_stats: stats,
        real_time_stats: realTimeStats
      }
    });

  } catch (error) {
    console.error('获取种子详情错误:', error);
    res.status(500).json({
      error: '获取种子详情失败'
    });
  }
});

// 上传种子 - 完整实现版本
router.post('/', authenticateToken, upload.fields([
  { name: 'torrent', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), [
  body('name')
    .notEmpty()
    .withMessage('种子名称不能为空')
    .isLength({ max: 255 })
    .withMessage('种子名称过长'),
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('描述过长'),
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('请选择有效的分类')
], async (req, res) => {
  try {
    // 所有已登录用户都可以上传种子

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入验证失败',
        details: errors.array()
      });
    }

    if (!req.files || !req.files.torrent) {
      return res.status(400).json({
        error: '请上传种子文件'
      });
    }

    const torrentFile = req.files.torrent[0];
    const { name, description, category_id, tags } = req.body;

    // 验证分类是否存在
    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(400).json({
        error: '分类不存在'
      });
    }

    // 解析种子文件
    let torrentInfo;
    try {
      torrentInfo = await parseTorrentFile(torrentFile.path);
    } catch (parseError) {
      // 删除上传的文件
      await fs.unlink(torrentFile.path).catch(() => {});
      return res.status(400).json({
        error: '种子文件解析失败',
        message: parseError.message
      });
    }

    // 检查是否已存在相同的种子
    const existingTorrent = await Torrent.findOne({
      where: { info_hash: torrentInfo.info_hash }
    });

    if (existingTorrent) {
      // 删除上传的文件
      await fs.unlink(torrentFile.path).catch(() => {});
      return res.status(400).json({
        error: '该种子已存在',
        existing_torrent: {
          id: existingTorrent.id,
          name: existingTorrent.name
        }
      });
    }

    // 处理图片文件
    let imageFiles = [];
    if (req.files.images) {
      imageFiles = req.files.images.map(file => file.filename);
    }

    // 创建种子记录
    const torrent = await Torrent.create({
      name,
      description,
      info_hash: torrentInfo.info_hash,
      size: torrentInfo.total_size,
      file_count: torrentInfo.file_count,
      uploader_id: req.user.id,
      category_id,
      torrent_file: torrentFile.filename,
      image_files: imageFiles,
      tags: tags ? JSON.parse(tags) : null,
      status: 'pending', // 需要管理员审核
      seeders: 0,
      leechers: 0,
      completed: 0
    });

    // 更新用户统计
    const userStats = await UserStats.findOne({
      where: { user_id: req.user.id }
    });

    if (userStats) {
      await userStats.increment('torrents_uploaded');
    }

    // 返回成功响应，包含种子详细信息
    res.status(201).json({
      message: '种子上传成功，等待管理员审核',
      torrent: {
        id: torrent.id,
        name: torrent.name,
        info_hash: torrent.info_hash,
        size: torrent.size,
        file_count: torrent.file_count,
        status: torrent.status,
        torrent_info: {
          pieces: torrentInfo.piece_count,
          piece_length: torrentInfo.piece_length,
          files: torrentInfo.files || []
        }
      }
    });

  } catch (error) {
    console.error('上传种子错误:', error);
    
    // 清理上传的文件
    if (req.files) {
      for (const fileArray of Object.values(req.files)) {
        for (const file of fileArray) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('删除文件失败:', unlinkError);
          }
        }
      }
    }

    res.status(500).json({
      error: '上传种子失败',
      message: error.message
    });
  }
});

// 下载种子文件
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const torrent = await Torrent.findByPk(req.params.id, {
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

    if (torrent.status !== 'approved') {
      return res.status(404).json({
        error: '种子尚未审核通过'
      });
    }

    const filePath = path.join(__dirname, '../uploads', torrent.torrent_file);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        error: '种子文件不存在'
      });
    }

    // 记录下载记录
    const [download, created] = await Download.findOrCreate({
      where: {
        user_id: req.user.id,
        torrent_id: torrent.id
      },
      defaults: {
        status: 'downloading',
        left: torrent.size,
        uploaded: 0,
        downloaded: 0,
        ip: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent') || ''
      }
    });

    if (!created) {
      // 更新最后下载时间
      await download.update({
        last_announce: new Date(),
        ip: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent') || ''
      });
    }

    // 读取种子文件并修改announce URL
    const torrentData = await fs.readFile(filePath);
    const torrentObject = bencode.decode(torrentData);
    
    // 获取用户的 passkey
    const userPasskey = await getOrCreatePasskey(req.user.id);
    
    // 设置我们的tracker URL with passkey
    const announceUrl = buildAnnounceUrl(userPasskey);
    torrentObject.announce = Buffer.from(announceUrl);
    
    // 添加额外的tracker信息
    if (!torrentObject['announce-list']) {
      torrentObject['announce-list'] = [];
    }
    torrentObject['announce-list'].unshift([torrentObject.announce]);
    
    // 注意：不修改 torrentObject.info 部分，以保持 info_hash 一致
    // 原始种子应该已经设置了 private 标记
    
    // 重新编码种子文件
    const modifiedTorrentData = bencode.encode(torrentObject);

    // info_hash 应该与原始种子完全相同
    const infoBuffer = bencode.encode(torrentObject.info);
    const infoHash = crypto.createHash('sha1').update(infoBuffer).digest('hex');
    
    // 验证 info_hash 是否与数据库中的一致
    if (infoHash !== torrent.info_hash) {
      console.warn(`⚠️  警告：计算的 info_hash (${infoHash}) 与数据库中的不匹配 (${torrent.info_hash})`);
      console.warn(`   种子ID: ${torrent.id}, 名称: ${torrent.name}`);
      console.warn(`   用户: ${req.user.username}, 这可能导致tracker问题`);
    } else {
      console.log(`✅ info_hash 验证通过: ${infoHash} (用户: ${req.user.username})`);
    }

    // 设置下载响应头
    res.setHeader('Content-Type', 'application/x-bittorrent');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(torrent.name)}.torrent"`);
    res.setHeader('Content-Length', modifiedTorrentData.length);

    // 发送修改后的种子文件
    res.send(modifiedTorrentData);

    // 异步更新统计信息
    setImmediate(async () => {
      try {
        // 更新用户统计
        const userStats = await UserStats.findOne({
          where: { user_id: req.user.id }
        });
        
        if (userStats) {
          await userStats.increment('torrents_leeching');
        }
        
        // 更新种子的下载次数（如果是新下载）
        if (created) {
          await torrent.increment('leechers');
        }
      } catch (error) {
        console.error('更新统计信息失败:', error);
      }
    });

  } catch (error) {
    console.error('下载种子文件错误:', error);
    res.status(500).json({
      error: '下载失败',
      message: error.message
    });
  }
});

// 获取分类列表
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { active: true },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      categories
    });

  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({
      error: '获取分类列表失败'
    });
  }
});

module.exports = router;

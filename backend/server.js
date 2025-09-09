const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// 自动设置网络配置
const { setupAnnounceUrl, getAllIPs } = require('./utils/network');

// 导入数据库
const { sequelize } = require('./models');

// 导入路由
const authRoutes = require('./routes/auth');
const torrentRoutes = require('./routes/torrents');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const trackerRoutes = require('./routes/tracker');
const statsRoutes = require('./routes/stats');
const securityRoutes = require('./routes/security');
const announcementRoutes = require('./routes/announcements');
const toolsRoutes = require('./routes/tools');

// 导入统计调度器
const statsScheduler = require('./utils/statsScheduler');

// 导入PeerManager恢复功能
async function restorePeerManagerFromDatabase() {
  try {
    const { Peer } = require('./models');
    const { Op } = require('sequelize');
    const { peerManager } = require('./utils/tracker');
    
    console.log('🔄 正在从数据库恢复PeerManager状态...');
    
    // 获取所有活跃的peer (最近30分钟内有announce)
    const activePeers = await Peer.findAll({
      where: {
        last_announce: {
          [Op.gte]: new Date(Date.now() - 30 * 60 * 1000)
        }
      }
    });

    let restoredCount = 0;
    for (const peer of activePeers) {
      try {
        peerManager.addPeer(peer.info_hash, {
          user_id: peer.user_id,
          peer_id: peer.peer_id,
          ip: peer.ip,
          port: peer.port,
          uploaded: parseInt(peer.uploaded),
          downloaded: parseInt(peer.downloaded),
          left: parseInt(peer.left)
        });
        restoredCount++;
      } catch (error) {
        console.error(`恢复peer失败: ${error.message}`);
      }
    }
    
    console.log(`✅ 已恢复 ${restoredCount}/${activePeers.length} 个活跃peer到内存`);
  } catch (error) {
    console.error('❌ PeerManager恢复失败:', error);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// 信任代理 (用于获取客户端真实IP)
app.set('trust proxy', true);

// 中间件
app.use(helmet({
  contentSecurityPolicy: false // 暂时禁用CSP进行调试
}));
// 配置CORS - 使用动态IP配置
const corsOrigins = [
  'http://localhost:3000', 
  'http://127.0.0.1:3000',
  /^http:\/\/172\.21\.\d+\.\d+:3000$/,  // 允许同网段的其他设备
  /^http:\/\/192\.168\.\d+\.\d+:3000$/, // 支持常见内网段
  /^http:\/\/10\.\d+\.\d+\.\d+:3000$/   // 支持10.x.x.x网段
];

// 添加当前检测到的IP
if (process.env.CURRENT_IP) {
  corsOrigins.push(`http://${process.env.CURRENT_IP}:3000`);
}

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : corsOrigins,
  credentials: true,
  optionsSuccessStatus: 200 // 支持旧版本浏览器
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 添加CORS头
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// 数据库连接测试中间件
app.use(async (req, res, next) => {
  try {
    await sequelize.authenticate();
    next();
  } catch (error) {
    console.error('数据库连接失败:', error);
    res.status(503).json({ 
      error: '数据库服务不可用',
      message: '请联系管理员检查数据库连接'
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PT站服务正常运行',
    timestamp: new Date().toISOString(),
    tracker: 'enabled'
  });
});

// API健康检查路由
app.get('/api/health', async (req, res) => {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    
    // 获取一些基本统计信息
    const { User, Category, Torrent, Download } = require('./models');
    const stats = {
      users: await User.count(),
      categories: await Category.count(),
      torrents: await Torrent.count(),
      downloads: await Download.count()
    };
    
    res.json({ 
      status: 'OK', 
      message: 'PT站API服务正常运行（数据库模式）',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        dialect: sequelize.getDialect(),
        stats
      },
      tracker: {
        enabled: true,
        announceUrl: process.env.ANNOUNCE_URL || `http://localhost:${PORT}/announce`
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: '服务不可用',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 种子发布页面的基本信息
app.get('/api/upload/info', async (req, res) => {
  try {
    const { Category } = require('./models');
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'description'],
      order: [['name', 'ASC']]
    });
    
    res.json({
      categories,
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 100000000,
      allowedTypes: ['.torrent'],
      announceUrl: process.env.ANNOUNCE_URL || `http://localhost:${PORT}/announce`
    });
  } catch (error) {
    console.error('获取上传信息失败:', error);
    res.status(500).json({ error: '获取上传信息失败' });
  }
});

// 站点统计端点
app.get('/api/stats', async (req, res) => {
  try {
    const { User, Torrent, UserStats, Category, Download } = require('./models');
    
    const [
      totalUsers,
      totalTorrents,
      approvedTorrents,
      totalCategories,
      totalDownloads
    ] = await Promise.all([
      User.count(),
      Torrent.count(),
      Torrent.count({ where: { status: 'approved' } }),
      Category.count(),
      Download.count()
    ]);

    // 计算总上传和下载量
    const stats = await UserStats.findAll({
      attributes: [
        [sequelize.fn('sum', sequelize.col('uploaded')), 'totalUploaded'],
        [sequelize.fn('sum', sequelize.col('downloaded')), 'totalDownloaded']
      ]
    });

    res.json({
      stats: {
        total_users: totalUsers,
        active_users: totalUsers, // 不再区分活跃用户，直接使用总用户数
        total_torrents: totalTorrents,
        approved_torrents: approvedTorrents,
        pending_torrents: totalTorrents - approvedTorrents,
        total_categories: totalCategories,
        total_downloads: totalDownloads,
        tracker_enabled: true
      },
      traffic: {
        totalUploaded: parseInt(stats[0]?.dataValues?.totalUploaded || 0),
        totalDownloaded: parseInt(stats[0]?.dataValues?.totalDownloaded || 0)
      }
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/torrents', torrentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/security', securityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/tools', toolsRoutes);

// Tracker 路由 (放在最后，避免拦截其他路由)
app.use('/tracker', trackerRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    error: '请求的资源不存在',
    path: req.path,
    method: req.method
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  console.error('请求来源:', req.headers.origin);
  console.error('请求方法:', req.method);
  console.error('请求路径:', req.path);
  
  // Sequelize错误处理
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: '数据验证失败',
      details: err.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: '数据冲突',
      message: '该记录已存在'
    });
  }
  
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请联系管理员',
    timestamp: new Date().toISOString()
  });
});

// 数据库连接和服务器启动
async function startServer() {
  try {
    // 1. 首先设置网络配置
    console.log('🌐 正在配置网络设置...');
    
    // 显示所有可用的IP地址
    const allIPs = getAllIPs();
    console.log('📋 检测到的网络接口:');
    allIPs.forEach(ip => {
      const typeIcon = ip.type === 'private' ? '🏠' : 
                      ip.type === 'public' ? '🌐' : '🔄';
      console.log(`   ${typeIcon} ${ip.interface}: ${ip.ip} (${ip.type})`);
    });
    
    // 自动设置 Announce URL
    const networkConfig = setupAnnounceUrl(PORT);
    console.log('');
    
    // 2. 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 同步数据库表 (开发环境)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ 数据库表同步完成');
      
      // 初始化用户 passkey
      await initializeUserPasskeys();
      
      // 恢复PeerManager状态
      await restorePeerManagerFromDatabase();
    } else {
      // 生产环境使用更安全的同步
      await sequelize.sync({ alter: false });
      console.log('✅ 数据库同步完成');
      
      // 初始化公告系统
      try {
        const { initAnnouncements } = require('./setup-announcements');
        await initAnnouncements();
      } catch (error) {
        console.warn('⚠️  公告系统初始化失败，但不影响系统启动:', error.message);
      }
      
      // 恢复PeerManager状态
      await restorePeerManagerFromDatabase();
    }
    
    // 启动服务器
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 PT站服务器启动成功`);
      console.log(`📡 Tracker服务已启用`);
      console.log(`🔧 API服务已启动`);
      console.log(`📊 统计服务已启用`);
      console.log(`💊 健康检查可用`);
      console.log(`🗄️  数据库: ${sequelize.getDatabaseName()} (${sequelize.getDialect()})`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 服务端口: ${PORT}`);
      console.log(`🔗 Announce URL: ${process.env.ANNOUNCE_URL}`);
      console.log(`📍 访问地址:`);
      console.log(`   - 前端: http://${networkConfig.ip}:3000`);
      console.log(`   - API: http://${networkConfig.ip}:${PORT}/api`);
      console.log(`   - Tracker: ${process.env.ANNOUNCE_URL}/tracker/announce/<passkey>`);
      console.log(`   - 健康检查: http://${networkConfig.ip}:${PORT}/health`);
      console.log('');
      
      // 启动统计调度器
      if (process.env.NODE_ENV !== 'test') {
        setTimeout(() => {
          statsScheduler.start();
        }, 5000); // 延迟5秒启动，确保数据库连接稳定
      }
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 初始化现有用户的 passkey
async function initializeUserPasskeys() {
  try {
    const { User, UserPasskey } = require('./models');
    const { generatePasskey } = require('./utils/passkey');
    
    const users = await User.findAll();
    
    for (const user of users) {
      const existingPasskey = await UserPasskey.findOne({
        where: { user_id: user.id }
      });
      
      if (!existingPasskey) {
        await UserPasskey.create({
          user_id: user.id,
          passkey: generatePasskey(),
          active: true
        });
        console.log(`✅ 为用户 ${user.username} 创建 passkey`);
      }
    }
  } catch (error) {
    console.error('初始化 passkey 失败:', error);
  }
}

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...');
  try {
    // 停止统计调度器
    statsScheduler.stop();
    
    await sequelize.close();
    console.log('✅ 数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭过程中出现错误:', error);
    process.exit(1);
  }
});

// 启动服务器
startServer();

module.exports = app;

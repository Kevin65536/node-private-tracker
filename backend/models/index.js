const { Sequelize } = require('sequelize');
const path = require('path');

// 数据库配置函数
function createSequelizeInstance() {
  const dialect = process.env.DB_DIALECT || 'postgres';
  
  if (dialect === 'postgres') {
    // PostgreSQL 配置
    const password = process.env.DB_PASSWORD;
    console.log('数据库密码类型:', typeof password, '长度:', password?.length);
    
    return new Sequelize(
      process.env.DB_NAME || 'pt_database',
      process.env.DB_USER || 'postgres',
      String(password || ''), // 确保密码是字符串
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
          timestamps: true,
          underscored: true,
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  } else {
    // SQLite 备选配置
    return new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../database.sqlite'),
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
      }
    });
  }
}

// 创建数据库实例
const sequelize = createSequelizeInstance();

// 导入模型
const User = require('./User')(sequelize);
const Torrent = require('./Torrent')(sequelize);
const Category = require('./Category')(sequelize);
const Download = require('./Download')(sequelize);
const UserStats = require('./UserStats')(sequelize);
const UserPasskey = require('./UserPasskey')(sequelize);
const Peer = require('./Peer')(sequelize);
const AnnounceLog = require('./AnnounceLog')(sequelize);
// InfoHashVariant 模型已移除，因为修复了种子生成逻辑

// 定义关联关系
User.hasMany(Torrent, { 
  foreignKey: 'uploader_id',
  as: 'uploadedTorrents'
});
Torrent.belongsTo(User, { 
  foreignKey: 'uploader_id',
  as: 'uploader'
});

Category.hasMany(Torrent, {
  foreignKey: 'category_id'
});
Torrent.belongsTo(Category, {
  foreignKey: 'category_id'
});

User.hasMany(Download, {
  foreignKey: 'user_id'
});
Download.belongsTo(User, {
  foreignKey: 'user_id'
});

Torrent.hasMany(Download, {
  foreignKey: 'torrent_id'
});
Download.belongsTo(Torrent, {
  foreignKey: 'torrent_id'
});

User.hasOne(UserStats, {
  foreignKey: 'user_id',
  as: 'UserStat'
});
UserStats.belongsTo(User, {
  foreignKey: 'user_id'
});

// Passkey 关联
User.hasOne(UserPasskey, {
  foreignKey: 'user_id'
});
UserPasskey.belongsTo(User, {
  foreignKey: 'user_id'
});

// Peer 关联
User.hasMany(Peer, {
  foreignKey: 'user_id'
});
Peer.belongsTo(User, {
  foreignKey: 'user_id'
});

Torrent.hasMany(Peer, {
  foreignKey: 'torrent_id'
});
Peer.belongsTo(Torrent, {
  foreignKey: 'torrent_id'
});

// Announce 日志关联
User.hasMany(AnnounceLog, {
  foreignKey: 'user_id'
});
AnnounceLog.belongsTo(User, {
  foreignKey: 'user_id'
});

Torrent.hasMany(AnnounceLog, {
  foreignKey: 'torrent_id'
});
AnnounceLog.belongsTo(Torrent, {
  foreignKey: 'torrent_id'
});

module.exports = {
  sequelize,
  User,
  Torrent,
  Category,
  Download,
  UserStats,
  UserPasskey,
  Peer,
  AnnounceLog
  // InfoHashVariant 已移除
};

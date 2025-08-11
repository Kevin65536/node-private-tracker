const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Download = sequelize.define('Download', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    torrent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'torrents',
        key: 'id'
      }
    },
    uploaded: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      comment: '历史累计上传量'
    },
    downloaded: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      comment: '历史累计下载量'
    },
    left: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },
    // 客户端当前会话的上报值，用于计算增量
    last_reported_uploaded: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      comment: '客户端最后上报的上传量（会话值）'
    },
    last_reported_downloaded: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      comment: '客户端最后上报的下载量（会话值）'
    },
    status: {
      type: DataTypes.ENUM('downloading', 'seeding', 'stopped', 'completed'),
      defaultValue: 'downloading'
    },
    last_announce: {
      type: DataTypes.DATE,
      allowNull: true
    },
    peer_id: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'downloads',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'torrent_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['last_announce']
      }
    ]
  });

  return Download;
};

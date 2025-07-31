const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnnounceLog = sequelize.define('AnnounceLog', {
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
    info_hash: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    peer_id: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    ip: {
      type: DataTypes.INET,
      allowNull: false
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    uploaded: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },
    downloaded: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },
    left: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },
    event: {
      type: DataTypes.ENUM('started', 'stopped', 'completed', 'update'),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    response_time: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    announced_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'announce_logs',
    timestamps: false,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['torrent_id']
      },
      {
        fields: ['info_hash']
      },
      {
        fields: ['announced_at']
      }
    ]
  });

  return AnnounceLog;
};

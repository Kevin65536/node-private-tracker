const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Peer = sequelize.define('Peer', {
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
      allowNull: false,
      validate: {
        min: 1,
        max: 65535
      }
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
    status: {
      type: DataTypes.ENUM('started', 'downloading', 'seeding', 'stopped', 'completed'),
      defaultValue: 'started'
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    key: {
      type: DataTypes.STRING(8),
      allowNull: true
    },
    last_announce: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    first_announce: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    announces: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    tableName: 'peers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['info_hash']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['torrent_id']
      },
      {
        fields: ['last_announce']
      },
      {
        unique: true,
        fields: ['user_id', 'torrent_id', 'peer_id']
      }
    ]
  });

  return Peer;
};

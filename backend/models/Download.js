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

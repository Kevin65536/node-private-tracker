const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserStats = sequelize.define('UserStats', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      references: {
        model: 'users',
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
    seedtime: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },
    leechtime: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },
    bonus_points: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    invitations: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    torrents_uploaded: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    torrents_seeding: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    torrents_leeching: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'user_stats',
    getterMethods: {
      ratio() {
        if (this.downloaded === 0) {
          return this.uploaded > 0 ? Infinity : 1;
        }
        return this.uploaded / this.downloaded;
      }
    }
  });

  return UserStats;
};

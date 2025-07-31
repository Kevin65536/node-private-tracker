const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Torrent = sequelize.define('Torrent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    info_hash: {
      type: DataTypes.STRING(40),
      unique: true,
      allowNull: false
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    file_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    uploader_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    review_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reviewed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    seeders: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    leechers: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    torrent_file: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    nfo_file: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    image_files: {
      type: DataTypes.JSON,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    },
    free_leech: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    double_upload: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    free_leech_until: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'torrents',
    timestamps: true, // 确保启用时间戳
    createdAt: 'created_at', // 明确指定创建时间字段名
    updatedAt: 'updated_at', // 明确指定更新时间字段名
    indexes: [
      {
        fields: ['info_hash']
      },
      {
        fields: ['uploader_id']
      },
      {
        fields: ['category_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return Torrent;
};

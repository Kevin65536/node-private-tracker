const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InfoHashVariant = sequelize.define('InfoHashVariant', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    original_torrent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'torrents',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    variant_info_hash: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
      validate: {
        len: [40, 40],
        isAlphanumeric: true
      }
    },
    user_passkey: {
      type: DataTypes.STRING(32),
      allowNull: true,
      validate: {
        len: [32, 32],
        isAlphanumeric: true
      }
    },
    announce_url: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'info_hash_variants',
    underscored: true,
    indexes: [
      {
        fields: ['variant_info_hash']
      },
      {
        fields: ['original_torrent_id']
      },
      {
        fields: ['user_passkey']
      }
    ]
  });

  // 建立关联关系
  InfoHashVariant.associate = (models) => {
    InfoHashVariant.belongsTo(models.Torrent, {
      foreignKey: 'original_torrent_id',
      as: 'originalTorrent'
    });
  };

  return InfoHashVariant;
};

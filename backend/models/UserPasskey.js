const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserPasskey = sequelize.define('UserPasskey', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    passkey: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      validate: {
        len: [32, 32] // 确保是32位长度
      }
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_used: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_passkeys',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['passkey']
      },
      {
        unique: true,
        fields: ['user_id']
      }
    ]
  });

  return UserPasskey;
};

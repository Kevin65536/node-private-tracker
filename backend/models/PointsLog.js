const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PointsLog = sequelize.define('PointsLog', {
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
    change: {
      // 变动值（可正可负），两位小数
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    reason: {
      // 变动来源标识：e.g. 'traffic', 'seeding_hourly', 'approval_bonus', 'admin_adjust'
      type: DataTypes.STRING(64),
      allowNull: false
    },
    balance_after: {
      // 变动后的积分余额（便于前端直接展示）
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    context: {
      // 额外上下文信息（JSON）：如种子ID、大小、做种数、系数等
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'points_log',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['created_at'] }
    ]
  });

  return PointsLog;
};

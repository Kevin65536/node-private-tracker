require('dotenv').config();
const { Sequelize } = require('sequelize');
const { sequelize } = require('./models');

async function addReviewColumns() {
  try {
    console.log('开始添加种子表审核字段...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // 检查字段是否已存在
    const tableInfo = await queryInterface.describeTable('torrents');
    
    if (!tableInfo.review_reason) {
      await queryInterface.addColumn('torrents', 'review_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('✅ 添加 review_reason 字段');
    } else {
      console.log('⏭️ review_reason 字段已存在');
    }
    
    if (!tableInfo.reviewed_by) {
      await queryInterface.addColumn('torrents', 'reviewed_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      });
      console.log('✅ 添加 reviewed_by 字段');
    } else {
      console.log('⏭️ reviewed_by 字段已存在');
    }
    
    if (!tableInfo.reviewed_at) {
      await queryInterface.addColumn('torrents', 'reviewed_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ 添加 reviewed_at 字段');
    } else {
      console.log('⏭️ reviewed_at 字段已存在');
    }
    
    console.log('✅ 种子表审核字段添加完成！');
    
  } catch (error) {
    console.error('❌ 添加审核字段失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addReviewColumns()
    .then(() => {
      console.log('数据库更新完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('数据库更新失败:', error);
      process.exit(1);
    });
}

module.exports = { addReviewColumns };

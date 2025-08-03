require('dotenv').config();
const { sequelize } = require('./models');

async function finalizeTable() {
  try {
    // 确保所有记录都有 created_at 值
    await sequelize.query(`
      UPDATE info_hash_variants 
      SET created_at = CURRENT_TIMESTAMP 
      WHERE created_at IS NULL;
    `);
    
    // 将 created_at 设置为 NOT NULL
    await sequelize.query(`
      ALTER TABLE info_hash_variants 
      ALTER COLUMN created_at SET NOT NULL;
    `);
    
    console.log('✅ 表结构最终修复完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 最终修复失败:', error.message);
    process.exit(1);
  }
}

finalizeTable();

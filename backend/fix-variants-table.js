require('dotenv').config();
const { sequelize } = require('./models');

async function fixInfoHashVariantsTable() {
  try {
    console.log('🔧 修复 info_hash_variants 表结构...');
    
    // 首先为现有记录添加默认的时间戳
    await sequelize.query(`
      UPDATE info_hash_variants 
      SET created_at = CURRENT_TIMESTAMP 
      WHERE created_at IS NULL;
    `);
    
    // 检查是否存在 updated_at 列
    const columns = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'info_hash_variants' 
      AND column_name = 'updated_at';
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (columns.length === 0) {
      // 添加 updated_at 列，允许 NULL 值
      await sequelize.query(`
        ALTER TABLE info_hash_variants 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);
      
      // 为现有记录设置 updated_at
      await sequelize.query(`
        UPDATE info_hash_variants 
        SET updated_at = created_at 
        WHERE updated_at IS NULL;
      `);
      
      // 现在将列设置为 NOT NULL
      await sequelize.query(`
        ALTER TABLE info_hash_variants 
        ALTER COLUMN updated_at SET NOT NULL;
      `);
    } else {
      // 如果列已存在但有 NULL 值，更新它们
      await sequelize.query(`
        UPDATE info_hash_variants 
        SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP);
      `);
    }
    
    console.log('✅ info_hash_variants 表结构修复完成');
    
    // 验证表结构
    const tableInfo = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'info_hash_variants'
      ORDER BY ordinal_position;
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 当前表结构:');
    tableInfo.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    console.error('SQL:', error.sql);
    process.exit(1);
  }
}

fixInfoHashVariantsTable();

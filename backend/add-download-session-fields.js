/**
 * 添加Download表的会话跟踪字段
 * 运行: node add-download-session-fields.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { sequelize } = require('./models');

async function addSessionFields() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    console.log('🔧 开始添加Download表的会话跟踪字段...');

    // 添加last_reported_uploaded字段
    await sequelize.query(`
      ALTER TABLE downloads 
      ADD COLUMN IF NOT EXISTS last_reported_uploaded BIGINT DEFAULT 0
    `);
    console.log('✅ 添加 last_reported_uploaded 字段');

    // 添加last_reported_downloaded字段
    await sequelize.query(`
      ALTER TABLE downloads 
      ADD COLUMN IF NOT EXISTS last_reported_downloaded BIGINT DEFAULT 0
    `);
    console.log('✅ 添加 last_reported_downloaded 字段');

    // 添加字段注释
    await sequelize.query(`
      COMMENT ON COLUMN downloads.uploaded IS '历史累计上传量'
    `);
    
    await sequelize.query(`
      COMMENT ON COLUMN downloads.downloaded IS '历史累计下载量'
    `);
    
    await sequelize.query(`
      COMMENT ON COLUMN downloads.last_reported_uploaded IS '客户端最后上报的上传量（会话值）'
    `);
    
    await sequelize.query(`
      COMMENT ON COLUMN downloads.last_reported_downloaded IS '客户端最后上报的下载量（会话值）'
    `);
    console.log('✅ 添加字段注释');

    // 初始化现有记录的会话值
    await sequelize.query(`
      UPDATE downloads 
      SET 
        last_reported_uploaded = uploaded,
        last_reported_downloaded = downloaded
      WHERE 
        last_reported_uploaded = 0 AND last_reported_downloaded = 0
    `);
    console.log('✅ 初始化现有记录的会话值');

    console.log('🎉 Download表字段添加完成！');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  addSessionFields();
}

module.exports = { addSessionFields };

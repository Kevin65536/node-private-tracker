require('dotenv').config();
const { sequelize } = require('./models');

async function createInfoHashMappingTable() {
  try {
    // 创建 info_hash 映射表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS info_hash_variants (
        id SERIAL PRIMARY KEY,
        original_torrent_id INTEGER NOT NULL REFERENCES torrents(id) ON DELETE CASCADE,
        variant_info_hash VARCHAR(40) NOT NULL UNIQUE,
        user_passkey VARCHAR(32),
        announce_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(variant_info_hash)
      );
    `);
    
    // 创建索引以提高查询性能
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_variant_info_hash ON info_hash_variants(variant_info_hash);
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_original_torrent_id ON info_hash_variants(original_torrent_id);
    `);
    
    console.log('✅ Info Hash 映射表创建成功');
    
    // 插入现有种子的原始映射
    await sequelize.query(`
      INSERT INTO info_hash_variants (original_torrent_id, variant_info_hash, user_passkey, announce_url)
      SELECT id, info_hash, NULL, 'original' 
      FROM torrents 
      WHERE status = 'approved'
      ON CONFLICT (variant_info_hash) DO NOTHING;
    `);
    
    console.log('✅ 已为现有种子创建原始映射');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建映射表失败:', error.message);
    process.exit(1);
  }
}

createInfoHashMappingTable();

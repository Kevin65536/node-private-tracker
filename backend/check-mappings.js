require('dotenv').config();
const { InfoHashVariant, Torrent } = require('./models');

async function checkMappings() {
  try {
    const mappings = await InfoHashVariant.findAll({
      include: [{
        model: Torrent,
        as: 'originalTorrent',
        attributes: ['id', 'name', 'info_hash']
      }],
      order: [['created_at', 'DESC']]
    });
    
    console.log('📋 Info Hash 映射表:');
    if (mappings.length === 0) {
      console.log('❌ 没有找到映射记录');
    } else {
      mappings.forEach(mapping => {
        console.log(`✅ 变体: ${mapping.variant_info_hash}`);
        console.log(`   -> 原始: ${mapping.originalTorrent.info_hash}`);
        console.log(`   -> 种子: ${mapping.originalTorrent.name}`);
        console.log(`   -> Passkey: ${mapping.user_passkey || 'original'}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
}

checkMappings();

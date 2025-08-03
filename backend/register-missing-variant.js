require('dotenv').config();
const { InfoHashVariant, Torrent } = require('./models');

async function registerMissingVariant() {
  try {
    // 查找原始种子
    const originalTorrent = await Torrent.findOne({
      where: { info_hash: '529936d5fc5685f79981fdd060687f32fd75e528' }
    });

    if (!originalTorrent) {
      console.log('❌ 找不到原始种子');
      return;
    }

    // 注册缺失的变体
    const missingHash = '529936d5fc5685f79981fdd060687f32fd75e526';
    
    const [variant, created] = await InfoHashVariant.findOrCreate({
      where: { variant_info_hash: missingHash },
      defaults: {
        original_torrent_id: originalTorrent.id,
        variant_info_hash: missingHash,
        user_passkey: '9a5c1a8ea23d8b92a21ecca8751f873f', // testuser1
        announce_url: 'http://localhost:3001/tracker/announce/9a5c1a8ea23d8b92a21ecca8751f873f'
      }
    });

    if (created) {
      console.log('✅ 成功注册 info_hash 变体:');
      console.log(`   变体哈希: ${variant.variant_info_hash}`);
      console.log(`   原始种子ID: ${variant.original_torrent_id}`);
      console.log(`   用户Passkey: ${variant.user_passkey}`);
    } else {
      console.log('ℹ️  变体已存在');
    }

    // 验证映射
    const checkVariant = await InfoHashVariant.findOne({
      where: { variant_info_hash: missingHash },
      include: [{
        model: Torrent,
        as: 'originalTorrent',
        attributes: ['id', 'name', 'info_hash']
      }]
    });

    if (checkVariant) {
      console.log('🔍 映射验证:');
      console.log(`   变体: ${checkVariant.variant_info_hash}`);
      console.log(`   -> 原始: ${checkVariant.originalTorrent.info_hash}`);
      console.log(`   -> 种子: ${checkVariant.originalTorrent.name}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 注册失败:', error.message);
    process.exit(1);
  }
}

registerMissingVariant();

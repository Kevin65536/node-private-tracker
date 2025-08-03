const { sequelize } = require('./models');

async function debugVariants() {
  try {
    console.log('=== Info Hash Variants 调试信息 ===\n');
    
    // 1. 统计变体数量
    const [results] = await sequelize.query('SELECT COUNT(*) as total FROM info_hash_variants');
    console.log('📊 Info hash variants 总数:', results[0].total);
    
    // 2. 查看所有变体记录
    const [variants] = await sequelize.query(`
      SELECT ihv.*, t.name as torrent_name, t.info_hash as original_hash
      FROM info_hash_variants ihv 
      LEFT JOIN torrents t ON ihv.original_torrent_id = t.id 
      ORDER BY ihv.id
    `);
    
    console.log('\n📋 当前变体记录:');
    if (variants.length === 0) {
      console.log('❌ 没有找到任何变体记录');
    } else {
      variants.forEach(v => {
        console.log(`   ID: ${v.id}`);
        console.log(`   种子: ${v.torrent_name}`);
        console.log(`   原始Hash: ${v.original_hash}`);
        console.log(`   变体Hash: ${v.variant_info_hash}`);
        console.log(`   用户Passkey: ${v.user_passkey || '[null]'}`);
        console.log(`   Announce URL: ${v.announce_url || '[null]'}`);
        console.log('   ---');
      });
    }
    
    // 3. 检查种子总数
    const [torrents] = await sequelize.query('SELECT COUNT(*) as total FROM torrents WHERE status = \'approved\'');
    console.log(`\n🎯 已审核种子总数: ${torrents[0].total}`);
    
    // 4. 检查用户下载记录
    const [downloads] = await sequelize.query('SELECT COUNT(*) as total FROM downloads');
    console.log(`📥 用户下载记录总数: ${downloads[0].total}`);
    
    // 5. 检查最近的下载记录
    const [recentDownloads] = await sequelize.query(`
      SELECT d.*, t.name as torrent_name, u.username
      FROM downloads d
      LEFT JOIN torrents t ON d.torrent_id = t.id
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
      LIMIT 5
    `);
    
    console.log('\n📥 最近5次下载记录:');
    if (recentDownloads.length === 0) {
      console.log('❌ 没有找到下载记录');
    } else {
      recentDownloads.forEach(d => {
        console.log(`   用户: ${d.username}, 种子: ${d.torrent_name}, 时间: ${new Date(d.created_at).toLocaleString()}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
}

debugVariants();

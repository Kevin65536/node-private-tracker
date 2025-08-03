require('dotenv').config();
const { sequelize } = require('./models');

async function analyzeVariantProblem() {
  try {
    console.log('=== 深入分析变体Hash问题 ===\n');
    
    // 查看当前的变体记录
    const [variants] = await sequelize.query(`
      SELECT ihv.*, t.name as torrent_name, t.info_hash as original_hash
      FROM info_hash_variants ihv 
      LEFT JOIN torrents t ON ihv.original_torrent_id = t.id 
      ORDER BY ihv.original_torrent_id, ihv.variant_info_hash
    `);
    
    console.log('📋 所有变体记录详情:');
    const groupedByTorrent = {};
    
    variants.forEach(v => {
      if (!groupedByTorrent[v.torrent_name]) {
        groupedByTorrent[v.torrent_name] = [];
      }
      groupedByTorrent[v.torrent_name].push(v);
    });
    
    Object.keys(groupedByTorrent).forEach(torrentName => {
      console.log(`\n🎯 种子: ${torrentName}`);
      const torrentVariants = groupedByTorrent[torrentName];
      console.log(`   原始Hash: ${torrentVariants[0].original_hash}`);
      console.log(`   变体数量: ${torrentVariants.length}`);
      
      torrentVariants.forEach((v, i) => {
        console.log(`   变体${i+1}: ${v.variant_info_hash}`);
        console.log(`           Passkey: ${v.user_passkey || '[原始]'}`);
        console.log(`           URL: ${v.announce_url || '[原始]'}`);
      });
    });
    
    // 检查是否存在相同变体hash的问题
    console.log('\n🔍 检查重复的变体Hash:');
    const hashCounts = {};
    variants.forEach(v => {
      if (!hashCounts[v.variant_info_hash]) {
        hashCounts[v.variant_info_hash] = [];
      }
      hashCounts[v.variant_info_hash].push(v);
    });
    
    let hasDuplicates = false;
    Object.keys(hashCounts).forEach(hash => {
      if (hashCounts[hash].length > 1) {
        hasDuplicates = true;
        console.log(`❌ 发现重复的变体Hash: ${hash}`);
        hashCounts[hash].forEach(v => {
          console.log(`   种子: ${v.torrent_name}, Passkey: ${v.user_passkey || '[原始]'}`);
        });
      }
    });
    
    if (!hasDuplicates) {
      console.log('✅ 没有发现重复的变体Hash');
    }
    
    // 分析用户下载但没有对应变体的情况
    console.log('\n🔍 分析缺失的变体:');
    const [downloads] = await sequelize.query(`
      SELECT DISTINCT d.user_id, d.torrent_id, t.name as torrent_name, 
             u.username, up.passkey
      FROM downloads d 
      LEFT JOIN torrents t ON d.torrent_id = t.id 
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN user_passkeys up ON d.user_id = up.user_id
      WHERE t.status = 'approved'
      ORDER BY t.name, u.username
    `);
    
    console.log('应该存在的用户-种子组合:');
    downloads.forEach(d => {
      const hasVariant = variants.some(v => 
        v.original_torrent_id === d.torrent_id && 
        (v.user_passkey === d.passkey || v.user_passkey === null)
      );
      
      const status = hasVariant ? '✅' : '❌';
      console.log(`${status} ${d.username} -> ${d.torrent_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 分析失败:', error.message);
    process.exit(1);
  }
}

analyzeVariantProblem();

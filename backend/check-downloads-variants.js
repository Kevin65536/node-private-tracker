require('dotenv').config();
const { sequelize, UserPasskey } = require('./models');
const { buildAnnounceUrl } = require('./utils/passkey');

async function checkDownloadsAndVariants() {
  try {
    console.log('=== 检查下载记录和变体注册情况 ===\n');
    
    // 1. 查看下载记录
    const [downloads] = await sequelize.query(`
      SELECT d.*, t.name as torrent_name, t.info_hash, u.username, up.passkey
      FROM downloads d 
      LEFT JOIN torrents t ON d.torrent_id = t.id 
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN user_passkeys up ON d.user_id = up.user_id
      ORDER BY d.created_at DESC
    `);
    
    console.log(`📥 共找到 ${downloads.length} 条下载记录:`);
    downloads.forEach((r, i) => {
      console.log(`${i+1}. 用户: ${r.username}, 种子: ${r.torrent_name}`);
      console.log(`   原始Hash: ${r.info_hash}`);
      console.log(`   Passkey: ${r.passkey || '[未找到]'}`);
      console.log(`   时间: ${new Date(r.created_at).toLocaleString()}`);
      console.log('');
    });
    
    // 2. 检查现有变体
    const [variants] = await sequelize.query(`
      SELECT ihv.*, t.name as torrent_name 
      FROM info_hash_variants ihv 
      LEFT JOIN torrents t ON ihv.original_torrent_id = t.id 
      ORDER BY ihv.id
    `);
    
    console.log(`📋 现有变体记录 (${variants.length} 条):`);
    variants.forEach(v => {
      console.log(`   种子: ${v.torrent_name}, 变体Hash: ${v.variant_info_hash}, Passkey: ${v.user_passkey || '[null]'}`);
    });
    
    // 3. 分析缺失的变体
    console.log('\n🔍 分析缺失的变体注册:');
    
    const uniqueDownloads = new Map();
    downloads.forEach(d => {
      const key = `${d.user_id}-${d.torrent_id}`;
      if (!uniqueDownloads.has(key)) {
        uniqueDownloads.set(key, d);
      }
    });
    
    console.log(`   应该有 ${uniqueDownloads.size} 个唯一的用户-种子组合`);
    console.log(`   实际变体记录: ${variants.length} 条`);
    console.log(`   缺失变体数量: ${uniqueDownloads.size - variants.length} 条`);
    
    if (uniqueDownloads.size > variants.length) {
      console.log('\n❌ 发现缺失的变体注册！需要修复。');
    } else {
      console.log('\n✅ 变体注册数量正常。');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
  }
}

checkDownloadsAndVariants();

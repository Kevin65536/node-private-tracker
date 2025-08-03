require('dotenv').config();
const { sequelize, InfoHashVariant } = require('./models');
const { buildAnnounceUrl } = require('./utils/passkey');
const crypto = require('crypto');
const bencode = require('./utils/bencode');
const fs = require('fs').promises;
const path = require('path');

async function createPersonalizedVariants() {
  try {
    console.log('=== 创建个人化Info Hash变体 ===\n');
    
    // 获取所有下载记录
    const [downloads] = await sequelize.query(`
      SELECT DISTINCT d.user_id, d.torrent_id, t.name as torrent_name, t.info_hash, 
             t.torrent_file, up.passkey, u.username
      FROM downloads d 
      LEFT JOIN torrents t ON d.torrent_id = t.id 
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN user_passkeys up ON d.user_id = up.user_id
      WHERE t.status = 'approved'
      ORDER BY t.name, u.username
    `);
    
    console.log(`📥 找到 ${downloads.length} 个用户-种子组合\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const download of downloads) {
      try {
        console.log(`🔄 处理: ${download.username} -> ${download.torrent_name}`);
        
        if (!download.passkey) {
          console.log(`   ⚠️  跳过：用户没有passkey`);
          skipCount++;
          continue;
        }
        
        if (!download.torrent_file) {
          console.log(`   ⚠️  跳过：种子文件不存在`);
          skipCount++;
          continue;
        }
        
        // 构建个人化的announce URL
        const personalAnnounceUrl = buildAnnounceUrl(download.passkey);
        
        // 读取种子文件
        const torrentPath = path.join(__dirname, 'uploads', download.torrent_file);
        
        let torrentData;
        try {
          torrentData = await fs.readFile(torrentPath);
        } catch (fileError) {
          console.log(`   ❌ 种子文件读取失败: ${fileError.message}`);
          errorCount++;
          continue;
        }
        
        // 解析并修改种子文件
        const torrentObject = bencode.decode(torrentData);
        
        if (!torrentObject.info) {
          console.log(`   ❌ 种子文件格式无效`);
          errorCount++;
          continue;
        }
        
        // 创建个人化的种子
        const personalizedTorrent = JSON.parse(JSON.stringify(torrentObject));
        personalizedTorrent.announce = Buffer.from(personalAnnounceUrl);
        personalizedTorrent.info.private = 1;
        
        // 为了确保每个用户有独特的hash，在info中添加用户标识
        // 这里我们在comment中添加用户passkey的一部分作为标识符
        personalizedTorrent.comment = Buffer.from(\`PT tracker - User: \${download.passkey.substring(0, 8)}\`);
        
        // 计算个人化的info_hash
        const personalizedInfoBuffer = bencode.encode(personalizedTorrent.info);
        const personalizedInfoHash = crypto.createHash('sha1').update(personalizedInfoBuffer).digest('hex');
        
        console.log(`   📊 原始Hash: ${download.info_hash}`);
        console.log(`   📊 个人Hash: ${personalizedInfoHash}`);
        console.log(`   📊 Passkey: ${download.passkey.substring(0, 8)}...`);
        
        // 检查是否已存在此个人化变体
        const existingPersonalVariant = await InfoHashVariant.findOne({
          where: { 
            variant_info_hash: personalizedInfoHash
          }
        });
        
        if (existingPersonalVariant) {
          console.log(`   ✅ 个人化变体已存在`);
          skipCount++;
        } else {
          // 创建个人化变体记录
          await InfoHashVariant.create({
            original_torrent_id: download.torrent_id,
            variant_info_hash: personalizedInfoHash,
            user_passkey: download.passkey,
            announce_url: personalAnnounceUrl
          });
          
          console.log(`   ✅ 成功创建个人化变体`);
          successCount++;
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ 处理失败: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('=== 个人化变体创建结果 ===');
    console.log(`✅ 成功创建: ${successCount} 条`);
    console.log(`⚠️  跳过: ${skipCount} 条`);
    console.log(`❌ 失败: ${errorCount} 条`);
    
    // 验证结果
    const [finalCount] = await sequelize.query('SELECT COUNT(*) as total FROM info_hash_variants');
    console.log(`📊 最终变体总数: ${finalCount[0].total} 条`);
    
    // 显示创建的个人化变体
    const [personalVariants] = await sequelize.query(\`
      SELECT ihv.*, t.name as torrent_name
      FROM info_hash_variants ihv 
      LEFT JOIN torrents t ON ihv.original_torrent_id = t.id 
      WHERE ihv.user_passkey IS NOT NULL
      ORDER BY ihv.id DESC
      LIMIT 10
    \`);
    
    console.log('\n📋 最新的个人化变体记录:');
    personalVariants.forEach(v => {
      console.log(\`   种子: \${v.torrent_name}\`);
      console.log(\`   变体Hash: \${v.variant_info_hash}\`);
      console.log(\`   用户Passkey: \${v.user_passkey.substring(0, 8)}...\`);
      console.log('   ---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建个人化变体失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createPersonalizedVariants();

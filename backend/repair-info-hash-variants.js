require('dotenv').config();
const { sequelize, InfoHashVariant, Torrent } = require('./models');
const { buildAnnounceUrl } = require('./utils/passkey');
const crypto = require('crypto');
const bencode = require('./utils/bencode');
const fs = require('fs').promises;
const path = require('path');

async function repairInfoHashVariants() {
  try {
    console.log('=== 修复 Info Hash Variants ===\n');
    
    // 1. 获取所有下载记录
    const [downloads] = await sequelize.query(`
      SELECT DISTINCT d.user_id, d.torrent_id, t.name as torrent_name, t.info_hash, 
             t.torrent_file, up.passkey, u.username
      FROM downloads d 
      LEFT JOIN torrents t ON d.torrent_id = t.id 
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN user_passkeys up ON d.user_id = up.user_id
      WHERE t.status = 'approved'
      ORDER BY d.torrent_id, d.user_id
    `);
    
    console.log(`📥 找到 ${downloads.length} 个唯一的用户-种子下载组合\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const download of downloads) {
      try {
        console.log(`🔄 处理: ${download.username} -> ${download.torrent_name}`);
        
        if (!download.passkey) {
          console.log(`   ⚠️  用户 ${download.username} 没有 passkey，跳过`);
          skipCount++;
          continue;
        }
        
        if (!download.torrent_file) {
          console.log(`   ⚠️  种子 ${download.torrent_name} 没有种子文件，跳过`);
          skipCount++;
          continue;
        }
        
        // 读取种子文件
        const torrentPath = path.join(__dirname, 'uploads', download.torrent_file);
        
        let torrentData;
        try {
          torrentData = await fs.readFile(torrentPath);
        } catch (fileError) {
          console.log(`   ❌ 无法读取种子文件: ${download.torrent_file}`);
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
        
        // 修改announce URL
        const announceUrl = buildAnnounceUrl(download.passkey);
        torrentObject.announce = Buffer.from(announceUrl);
        
        // 添加私有种子标记
        torrentObject.info.private = 1;
        
        // 计算修改后的info_hash
        const modifiedInfoBuffer = bencode.encode(torrentObject.info);
        const modifiedInfoHash = crypto.createHash('sha1').update(modifiedInfoBuffer).digest('hex');
        
        console.log(`   📊 原始Hash: ${download.info_hash}`);
        console.log(`   📊 变体Hash: ${modifiedInfoHash}`);
        
        // 检查是否已存在
        const existingVariant = await InfoHashVariant.findOne({
          where: { variant_info_hash: modifiedInfoHash }
        });
        
        if (existingVariant) {
          console.log(`   ✅ 变体已存在，跳过`);
          skipCount++;
        } else {
          // 创建变体记录
          await InfoHashVariant.create({
            original_torrent_id: download.torrent_id,
            variant_info_hash: modifiedInfoHash,
            user_passkey: download.passkey,
            announce_url: announceUrl
          });
          
          console.log(`   ✅ 成功创建变体记录`);
          successCount++;
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ 处理失败: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('=== 修复结果 ===');
    console.log(`✅ 成功创建: ${successCount} 条`);
    console.log(`⚠️  跳过: ${skipCount} 条`);
    console.log(`❌ 失败: ${errorCount} 条`);
    
    // 验证修复结果
    const [variantCount] = await sequelize.query('SELECT COUNT(*) as total FROM info_hash_variants');
    console.log(`📊 修复后变体总数: ${variantCount[0].total} 条`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

repairInfoHashVariants();

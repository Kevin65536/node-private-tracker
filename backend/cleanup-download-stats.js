#!/usr/bin/env node

const { sequelize, Download, Torrent, User } = require('./models');

async function cleanupDownloadStats() {
  try {
    console.log('🔍 开始检查和清理异常的下载统计数据...');
    
    // 查找所有可能异常的记录
    const abnormalDownloads = await sequelize.query(`
      SELECT 
        d.id,
        d.user_id,
        d.torrent_id,
        d.uploaded,
        d.downloaded,
        t.size as torrent_size,
        t.name as torrent_name,
        u.username
      FROM downloads d
      LEFT JOIN torrents t ON d.torrent_id = t.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE (d.downloaded > t.size * 10 OR d.uploaded > t.size * 10)
        AND t.size > 0
      ORDER BY d.downloaded DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log(`发现 ${abnormalDownloads.length} 条可能异常的记录:`);
    
    let fixedCount = 0;
    for (const record of abnormalDownloads) {
      const ratio = record.downloaded / record.torrent_size;
      console.log(`\n📊 用户: ${record.username}`);
      console.log(`   种子: ${record.torrent_name}`);
      console.log(`   下载量: ${record.downloaded} (${(record.downloaded / 1024 / 1024 / 1024).toFixed(2)} GB)`);
      console.log(`   种子大小: ${record.torrent_size} (${(record.torrent_size / 1024 / 1024 / 1024).toFixed(2)} GB)`);
      console.log(`   比例: ${ratio.toFixed(2)}x`);
      
      if (ratio > 10) {
        console.log(`   ⚠️  比例超过10倍，重置为0`);
        
        try {
          await Download.update({
            uploaded: 0,
            downloaded: 0,
            last_reported_uploaded: 0,
            last_reported_downloaded: 0
          }, {
            where: { id: record.id }
          });
          
          fixedCount++;
          console.log(`   ✅ 已重置`);
        } catch (error) {
          console.log(`   ❌ 重置失败: ${error.message}`);
        }
      }
    }
    
    console.log(`\n🎉 清理完成！共修复 ${fixedCount} 条记录`);
    
    // 显示清理后的统计
    const totalDownloads = await Download.count();
    const avgDownloaded = await sequelize.query(`
      SELECT AVG(downloaded) as avg_downloaded
      FROM downloads d
      LEFT JOIN torrents t ON d.torrent_id = t.id
      WHERE t.size > 0
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log(`\n📈 清理后统计:`);
    console.log(`   总下载记录: ${totalDownloads}`);
    console.log(`   平均下载量: ${(avgDownloaded[0].avg_downloaded / 1024 / 1024 / 1024).toFixed(2)} GB`);
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupDownloadStats();
}

module.exports = { cleanupDownloadStats };

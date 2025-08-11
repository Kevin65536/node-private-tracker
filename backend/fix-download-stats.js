/**
 * Download表数据修复脚本
 * 从AnnounceLog重新计算正确的累计值
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { sequelize, User, UserStats, Download, AnnounceLog } = require('./models');
const { Sequelize } = require('sequelize');

async function fixDownloadStats() {
  console.log('🔧 开始修复Download表统计数据...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 第一步：从AnnounceLog重建Download表的累计值
    console.log('\n📊 第一步：重建Download表累计值...');
    
    const downloads = await Download.findAll({
      include: [{ 
        model: User, 
        attributes: ['id', 'username'] 
      }]
    });

    let fixedCount = 0;
    let errorCount = 0;

    for (const download of downloads) {
      try {
        // 获取该用户该种子的所有announce记录
        const announces = await AnnounceLog.findAll({
          where: {
            user_id: download.user_id,
            torrent_id: download.torrent_id
          },
          order: [['created_at', 'ASC']]
        });

        if (announces.length === 0) {
          console.log(`⚠️  用户${download.User?.username}(${download.user_id})的种子${download.torrent_id}没有announce记录`);
          continue;
        }

        // 计算真实的累计值
        let maxUploaded = 0;
        let maxDownloaded = 0;
        let sessionUploaded = 0;
        let sessionDownloaded = 0;

        for (const announce of announces) {
          const currentUploaded = parseInt(announce.uploaded) || 0;
          const currentDownloaded = parseInt(announce.downloaded) || 0;

          // 检测客户端重启（数值突然变小）
          if (currentUploaded < sessionUploaded * 0.9) {
            // 客户端重启，累加之前的会话值
            maxUploaded += sessionUploaded;
            sessionUploaded = currentUploaded;
          } else {
            sessionUploaded = currentUploaded;
          }

          if (currentDownloaded < sessionDownloaded * 0.9) {
            maxDownloaded += sessionDownloaded;
            sessionDownloaded = currentDownloaded;
          } else {
            sessionDownloaded = currentDownloaded;
          }
        }

        // 加上最后一个会话的值
        maxUploaded += sessionUploaded;
        maxDownloaded += sessionDownloaded;

        // 获取最后一次announce的上报值
        const lastAnnounce = announces[announces.length - 1];
        const lastReportedUploaded = parseInt(lastAnnounce.uploaded) || 0;
        const lastReportedDownloaded = parseInt(lastAnnounce.downloaded) || 0;

        // 更新Download记录
        const oldUploaded = download.uploaded;
        const oldDownloaded = download.downloaded;

        await download.update({
          uploaded: maxUploaded,
          downloaded: maxDownloaded,
          last_reported_uploaded: lastReportedUploaded,
          last_reported_downloaded: lastReportedDownloaded
        });

        if (oldUploaded !== maxUploaded || oldDownloaded !== maxDownloaded) {
          console.log(`✅ 修复用户${download.User?.username}种子${download.torrent_id}:`);
          console.log(`   上传: ${oldUploaded} → ${maxUploaded}`);
          console.log(`   下载: ${oldDownloaded} → ${maxDownloaded}`);
          fixedCount++;
        }

      } catch (error) {
        console.error(`❌ 修复用户${download.user_id}种子${download.torrent_id}失败:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📈 Download表修复完成: 成功${fixedCount}条, 失败${errorCount}条`);

    // 第二步：重新计算UserStats
    console.log('\n📊 第二步：重新计算UserStats...');
    
    const users = await User.findAll({ attributes: ['id', 'username'] });
    let userFixedCount = 0;

    for (const user of users) {
      try {
        // 从修复后的Download表重新计算
        const downloadStats = await Download.findAll({
          where: { user_id: user.id },
          attributes: [
            [Sequelize.fn('SUM', Sequelize.col('uploaded')), 'total_uploaded'],
            [Sequelize.fn('SUM', Sequelize.col('downloaded')), 'total_downloaded']
          ],
          raw: true
        });

        const totalUploaded = parseInt(downloadStats[0]?.total_uploaded) || 0;
        const totalDownloaded = parseInt(downloadStats[0]?.total_downloaded) || 0;

        // 更新UserStats
        const [userStats] = await UserStats.findOrCreate({
          where: { user_id: user.id },
          defaults: {
            uploaded: totalUploaded,
            downloaded: totalDownloaded,
            seedtime: 0,
            leechtime: 0,
            bonus_points: 0,
            invitations: 0,
            torrents_uploaded: 0,
            torrents_seeding: 0,
            torrents_leeching: 0
          }
        });

        const oldUploaded = userStats.uploaded;
        const oldDownloaded = userStats.downloaded;

        await userStats.update({
          uploaded: totalUploaded,
          downloaded: totalDownloaded
        });

        if (oldUploaded !== totalUploaded || oldDownloaded !== totalDownloaded) {
          console.log(`✅ 修复用户${user.username}统计:`);
          console.log(`   上传: ${oldUploaded} → ${totalUploaded}`);
          console.log(`   下载: ${oldDownloaded} → ${totalDownloaded}`);
          userFixedCount++;
        }

      } catch (error) {
        console.error(`❌ 修复用户${user.username}统计失败:`, error.message);
      }
    }

    console.log(`\n📈 UserStats修复完成: 成功${userFixedCount}条`);

    // 第三步：验证修复结果
    console.log('\n🔍 第三步：验证修复结果...');
    
    const globalStats = await UserStats.findOne({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('uploaded')), 'total_uploaded'],
        [Sequelize.fn('SUM', Sequelize.col('downloaded')), 'total_downloaded'],
        [Sequelize.fn('COUNT', Sequelize.col('user_id')), 'user_count']
      ],
      raw: true
    });

    console.log('✅ 修复完成！全站统计:');
    console.log(`   总用户数: ${globalStats.user_count}`);
    console.log(`   总上传量: ${(globalStats.total_uploaded / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`   总下载量: ${(globalStats.total_downloaded / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`   全站比率: ${globalStats.total_downloaded > 0 ? (globalStats.total_uploaded / globalStats.total_downloaded).toFixed(2) : '∞'}`);

  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  fixDownloadStats();
}

module.exports = { fixDownloadStats };

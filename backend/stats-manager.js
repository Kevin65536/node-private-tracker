/**
 * PT站统计管理命令行工具
 * 提供各种统计相关的管理功能
 */

// 加载环境变量（确保使用 backend/.env）
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 延迟加载 models 以保证已加载 .env
const { sequelize } = require('./models');
const { updateAllUserStats } = require('./update-user-stats');
const statsScheduler = require('./utils/statsScheduler');

// 命令行参数解析
const args = process.argv.slice(2);
const command = args[0];

async function showHelp() {
  console.log(`
PT站统计管理工具

用法: node stats-manager.js <命令> [选项]

命令:
  help                     显示帮助信息
  status                   显示统计系统状态
  update-all               更新所有用户统计
  update-user <userId>     更新指定用户统计
  scheduler-start          启动统计调度器
  scheduler-stop           停止统计调度器
  scheduler-status         显示调度器状态
  scheduler-trigger        手动触发统计更新
  verify                   验证统计数据一致性
  cleanup                  清理过期数据
  reset-user <userId>      重置用户统计数据

示例:
  node stats-manager.js update-all
  node stats-manager.js update-user 123
  node stats-manager.js verify
  `);
}

async function showStatus() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接正常');
    
    const { User, UserStats, Download, AnnounceLog } = require('./models');
    
    const [userCount, statsCount, downloadCount, logCount] = await Promise.all([
      User.count(),
      UserStats.count(),
      Download.count(),
      AnnounceLog.count()
    ]);
    
    console.log('\n📊 数据库统计:');
    console.log(`用户总数: ${userCount}`);
    console.log(`统计记录: ${statsCount}`);
    console.log(`下载记录: ${downloadCount}`);
    console.log(`公告日志: ${logCount}`);
    
    console.log('\n🤖 调度器状态:');
    const schedulerStatus = statsScheduler.getStatus();
    console.log(`运行状态: ${schedulerStatus.running ? '运行中' : '已停止'}`);
    console.log(`任务数量: ${schedulerStatus.jobs.length}`);
    
  } catch (error) {
    console.error('❌ 获取状态失败:', error.message);
  }
}

async function updateUserStats(userId) {
  try {
    console.log(`开始更新用户 ${userId} 的统计...`);
    const { updateUserStats: updateSingleUser } = require('./update-user-stats');
    await updateSingleUser(parseInt(userId));
    console.log('✅ 用户统计更新完成');
  } catch (error) {
    console.error('❌ 更新用户统计失败:', error.message);
  }
}

async function verifyStatsConsistency() {
  try {
    console.log('开始验证统计数据一致性...');
    
    const { User, UserStats, Download } = require('./models');
    const { Sequelize } = require('sequelize');
    
    // 获取所有用户的统计对比
    const inconsistencies = [];
    
    const users = await User.findAll({
      include: [{
        model: UserStats,
        as: 'UserStat'
      }]
    });
    
    for (const user of users) {
      // 从下载记录计算实际数据
      const actualStats = await Download.findAll({
        where: { user_id: user.id },
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('uploaded')), 'total_uploaded'],
          [Sequelize.fn('SUM', Sequelize.col('downloaded')), 'total_downloaded']
        ],
        raw: true
      });
      
      const actualUploaded = parseInt(actualStats[0]?.total_uploaded || 0);
      const actualDownloaded = parseInt(actualStats[0]?.total_downloaded || 0);
      
      const recordedUploaded = user.UserStat?.uploaded || 0;
      const recordedDownloaded = user.UserStat?.downloaded || 0;
      
      if (actualUploaded !== recordedUploaded || actualDownloaded !== recordedDownloaded) {
        inconsistencies.push({
          userId: user.id,
          username: user.username,
          actual: { uploaded: actualUploaded, downloaded: actualDownloaded },
          recorded: { uploaded: recordedUploaded, downloaded: recordedDownloaded }
        });
      }
    }
    
    if (inconsistencies.length === 0) {
      console.log('✅ 所有用户统计数据一致');
    } else {
      console.log(`⚠️  发现 ${inconsistencies.length} 个用户的统计数据不一致:`);
      inconsistencies.forEach(inc => {
        console.log(`用户 ${inc.username} (ID: ${inc.userId}):`);
        console.log(`  实际: 上传 ${inc.actual.uploaded}, 下载 ${inc.actual.downloaded}`);
        console.log(`  记录: 上传 ${inc.recorded.uploaded}, 下载 ${inc.recorded.downloaded}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
}

async function cleanupExpiredData() {
  try {
    console.log('开始清理过期数据...');
    
    const { AnnounceLog } = require('./models');
    const { Sequelize } = require('sequelize');
    
    // 删除90天前的announce日志
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const deleteCount = await AnnounceLog.destroy({
      where: {
        created_at: {
          [Sequelize.Op.lt]: ninetyDaysAgo
        }
      }
    });
    
    console.log(`✅ 清理完成，删除了 ${deleteCount} 条过期日志`);
    
  } catch (error) {
    console.error('❌ 清理失败:', error.message);
  }
}

async function resetUserStats(userId) {
  try {
    console.log(`重置用户 ${userId} 的统计数据...`);
    
    const { UserStats } = require('./models');
    
    await UserStats.destroy({
      where: { user_id: parseInt(userId) }
    });
    
    // 重新创建统计记录
    await updateUserStats(userId);
    
    console.log('✅ 用户统计数据重置完成');
    
  } catch (error) {
    console.error('❌ 重置失败:', error.message);
  }
}

async function main() {
  try {
    // help 不需要数据库连接
    if (command === 'help' || command === undefined) {
      await showHelp();
      return;
    }

    await sequelize.authenticate();
    
    switch (command) {
      case 'status':
        await showStatus();
        break;
        
      case 'update-all':
        await updateAllUserStats();
        break;
        
      case 'update-user':
        if (!args[1]) {
          console.error('❌ 请提供用户ID');
          process.exit(1);
        }
        await updateUserStats(args[1]);
        break;
        
      case 'scheduler-start':
        statsScheduler.start();
        console.log('✅ 统计调度器已启动');
        break;
        
      case 'scheduler-stop':
        statsScheduler.stop();
        console.log('⏹️  统计调度器已停止');
        break;
        
      case 'scheduler-status':
        const status = statsScheduler.getStatus();
        console.log('调度器状态:', status);
        break;
        
      case 'scheduler-trigger':
        await statsScheduler.manualUpdate();
        console.log('✅ 手动统计更新完成');
        break;
        
      case 'verify':
        await verifyStatsConsistency();
        break;
        
      case 'cleanup':
        await cleanupExpiredData();
        break;
        
      case 'reset-user':
        if (!args[1]) {
          console.error('❌ 请提供用户ID');
          process.exit(1);
        }
        await resetUserStats(args[1]);
        break;
        
      default:
        console.error(`❌ 未知命令: ${command}`);
        await showHelp();
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  showStatus,
  updateUserStats,
  verifyStatsConsistency,
  cleanupExpiredData,
  resetUserStats
};

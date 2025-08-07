/**
 * 测试做种状态修复
 * 验证Download记录状态是否正确更新
 */

// 加载环境变量
require('dotenv').config();

const { sequelize, User, Torrent, Download, Peer } = require('./models');
const { Op } = require('sequelize');

async function testSeedingStateFix() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 获取一些测试数据
    const users = await User.findAll({ limit: 3 });
    const torrents = await Torrent.findAll({ limit: 3 });
    
    console.log(`\n📊 当前下载记录状态分布:`);
    
    const statusCounts = await Download.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    statusCounts.forEach(stat => {
      console.log(`  ${stat.status}: ${stat.count} 个`);
    });

    // 显示每个用户的做种统计
    console.log(`\n👥 用户做种统计:`);
    for (const user of users) {
      const [seedingCount, downloadingCount, stoppedCount] = await Promise.all([
        Download.count({ where: { user_id: user.id, status: 'seeding' } }),
        Download.count({ where: { user_id: user.id, status: 'downloading' } }),
        Download.count({ where: { user_id: user.id, status: 'stopped' } })
      ]);
      
      console.log(`  用户 ${user.username}: 做种 ${seedingCount}, 下载 ${downloadingCount}, 停止 ${stoppedCount}`);
    }

    // 检查是否有left=0但status不是seeding的记录
    console.log(`\n🔍 检查状态不一致的记录:`);
    const inconsistentRecords = await Download.findAll({
      where: {
        left: 0,
        status: { [Op.ne]: 'seeding' }
      },
      include: [
        { model: User, attributes: ['username'] },
        { model: Torrent, attributes: ['name'] }
      ]
    });
    
    if (inconsistentRecords.length === 0) {
      console.log('  ✅ 没有发现状态不一致的记录');
    } else {
      console.log(`  ⚠️  发现 ${inconsistentRecords.length} 个状态不一致的记录:`);
      inconsistentRecords.forEach(record => {
        console.log(`    用户 ${record.User?.username} - 种子 ${record.Torrent?.name} - left: ${record.left}, status: ${record.status}`);
      });
    }

    // 检查活跃的peer数据
    console.log(`\n🔗 活跃Peer统计:`);
    const activePeers = await Peer.findAll({
      attributes: [
        'left',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        last_announce: {
          [Op.gte]: new Date(Date.now() - 2 * 60 * 60 * 1000) // 最近2小时
        }
      },
      group: ['left'],
      raw: true
    });
    
    const seedingPeers = activePeers.filter(p => parseInt(p.left) === 0);
    const downloadingPeers = activePeers.filter(p => parseInt(p.left) > 0);
    
    console.log(`  活跃做种者: ${seedingPeers.reduce((sum, p) => sum + parseInt(p.count), 0)} 个`);
    console.log(`  活跃下载者: ${downloadingPeers.reduce((sum, p) => sum + parseInt(p.count), 0)} 个`);

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 运行测试
if (require.main === module) {
  testSeedingStateFix();
}

module.exports = { testSeedingStateFix };

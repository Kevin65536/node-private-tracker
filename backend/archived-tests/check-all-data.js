require('dotenv').config();
const { sequelize, User, Torrent, UserStats, Category, Download } = require('./models');

async function checkAllData() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查用户
    const users = await User.findAll();
    console.log(`\n👥 用户数据 (${users.length} 个用户):`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, 用户名: ${user.username}, 角色: ${user.role}, 状态: ${user.status}`);
    });

    // 检查种子
    const torrents = await Torrent.findAll();
    console.log(`\n🌱 种子数据 (${torrents.length} 个种子):`);
    torrents.forEach(torrent => {
      console.log(`- ID: ${torrent.id}, 名称: ${torrent.name}, 状态: ${torrent.status}`);
    });

    const approvedTorrents = await Torrent.count({ where: { status: 'approved' } });
    const pendingTorrents = await Torrent.count({ where: { status: 'pending' } });
    
    console.log(`\n📊 种子统计:`);
    console.log(`- 已审核种子: ${approvedTorrents}`);
    console.log(`- 待审核种子: ${pendingTorrents}`);
    console.log(`- 总种子数: ${torrents.length}`);

    // 检查用户统计
    const userStats = await UserStats.findAll();
    console.log(`\n📈 用户统计数据 (${userStats.length} 条记录):`);
    userStats.forEach(stat => {
      console.log(`- 用户ID: ${stat.user_id}, 上传: ${stat.uploaded}, 下载: ${stat.downloaded}`);
    });

    // 检查分类
    const categories = await Category.findAll();
    console.log(`\n📂 分类数据 (${categories.length} 个分类):`);
    categories.forEach(category => {
      console.log(`- ID: ${category.id}, 名称: ${category.name}`);
    });

  } catch (error) {
    console.error('❌ 检查数据失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkAllData();

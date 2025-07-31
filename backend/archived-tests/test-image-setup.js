const { Torrent } = require('./models');

(async () => {
  try {
    console.log('查询数据库中的种子记录...');
    
    // 查找所有种子
    const allTorrents = await Torrent.findAll({
      attributes: ['id', 'name', 'image_files'],
      limit: 5
    });
    
    console.log(`\n找到 ${allTorrents.length} 个种子:`);
    allTorrents.forEach(torrent => {
      console.log(`- ID: ${torrent.id}, 名称: "${torrent.name}", 图片: ${JSON.stringify(torrent.image_files)}`);
    });
    
    // 如果第一个种子没有图片，给它添加图片
    if (allTorrents.length > 0) {
      const firstTorrent = allTorrents[0];
      if (!firstTorrent.image_files || firstTorrent.image_files.length === 0) {
        console.log(`\n为种子 "${firstTorrent.name}" (ID: ${firstTorrent.id}) 添加测试图片...`);
        
        await firstTorrent.update({
          image_files: ['1753970989559-73f0f934da8200f1.png']
        });
        
        console.log('✅ 图片添加成功!');
        console.log(`🔗 种子详情页面: http://localhost:3000/torrents/${firstTorrent.id}`);
      } else {
        console.log(`\n✅ 种子 "${firstTorrent.name}" 已经有图片了`);
        console.log(`🔗 种子详情页面: http://localhost:3000/torrents/${firstTorrent.id}`);
      }
    } else {
      console.log('\n❌ 数据库中没有种子记录');
    }
    
  } catch (error) {
    console.error('操作失败:', error.message);
  }
  
  process.exit(0);
})();

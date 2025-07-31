const { Torrent } = require('./models');

(async () => {
  try {
    const torrents = await Torrent.findAll({
      where: {
        image_files: { [require('sequelize').Op.ne]: null }
      },
      attributes: ['id', 'name', 'image_files']
    });
    
    console.log('有图片的种子：');
    torrents.forEach(t => {
      console.log(`ID: ${t.id}, 名称: ${t.name}, 图片: ${JSON.stringify(t.image_files)}`);
    });
    
    if (torrents.length === 0) {
      console.log('没有找到包含图片的种子');
    }
  } catch (error) {
    console.error('查询失败:', error.message);
  }
  process.exit(0);
})();

const { Torrent } = require('./models');

async function checkTorrents() {
  try {
    const torrents = await Torrent.findAll({
      where: { 
        image_files: { 
          [require('sequelize').Op.not]: null 
        } 
      },
      attributes: ['id', 'name', 'image_files']
    });
    
    console.log('找到有图片的种子:');
    if (torrents.length === 0) {
      console.log('没有找到包含图片的种子');
    } else {
      torrents.forEach(t => {
        console.log(`ID: ${t.id}, Name: ${t.name}, Images: ${JSON.stringify(t.image_files)}`);
      });
    }
    
    // 检查所有种子的image_files字段
    console.log('\n所有种子的image_files字段:');
    const allTorrents = await Torrent.findAll({
      attributes: ['id', 'name', 'image_files']
    });
    
    allTorrents.forEach(t => {
      console.log(`ID: ${t.id}, Name: ${t.name}, Images: ${t.image_files}`);
    });
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTorrents();

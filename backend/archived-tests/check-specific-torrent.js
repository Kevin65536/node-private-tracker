require('dotenv').config();
const { Torrent } = require('./models');

async function checkSpecificTorrent() {
  try {
    // 查找包含该图片文件的种子
    const torrents = await Torrent.findAll({
      attributes: ['id', 'name', 'image_files'],
      raw: true
    });
    
    console.log('所有种子的图片信息:');
    torrents.forEach(t => {
      console.log(`ID: ${t.id}`);
      console.log(`Name: ${t.name}`);
      console.log(`Image files type: ${typeof t.image_files}`);
      console.log(`Image files content: ${JSON.stringify(t.image_files)}`);
      console.log('---');
    });
    
    // 查找特定的种子
    const targetImageFile = '1753970989559-73f0f934da8200f1.png';
    const torrentWithImage = torrents.find(t => {
      if (Array.isArray(t.image_files)) {
        return t.image_files.includes(targetImageFile);
      }
      if (typeof t.image_files === 'string') {
        try {
          const parsed = JSON.parse(t.image_files);
          return Array.isArray(parsed) && parsed.includes(targetImageFile);
        } catch (e) {
          return false;
        }
      }
      return false;
    });
    
    if (torrentWithImage) {
      console.log(`\n找到包含图片 ${targetImageFile} 的种子:`);
      console.log(`种子ID: ${torrentWithImage.id}`);
      console.log(`种子名称: ${torrentWithImage.name}`);
    } else {
      console.log(`\n未找到包含图片 ${targetImageFile} 的种子`);
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    process.exit(0);
  }
}

checkSpecificTorrent();

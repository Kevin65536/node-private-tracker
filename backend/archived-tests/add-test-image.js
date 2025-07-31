const { Torrent } = require('./models');

(async () => {
  try {
    // 查找第一个种子并添加图片
    const torrent = await Torrent.findOne();
    
    if (torrent) {
      await torrent.update({
        image_files: ['1753970989559-73f0f934da8200f1.png']
      });
      
      console.log(`已为种子 "${torrent.name}" (ID: ${torrent.id}) 添加图片`);
    } else {
      console.log('没有找到种子');
    }
  } catch (error) {
    console.error('更新失败:', error.message);
  }
  process.exit(0);
})();

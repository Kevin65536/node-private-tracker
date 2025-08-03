require('dotenv').config();
const { Torrent, User } = require('./models');

async function checkNinjaTorrents() {
  try {
    console.log('🔍 查找忍者杀手相关种子...\n');
    
    const torrents = await Torrent.findAll({
      where: { 
        name: { 
          [require('sequelize').Op.like]: '%忍者杀手%' 
        } 
      },
      include: [{ 
        model: User, 
        as: 'uploader', 
        attributes: ['id', 'username'] 
      }]
    });
    
    if (torrents.length === 0) {
      console.log('❌ 没有找到忍者杀手相关的种子');
      return;
    }
    
    console.log(`📋 找到 ${torrents.length} 个忍者杀手相关种子:\n`);
    
    torrents.forEach((torrent, index) => {
      console.log(`${index + 1}. 种子信息:`);
      console.log(`   ID: ${torrent.id}`);
      console.log(`   名称: ${torrent.name}`);
      console.log(`   上传者: ${torrent.uploader?.username || '未知'}`);
      console.log(`   info_hash: ${torrent.info_hash}`);
      console.log(`   文件路径: ${torrent.torrent_file}`);
      console.log(`   状态: ${torrent.status}`);
      console.log(`   大小: ${torrent.size} bytes`);
      console.log(`   创建时间: ${torrent.created_at}`);
      console.log('   ─────────────────────────────────────────');
    });
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  }
}

// 运行查询
if (require.main === module) {
  checkNinjaTorrents();
}

module.exports = { checkNinjaTorrents };
